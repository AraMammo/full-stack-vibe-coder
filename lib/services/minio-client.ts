/**
 * MinIO Client Service
 * S3-compatible storage client for uploading video generation assets
 */

import AWS from 'aws-sdk';

interface MinIOConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

const defaultConfig: MinIOConfig = {
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  bucket: process.env.MINIO_BUCKET || 'nca-toolkit-local',
};

class MinIOClient {
  private s3: AWS.S3;
  private bucket: string;

  constructor(config: MinIOConfig = defaultConfig) {
    this.bucket = config.bucket;

    this.s3 = new AWS.S3({
      endpoint: config.endpoint,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
  }

  /**
   * Upload a file buffer to MinIO
   */
  async uploadFile(
    key: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<{ url: string; path: string }> {
    try {
      await this.s3
        .upload({
          Bucket: this.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        })
        .promise();

      const url = `${this.s3.endpoint?.href}${this.bucket}/${key}`;
      return { url, path: key };
    } catch (error) {
      console.error('MinIO upload error:', error);
      throw new Error(`Failed to upload file to MinIO: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple files in parallel
   */
  async uploadFiles(
    files: Array<{ key: string; buffer: Buffer; contentType: string }>
  ): Promise<Array<{ url: string; path: string; key: string }>> {
    const uploads = files.map((file) =>
      this.uploadFile(file.key, file.buffer, file.contentType).then(
        (result) => ({
          ...result,
          key: file.key,
        })
      )
    );

    return Promise.all(uploads);
  }

  /**
   * Delete a file from MinIO
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
    } catch (error) {
      console.error('MinIO delete error:', error);
      throw new Error(`Failed to delete file from MinIO: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if bucket exists, create if not
   */
  async ensureBucket(): Promise<void> {
    try {
      await this.s3.headBucket({ Bucket: this.bucket }).promise();
    } catch (error: any) {
      if (error.code === 'NotFound') {
        await this.s3.createBucket({ Bucket: this.bucket }).promise();
        console.log(`Created MinIO bucket: ${this.bucket}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Get a signed URL for downloading a file (valid for 7 days)
   */
  getSignedUrl(key: string, expiresIn: number = 604800): string {
    return this.s3.getSignedUrl('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresIn,
    });
  }
}

// Export singleton instance
export const minioClient = new MinIOClient();

export default minioClient;
