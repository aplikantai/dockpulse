import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsGuard } from './guards/permissions.guard';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    UsersController,
    RolesController,
    AuditController,
    PermissionsController,
  ],
  providers: [UsersService, RolesService, AuditService, PermissionsGuard],
  exports: [UsersService, RolesService, AuditService, PermissionsGuard],
})
export class UsersModule {}
