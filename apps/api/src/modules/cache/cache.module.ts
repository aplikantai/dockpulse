import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        // If Redis is configured, use it
        if (redisUrl) {
          const { redisStore } = await import('cache-manager-redis-yet');
          return {
            store: redisStore,
            url: redisUrl,
            ttl: 300000, // 5 minutes default
          };
        }

        // Fallback to in-memory cache
        return {
          ttl: 300000, // 5 minutes
          max: 100, // Maximum items in cache
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
