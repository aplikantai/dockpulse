import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PortalAuthService, PortalJwtPayload } from '../portal-auth.service';

export interface PortalRequest extends Request {
  portalUser: PortalJwtPayload;
}

@Injectable()
export class PortalAuthGuard implements CanActivate {
  constructor(private readonly portalAuthService: PortalAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PortalRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Brak tokenu autoryzacji');
    }

    const payload = this.portalAuthService.validateToken(token);

    if (!payload) {
      throw new UnauthorizedException('Nieprawidłowy lub wygasły token');
    }

    if (payload.type !== 'portal') {
      throw new UnauthorizedException('Nieprawidłowy typ tokenu');
    }

    // Attach portal user to request
    request.portalUser = payload;

    return true;
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Also check cookie for portal session
    const cookieToken = request.cookies?.portal_session;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }
}
