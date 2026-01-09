import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import {
  PlatformLoginDto,
  CreatePlatformAdminDto,
} from './dto/platform.dto';
import { PlatformAdminPayload } from './guards/platform-admin.guard';
import { UserRole } from '@prisma/client';

@Injectable()
export class PlatformAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // TODO: Refactor after plan/status moved to settings JSON
  async login(dto: PlatformLoginDto): Promise<{
    access_token: string;
    admin: {
      id: string;
      email: string;
      name: string;
      isSuperAdmin: boolean;
    };
  }> {
    // Platform admins are stored in a separate table or with special flag
    const admin = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM platform_admins
      WHERE email = ${dto.email}
      LIMIT 1
    `.catch(() => []);

    // If no platform_admins table, fallback to check for special users
    let adminUser = admin[0];

    if (!adminUser) {
      // Check for super admin in users table (tenantId IS NULL)
      const users = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          tenantId: null as any, // Platform-level admin
          // active: true, // Removed - field doesn't exist in schema
        },
      });

      if (users) {
        adminUser = {
          id: users.id,
          email: users.email,
          name: users.name,
          password: users.password,
          isSuperAdmin: users.role === UserRole.PLATFORM_ADMIN,
        };
      }
    }

    if (!adminUser) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło');
    }

    const isValid = await bcrypt.compare(dto.password, adminUser.password);
    if (!isValid) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło');
    }

    const payload: PlatformAdminPayload = {
      sub: adminUser.id,
      email: adminUser.email,
      type: 'platform-admin',
      isSuperAdmin: adminUser.isSuperAdmin ?? false,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.PLATFORM_JWT_SECRET || process.env.JWT_SECRET,
      expiresIn: '24h',
    });

    return {
      access_token,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        isSuperAdmin: adminUser.isSuperAdmin ?? false,
      },
    };
  }

  // TODO: Refactor after plan/status moved to settings JSON
  async createAdmin(dto: CreatePlatformAdminDto): Promise<any> {
    // Check if email exists
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId: null as any },
    });

    if (existing) {
      throw new ConflictException('Admin z tym emailem już istnieje');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create platform admin (user without tenantId)
    const admin = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: dto.isSuperAdmin ? 'super_admin' : 'platform_admin',
        // active: true, // Removed - field doesn't exist in schema
        // tenantId is null for platform admins
      } as any,
    });

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
  }

  // TODO: Refactor after plan/status moved to settings JSON
  async getAdmins(): Promise<any[]> {
    return this.prisma.user.findMany({
      where: {
        tenantId: null as any,
        role: UserRole.PLATFORM_ADMIN,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        // active: true, // Removed - field doesn't exist in schema
        createdAt: true,
        // lastLogin: true, // Removed - field doesn't exist in schema
      },
    });
  }

  validateToken(token: string): PlatformAdminPayload | null {
    try {
      return this.jwtService.verify<PlatformAdminPayload>(token, {
        secret: process.env.PLATFORM_JWT_SECRET || process.env.JWT_SECRET,
      });
    } catch {
      return null;
    }
  }
}
