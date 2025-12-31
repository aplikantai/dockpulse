import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PortalController } from './portal.controller';
import { PortalAuthService } from './portal-auth.service';
import { PortalOrdersService } from './portal-orders.service';
import { PortalQuotesService } from './portal-quotes.service';
import { PortalAuthGuard } from './guards/portal-auth.guard';
import { DatabaseModule } from '../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [PortalController],
  providers: [
    PortalAuthService,
    PortalOrdersService,
    PortalQuotesService,
    PortalAuthGuard,
  ],
  exports: [PortalAuthService, PortalAuthGuard],
})
export class PortalModule {}
