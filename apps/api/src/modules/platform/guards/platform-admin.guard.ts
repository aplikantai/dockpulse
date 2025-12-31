import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface PlatformAdminPayload {
  sub: string;
  email: string;
  type: 'platform-admin';
  isSuperAdmin: boolean;
}

export interface PlatformAdminRequest extends Request {
  platformAdmin: PlatformAdminPayload;
}

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PlatformAdminRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Brak tokenu autoryzacji');
    }

    try {
      const payload = this.jwtService.verify<PlatformAdminPayload>(token, {
        secret: process.env.PLATFORM_JWT_SECRET || process.env.JWT_SECRET,
      });

      if (payload.type !== 'platform-admin') {
        throw new ForbiddenException('Wymagane uprawnienia administratora platformy');
      }

      request.platformAdmin = payload;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Nieprawidłowy lub wygasły token');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const cookieToken = request.cookies?.platform_session;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }
}

@Injectable()
export class SuperAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PlatformAdminRequest>();

    if (!request.platformAdmin) {
      throw new UnauthorizedException('Brak uprawnień');
    }

    if (!request.platformAdmin.isSuperAdmin) {
      throw new ForbiddenException('Wymagane uprawnienia super administratora');
    }

    return true;
  }
}
