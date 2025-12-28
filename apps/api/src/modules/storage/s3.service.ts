import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { UploadResult, StorageConfig } from './interfaces/storage.interface';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private config: StorageConfig;

  async onModuleInit() {
    this.config = {
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      accessKey: process.env.S3_ACCESS_KEY || 'dockpulse',
      secretKey: process.env.S3_SECRET_KEY || 'dockpulse_dev',
      bucket: process.env.S3_BUCKET || 'dockpulse',
      region: process.env.S3_REGION || 'us-east-1',
      publicUrl: process.env.S3_PUBLIC_URL,
    };

    this.s3Client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
      forcePathStyle: true, // Required for MinIO
    });

    await this.ensureBucketExists();
  }

  /**
   * Ensure S3 bucket exists, create if not
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.config.bucket }));
      this.logger.log(`Bucket "${this.config.bucket}" exists`);
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.config.bucket }));
          this.logger.log(`Bucket "${this.config.bucket}" created`);
        } catch (createError: any) {
          this.logger.warn(`Could not create bucket: ${createError.message}`);
        }
      } else {
        this.logger.warn(`Could not check bucket: ${error.message}`);
      }
    }
  }

  /**
   * Upload file to S3
   */
  async upload(
    key: string,
    buffer: Buffer,
    contentType: string = 'application/octet-stream',
  ): Promise<UploadResult> {
    const startTime = Date.now();

    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      const url = this.getPublicUrl(key);
      this.logger.log(`Uploaded ${key} in ${Date.now() - startTime}ms`);

      return {
        key,
        url,
        contentType,
        size: buffer.length,
      };
    } catch (error: any) {
      this.logger.error(`Failed to upload ${key}: ${error.message}`);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Upload file from URL
   */
  async uploadFromUrl(
    key: string,
    url: string,
    contentType?: string,
  ): Promise<UploadResult> {
    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DockPulse/1.0)',
        },
      });

      const buffer = Buffer.from(response.data);
      const detectedContentType =
        contentType ||
        response.headers['content-type'] ||
        'application/octet-stream';

      return this.upload(key, buffer, detectedContentType);
    } catch (error: any) {
      this.logger.error(`Failed to upload from URL ${url}: ${error.message}`);
      throw new Error(`S3 upload from URL failed: ${error.message}`);
    }
  }

  /**
   * Download file from S3
   */
  async download(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const chunks: Uint8Array[] = [];

      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error: any) {
      this.logger.error(`Failed to download ${key}: ${error.message}`);
      throw new Error(`S3 download failed: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   */
  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted: ${key}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete ${key}: ${error.message}`);
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  /**
   * Get public URL for a key
   */
  getPublicUrl(key: string): string {
    if (this.config.publicUrl) {
      return `${this.config.publicUrl}/${key}`;
    }
    return `${this.config.endpoint}/${this.config.bucket}/${key}`;
  }

  /**
   * Generate a unique key for tenant assets
   */
  generateAssetKey(tenantSlug: string, assetType: string, filename: string): string {
    const timestamp = Date.now();
    const ext = filename.split('.').pop() || 'bin';
    return `tenants/${tenantSlug}/${assetType}/${timestamp}.${ext}`;
  }
}
