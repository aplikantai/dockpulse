import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(tenantId: string, dto: CreateUserDto): Promise<UserResponseDto> {
    // Check if email already exists
    const existingUser = await (this.prisma as any).user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await (this.prisma as any).user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role || 'user',
        tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findAll(tenantId: string): Promise<UserResponseDto[]> {
    return (this.prisma as any).user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, userId: string): Promise<UserResponseDto> {
    const cacheKey = `user:${userId}`;
    const cached = await this.cacheManager.get<UserResponseDto>(cacheKey);
    if (cached && cached.tenantId === tenantId) return cached;

    const user = await (this.prisma as any).user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.cacheManager.set(cacheKey, user, 300000); // 5 min
    return user;
  }

  async update(
    tenantId: string,
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Check if user exists and belongs to tenant
    const existingUser = await (this.prisma as any).user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check if new email is already taken
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await (this.prisma as any).user.findUnique({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    const updateData: any = { ...dto };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    }

    const user = await (this.prisma as any).user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`user:${userId}`);

    return user;
  }

  async remove(tenantId: string, userId: string): Promise<void> {
    const user = await (this.prisma as any).user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await (this.prisma as any).user.delete({
      where: { id: userId },
    });

    // Invalidate cache
    await this.cacheManager.del(`user:${userId}`);
  }
}
