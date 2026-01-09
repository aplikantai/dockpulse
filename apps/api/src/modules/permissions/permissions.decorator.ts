import { SetMetadata } from '@nestjs/common';
import { REQUIRE_MODULE_KEY, ModulePermissionMetadata, PermissionType } from './permissions.guard';

/**
 * Decorator to require module access for an endpoint
 *
 * @example
 * @RequireModule('CRM') - requires read access to CRM
 * @RequireModule('CRM', 'write') - requires write access to CRM
 * @RequireModule('ORDERS', 'delete') - requires delete access to ORDERS
 */
export const RequireModule = (
  moduleCode: string,
  permission?: PermissionType,
) => SetMetadata(REQUIRE_MODULE_KEY, { moduleCode, permission } as ModulePermissionMetadata);
