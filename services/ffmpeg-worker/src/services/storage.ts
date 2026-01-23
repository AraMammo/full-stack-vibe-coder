import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

// Supabase Storage configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'faceless-videos';

// S3 configuration (fallback - can be AWS S3, Cloudflare R2, MinIO, etc.)
const s3Client = process.env.S3_ENDPOINT ? new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for MinIO/R2
}) : null;

const BUCKET = process.env.S3_BUCKET || 'faceless-videos';
const PUBLIC_URL_PREFIX = process.env.S3_PUBLIC_URL || '';

/**
 * Download a file from a URL to a local path
 */
export function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(destPath);
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlinkSync(destPath);
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

/**
 * Upload a file to cloud storage and return the public URL
 */
export async function uploadToStorage(filePath: string, key: string): Promise<string> {
  const fileContent = fs.readFileSync(filePath);
  const contentType = getContentType(filePath);

  // Option 1: Supabase Storage (preferred)
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    console.log(`[Storage] Uploading to Supabase: ${key}`);

    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${key}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true', // Overwrite if exists
      },
      body: fileContent,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Storage] Supabase upload failed:`, error);
      throw new Error(`Supabase upload failed: ${response.status}`);
    }

    // Return the public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${key}`;
    console.log(`[Storage] Uploaded to Supabase: ${publicUrl}`);
    return publicUrl;
  }

  // Option 2: S3-compatible storage
  if (s3Client) {
    console.log(`[Storage] Uploading to S3: ${key}`);

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      ACL: 'public-read', // Make publicly accessible
    }));

    // Return the public URL
    if (PUBLIC_URL_PREFIX) {
      return `${PUBLIC_URL_PREFIX}/${key}`;
    }
    return `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`;
  }

  // Option 3: Local storage (development only)
  console.log(`[Storage] Using local storage for: ${key}`);
  const localDir = process.env.LOCAL_STORAGE_PATH || '/tmp/ffmpeg-worker/output';
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  const destPath = path.join(localDir, key.replace(/\//g, '-'));
  fs.copyFileSync(filePath, destPath);

  // In production, you'd want to serve these files somehow
  // For now, return a placeholder that indicates local storage
  const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`;
  return `${baseUrl}/files/${path.basename(destPath)}`;
}

/**
 * Cleanup temporary files
 */
export async function cleanupFiles(files: string[]): Promise<void> {
  for (const file of files) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (err) {
      console.warn(`Failed to cleanup file ${file}:`, err);
    }
  }
}

/**
 * Get content type from file extension
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.srt': 'text/plain',
  };
  return types[ext] || 'application/octet-stream';
}
