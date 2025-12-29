import { Module } from '@nestjs/common';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';
import { OpenRouterService } from './services/openrouter.service';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [StorageModule, PrismaModule],
  controllers: [BrandingController],
  providers: [BrandingService, OpenRouterService],
  exports: [BrandingService, OpenRouterService],
})
export class BrandingModule {}
