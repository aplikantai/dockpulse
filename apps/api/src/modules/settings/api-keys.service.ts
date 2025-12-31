import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as crypto from 'crypto';

export interface CreateApiKeyDto {
  name: string;
  service: 'openrouter' | 'openai' | 'anthropic';
  apiKey: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  service: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: Date | null;
  createdAt: Date;
  maskedKey: string;
}

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);
  private readonly encryptionKey: string;

  constructor(private readonly prisma: PrismaService) {
    // Use JWT_SECRET as encryption key (first 32 chars for AES-256)
    this.encryptionKey = (process.env.JWT_SECRET || 'default-key-for-development').substring(0, 32).padEnd(32, '0');
  }

  /**
   * Encrypt API key before storing
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt API key when retrieving
   */
  private decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Mask API key for display (show first 8 and last 4 chars)
   */
  private maskKey(key: string): string {
    if (key.length <= 12) return '****';
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  }

  /**
   * Create or update API key for tenant
   */
  async upsertApiKey(tenantId: string, dto: CreateApiKeyDto): Promise<ApiKeyResponse> {
    const encryptedKey = this.encrypt(dto.apiKey);

    const apiKey = await this.prisma.apiKey.upsert({
      where: {
        tenantId_service: {
          tenantId,
          service: dto.service,
        },
      },
      update: {
        name: dto.name,
        apiKey: encryptedKey,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        name: dto.name,
        service: dto.service,
        apiKey: encryptedKey,
        isActive: true,
      },
    });

    this.logger.log(`API key for ${dto.service} updated for tenant ${tenantId} (${dto.name})`);

    return {
      id: apiKey.id,
      name: apiKey.name,
      service: apiKey.service,
      isActive: apiKey.isActive,
      usageCount: apiKey.usageCount,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
      maskedKey: this.maskKey(dto.apiKey),
    };
  }

  /**
   * Get all API keys for tenant (masked)
   */
  async getApiKeys(tenantId: string): Promise<ApiKeyResponse[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      service: key.service,
      isActive: key.isActive,
      usageCount: key.usageCount,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      maskedKey: this.maskKey(this.decrypt(key.apiKey)),
    }));
  }

  /**
   * Get decrypted API key for service (internal use only)
   */
  async getDecryptedKey(tenantId: string, service: string): Promise<string | null> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        tenantId_service: {
          tenantId,
          service,
        },
      },
    });

    if (!apiKey || !apiKey.isActive) {
      return null;
    }

    // Update usage stats
    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    return this.decrypt(apiKey.apiKey);
  }

  /**
   * Delete API key
   */
  async deleteApiKey(tenantId: string, keyId: string): Promise<void> {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, tenantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.delete({
      where: { id: keyId },
    });

    this.logger.log(`API key ${keyId} deleted for tenant ${tenantId}`);
  }

  /**
   * Toggle API key active status
   */
  async toggleApiKey(tenantId: string, keyId: string): Promise<ApiKeyResponse> {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, tenantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    const updated = await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: !key.isActive },
    });

    return {
      id: updated.id,
      name: updated.name,
      service: updated.service,
      isActive: updated.isActive,
      usageCount: updated.usageCount,
      lastUsedAt: updated.lastUsedAt,
      createdAt: updated.createdAt,
      maskedKey: this.maskKey(this.decrypt(updated.apiKey)),
    };
  }
}
