import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminLoginDto } from '../dto/admin-auth.dto';

/**
 * AdminAuthController - Authentication for Platform Admins
 *
 * Separate from tenant auth - Platform Admins login here
 * Base path: /api/admin/auth
 */
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  /**
   * POST /api/admin/auth/login
   * Platform Admin login
   */
  @Public()
  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }
}
