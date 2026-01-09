import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { AdminLoginDto, AdminLoginResponse } from '../dto/admin-auth.dto';
import * as bcrypt from 'bcrypt';

/**
 * AdminAuthService - Authentication for Platform Admins
 */
@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Platform Admin Login
   * Checks:
   * 1. User exists with this email
   * 2. Password is correct
   * 3. User has role = 'PLATFORM_ADMIN' OR email in PLATFORM_ADMIN_EMAILS
   */
  async login(dto: AdminLoginDto): Promise<AdminLoginResponse> {
    this.logger.log(`Platform admin login attempt: ${dto.email}`);

    // Find user by email (from ANY tenant - admins can be in any tenant)
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is Platform Admin
    const isPlatformAdmin = this.isPlatformAdmin(user);
    if (!isPlatformAdmin) {
      throw new UnauthorizedException('Platform admin access required');
    }

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isPlatformAdmin: true,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign({ ...payload, type: 'refresh' });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    this.logger.log(`Platform admin logged in: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Check if user is Platform Admin
   * - Has role 'PLATFORM_ADMIN' OR
   * - Email is in PLATFORM_ADMIN_EMAILS env variable
   */
  private isPlatformAdmin(user: any): boolean {
    // Check role
    if (user.role === 'PLATFORM_ADMIN') {
      return true;
    }

    // Check email whitelist
    const platformAdminEmails = (
      process.env.PLATFORM_ADMIN_EMAILS || ''
    ).split(',').map(email => email.trim());

    if (platformAdminEmails.includes(user.email)) {
      return true;
    }

    return false;
  }
}
