import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import {
  LoginDto,
  RegisterDto,
  AuthResponseWithRefresh,
  JwtPayload,
  ChangePasswordResponse,
  LogoutResponse,
  ForgotPasswordDto,
  ForgotPasswordResponse,
  ResetPasswordDto,
  ResetPasswordResponse,
} from './dto/auth.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private generateTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '1h'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { accessToken, refreshToken };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await (this.prisma as any).user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(dto: LoginDto, tenantSlug: string): Promise<AuthResponseWithRefresh> {
    const user = await this.validateUser(dto.email, dto.password);

    // Resolve tenant by slug to get the actual ID
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant');
    }

    if (user.tenantId !== tenant.id) {
      throw new UnauthorizedException('User does not belong to this tenant');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async register(dto: RegisterDto, tenantSlug: string): Promise<AuthResponseWithRefresh> {
    // Resolve tenant by slug to get the actual ID
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant');
    }

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
        tenantId: tenant.id,
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  async getUserById(userId: string): Promise<any> {
    const cacheKey = `user:${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
      },
    });

    if (user) {
      await this.cacheManager.set(cacheKey, user, 300000); // 5 min
    }

    return user;
  }

  // ============================================
  // REFRESH TOKEN
  // ============================================

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.getUserById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };

      return this.generateTokens(newPayload);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ============================================
  // CHANGE PASSWORD
  // ============================================

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResponse> {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    await (this.prisma as any).user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate user cache
    await this.cacheManager.del(`user:${userId}`);

    return { message: 'Password changed successfully' };
  }

  // ============================================
  // LOGOUT
  // ============================================

  async logout(userId: string): Promise<LogoutResponse> {
    // Invalidate user cache
    await this.cacheManager.del(`user:${userId}`);

    // In a production environment, you might want to:
    // 1. Add token to a blacklist (Redis)
    // 2. Invalidate all refresh tokens for this user

    return { message: 'Logged out successfully' };
  }

  // ============================================
  // FORGOT PASSWORD / RESET PASSWORD
  // ============================================

  /**
   * Request password reset - generates token and sends email
   * For now, returns token in response (in production, send via email)
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    // Find user by email
    const user = await (this.prisma as any).user.findFirst({
      where: { email: dto.email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Delete any existing unused tokens for this user
    await (this.prisma as any).passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    // Create new reset token
    await (this.prisma as any).passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO: Send email with reset link
    // For now, we'll log the token (in production, send via email)
    console.log(`[FORGOT PASSWORD] Reset token for ${user.email}: ${token}`);
    console.log(`[FORGOT PASSWORD] Reset link: http://localhost:3000/reset-password?token=${token}`);

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  /**
   * Reset password using token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResponse> {
    // Find valid token
    const resetToken = await (this.prisma as any).passwordResetToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Check if token was already used
    if (resetToken.usedAt) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);

    // Update user password
    await (this.prisma as any).user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await (this.prisma as any).passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    // Invalidate user cache
    await this.cacheManager.del(`user:${resetToken.userId}`);

    return { message: 'Password reset successfully' };
  }
}
