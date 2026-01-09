import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  ChangePasswordDto,
  ResetPasswordDto,
  UpdatePermissionsDto,
  UserListResponseDto,
} from './dto/user.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserRole } from '@prisma/client';
import { getRolePermissions } from './permissions';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;
  private readonly MAX_FAILED_LOGINS = 5;
  private readonly LOCK_DURATION_MINUTES = 30;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // ===========================================
  // CREATE USER
  // ===========================================

  async create(tenantId: string, dto: CreateUserDto): Promise<UserResponseDto> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { tenantId, phone: dto.phone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException('User with this email already exists');
      }
      if (existingUser.phone === dto.phone) {
        throw new ConflictException('User with this phone already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // Get default permissions for role
    const defaultPermissions = getRolePermissions(dto.role || UserRole.EMPLOYEE);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        name: dto.name,
        avatar: dto.avatar,
        role: dto.role || UserRole.EMPLOYEE,
        permissions: dto.permissions || defaultPermissions,
        customRole: dto.customRole,
        mustChangePw: dto.mustChangePw ?? true,
        active: dto.active ?? true,
      },
      select: this.getUserSelectFields(),
    });

    return this.mapUserToResponse(user);
  }

  // ===========================================
  // FIND ALL USERS
  // ===========================================

  async findAll(
    tenantId: string,
    options?: {
      role?: UserRole;
      active?: boolean;
      page?: number;
      pageSize?: number;
    },
  ): Promise<UserListResponseDto> {
    const where: any = { tenantId };

    if (options?.role) {
      where.role = options.role;
    }

    if (options?.active !== undefined) {
      where.active = options.active;
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: this.getUserSelectFields(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => this.mapUserToResponse(u)),
      total,
      page,
      pageSize,
    };
  }

  // ===========================================
  // FIND ONE USER
  // ===========================================

  async findOne(tenantId: string, userId: string): Promise<UserResponseDto> {
    const cacheKey = `user:${userId}`;
    const cached = await this.cacheManager.get<UserResponseDto>(cacheKey);
    if (cached && cached.tenantId === tenantId) return cached;

    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: this.getUserSelectFields(),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const response = this.mapUserToResponse(user);
    await this.cacheManager.set(cacheKey, response, 300000); // 5 min
    return response;
  }

  // ===========================================
  // FIND BY EMAIL
  // ===========================================

  async findByEmail(email: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });
  }

  // ===========================================
  // UPDATE USER
  // ===========================================

  async update(
    tenantId: string,
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check if new email is already taken
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          id: { not: userId },
        },
      });
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    // Check if new phone is already taken
    if (dto.phone && dto.phone !== existingUser.phone) {
      const phoneExists = await this.prisma.user.findFirst({
        where: {
          tenantId,
          phone: dto.phone,
          id: { not: userId },
        },
      });
      if (phoneExists) {
        throw new ConflictException('Phone already in use');
      }
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: dto.email,
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        name: dto.name,
        avatar: dto.avatar,
        role: dto.role,
        permissions: dto.permissions,
        customRole: dto.customRole,
        mustChangePw: dto.mustChangePw,
        active: dto.active,
      },
      select: this.getUserSelectFields(),
    });

    // Invalidate cache
    await this.cacheManager.del(`user:${userId}`);

    return this.mapUserToResponse(user);
  }

  // ===========================================
  // REMOVE USER (Soft delete - set active=false)
  // ===========================================

  async remove(tenantId: string, userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete - deactivate user
    await this.prisma.user.update({
      where: { id: userId },
      data: { active: false },
    });

    // Invalidate cache
    await this.cacheManager.del(`user:${userId}`);
  }

  // ===========================================
  // CHANGE PASSWORD (by user)
  // ===========================================

  async changePassword(
    tenantId: string,
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);

    // Update password and reset mustChangePw
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePw: false,
        failedLogins: 0, // Reset failed logins
        lockedUntil: null, // Unlock if was locked
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`user:${userId}`);
  }

  // ===========================================
  // RESET PASSWORD (Admin only)
  // ===========================================

  async resetPassword(
    tenantId: string,
    userId: string,
    dto: ResetPasswordDto,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePw: dto.mustChangePw ?? true,
        failedLogins: 0,
        lockedUntil: null,
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`user:${userId}`);
  }

  // ===========================================
  // UPDATE PERMISSIONS
  // ===========================================

  async updatePermissions(
    tenantId: string,
    userId: string,
    dto: UpdatePermissionsDto,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update permissions
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissions: dto.permissions,
      },
      select: this.getUserSelectFields(),
    });

    // Invalidate cache
    await this.cacheManager.del(`user:${userId}`);

    return this.mapUserToResponse(updatedUser);
  }

  // ===========================================
  // HANDLE FAILED LOGIN
  // ===========================================

  async handleFailedLogin(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const failedLogins = user.failedLogins + 1;
    const updateData: any = { failedLogins };

    // Lock account if too many failed attempts
    if (failedLogins >= this.MAX_FAILED_LOGINS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + this.LOCK_DURATION_MINUTES);
      updateData.lockedUntil = lockUntil;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Invalidate cache
    await this.cacheManager.del(`user:${userId}`);
  }

  // ===========================================
  // HANDLE SUCCESSFUL LOGIN
  // ===========================================

  async handleSuccessfulLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
        failedLogins: 0,
        lockedUntil: null,
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`user:${userId}`);
  }

  // ===========================================
  // CHECK IF USER IS LOCKED
  // ===========================================

  async isUserLocked(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true },
    });

    if (!user || !user.lockedUntil) return false;

    return new Date() < user.lockedUntil;
  }

  // ===========================================
  // UNLOCK USER
  // ===========================================

  async unlockUser(tenantId: string, userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLogins: 0,
        lockedUntil: null,
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`user:${userId}`);
  }

  // ===========================================
  // HELPER: Select fields
  // ===========================================

  private getUserSelectFields() {
    return {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      name: true,
      avatar: true,
      role: true,
      permissions: true,
      customRole: true,
      active: true,
      mustChangePw: true,
      lastLogin: true,
      failedLogins: true,
      lockedUntil: true,
      tenantId: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  // ===========================================
  // HELPER: Map user to response DTO
  // ===========================================

  private mapUserToResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      permissions: user.permissions || [],
      customRole: user.customRole,
      active: user.active,
      mustChangePw: user.mustChangePw,
      lastLogin: user.lastLogin,
      failedLogins: user.failedLogins,
      lockedUntil: user.lockedUntil,
      tenantId: user.tenantId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
