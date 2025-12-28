export interface UploadResult {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

export interface StorageConfig {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region?: string;
  publicUrl?: string;
}

export interface UploadOptions {
  contentType?: string;
  acl?: 'private' | 'public-read';
  metadata?: Record<string, string>;
}
