import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions for a route
 *
 * @example
 * @RequirePermission('users:create', 'users:edit')
 * @Post()
 * async createUser() { ... }
 */
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
