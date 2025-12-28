import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'dockpulse';

    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'dockpulse',
        secretAccessKey: process.env.S3_SECRET_KEY || 'dockpulse_dev',
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  /**
   * Upload file to S3
   */
  async upload(
    key: string,
    buffer: Buffer,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      const publicUrl = this.getPublicUrl(key);
      this.logger.log(`File uploaded: ${publicUrl}`);

      return publicUrl;
    } catch (error) {
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
  ): Promise<string> {
    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const buffer = Buffer.from(response.data);
      const detectedContentType =
        contentType ||
        response.headers['content-type'] ||
        'application/octet-stream';

      return this.upload(key, buffer, detectedContentType);
    } catch (error) {
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
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const chunks: Uint8Array[] = [];

      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
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
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete ${key}: ${error.message}`);
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  /**
   * Get public URL for a key
   */
  getPublicUrl(key: string): string {
    const publicUrl = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT;
    return `${publicUrl}/${this.bucket}/${key}`;
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
