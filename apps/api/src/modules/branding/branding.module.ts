import { Module } from '@nestjs/common';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';
import { OpenRouterService } from './services/openrouter.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [BrandingController],
  providers: [BrandingService, OpenRouterService],
  exports: [BrandingService, OpenRouterService],
})
export class BrandingModule {}
