import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController, ApiKeysController],
  providers: [SettingsService, ApiKeysService],
  exports: [SettingsService, ApiKeysService],
})
export class SettingsModule {}
