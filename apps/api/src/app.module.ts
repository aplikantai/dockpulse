import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/database/prisma.module';
import { StorageModule } from './modules/storage/storage.module';
import { BrandingModule } from './modules/branding/branding.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    StorageModule,
    BrandingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
