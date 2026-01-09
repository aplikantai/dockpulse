import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for required submodules
 */
export const REQUIRED_SUBMODULES_KEY = 'requiredSubmodules';

/**
 * @RequireSubmodule decorator
 *
 * Marks a route handler or controller as requiring one or more submodules to be enabled.
 * Used in conjunction with SubmoduleGuard to enforce submodule-based access control.
 *
 * Example usage:
 *
 * ```typescript
 * @Get('segments')
 * @RequireSubmodule('CRM.SEGMENTS')
 * async getSegments() {
 *   // This endpoint requires CRM.SEGMENTS submodule
 * }
 *
 * @Post('export')
 * @RequireSubmodule('CRM.SEGMENTS', 'CRM.EXPORT')
 * async exportSegments() {
 *   // This endpoint requires both CRM.SEGMENTS and CRM.EXPORT
 * }
 * ```
 *
 * @param submodules - One or more submodule codes that must be enabled
 */
export const RequireSubmodule = (...submodules: string[]) =>
  SetMetadata(REQUIRED_SUBMODULES_KEY, submodules);
