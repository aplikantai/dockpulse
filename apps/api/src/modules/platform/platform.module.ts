import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformAdminGuard, SuperAdminGuard } from './guards/platform-admin.guard';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.PLATFORM_JWT_SECRET || process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [PlatformController],
  providers: [
    PlatformService,
    PlatformAuthService,
    PlatformAdminGuard,
    SuperAdminGuard,
  ],
  exports: [PlatformService, PlatformAuthService],
})
export class PlatformModule {}
