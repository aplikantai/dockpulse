import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_SUBMODULES_KEY } from '../decorators/require-submodule.decorator';
import { SubmodulesService } from '../submodules.service';

/**
 * SubmoduleGuard - Authorization guard for submodule-based access control
 *
 * This guard checks if the required submodules (specified via @RequireSubmodule decorator)
 * are enabled for the current tenant before allowing access to a route.
 *
 * Usage:
 * 1. Apply guard globally or to specific controllers
 * 2. Use @RequireSubmodule decorator on routes that need submodule access control
 *
 * Example:
 *
 * ```typescript
 * @Controller('crm')
 * @UseGuards(JwtAuthGuard, SubmoduleGuard)
 * export class CrmController {
 *   @Get('segments')
 *   @RequireSubmodule('CRM.SEGMENTS')
 *   async getSegments() {
 *     // Only accessible if CRM.SEGMENTS is enabled
 *   }
 * }
 * ```
 *
 * If the required submodules are not enabled, the guard throws a ForbiddenException
 * with details about which submodules are missing.
 */
@Injectable()
export class SubmoduleGuard implements CanActivate {
  private readonly logger = new Logger(SubmoduleGuard.name);

  constructor(
    private reflector: Reflector,
    private submodulesService: SubmodulesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required submodules from decorator metadata
    const requiredSubmodules = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_SUBMODULES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no submodules are required, allow access
    if (!requiredSubmodules || requiredSubmodules.length === 0) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenantId) {
      this.logger.warn('SubmoduleGuard: No user or tenantId in request');
      throw new ForbiddenException('Authentication required');
    }

    // Get enabled submodules for the tenant
    const enabledSubmodules =
      await this.submodulesService.getEnabledSubmodules(user.tenantId);

    // Check if all required submodules are enabled
    const missingSubmodules = requiredSubmodules.filter(
      (submodule) => !enabledSubmodules.includes(submodule),
    );

    if (missingSubmodules.length > 0) {
      this.logger.warn(
        `SubmoduleGuard: Access denied for tenant ${user.tenantId}. Missing submodules: ${missingSubmodules.join(', ')}`,
      );

      throw new ForbiddenException({
        statusCode: 403,
        message: 'Access denied: required submodules not enabled',
        requiredSubmodules,
        missingSubmodules,
        error: 'Forbidden',
      });
    }

    // All required submodules are enabled
    return true;
  }
}
