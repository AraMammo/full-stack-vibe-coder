import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Debug logging for environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
  throw new Error('Missing required Supabase environment variables');
}

console.log('✓ Supabase client initialized');
console.log('  URL:', supabaseUrl.substring(0, 30) + '...');
console.log('  Service key:', supabaseServiceKey.substring(0, 20) + '...');

// Use service role key for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Storage bucket names
export const STORAGE_BUCKETS = {
  VOICE_NOTES: 'voice-notes',
  PROPOSALS: 'proposals',
  BIAB_DELIVERABLES: 'biab-deliverables',  // Add this line
} as const;

/**
 * Initialize storage buckets (run once during setup)
 */
export async function initializeStorageBuckets() {
  const buckets = Object.values(STORAGE_BUCKETS);

  for (const bucketName of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBucket } = await supabaseAdmin.storage.getBucket(bucketName);

      if (!existingBucket) {
        // Create bucket if it doesn't exist
        const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: false, // Private by default
          fileSizeLimit: 52428800, // 50MB limit
        });

        if (error) {
          console.error(`Failed to create bucket ${bucketName}:`, error);
        } else {
          console.log(`✓ Created bucket: ${bucketName}`);
        }
      } else {
        console.log(`✓ Bucket already exists: ${bucketName}`);
      }
    } catch (error) {
      console.error(`Error initializing bucket ${bucketName}:`, error);
    }
  }
}

/**
 * Upload a voice note file
 */
export async function uploadVoiceNote(
  userId: string,
  file: File | Blob,
  fileName: string
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.VOICE_NOTES)
      .upload(filePath, file, {
        contentType: 'audio/webm',
        upsert: false,
      });

    if (error) {
      console.error('Voice note upload error:', error);
      return { error: error.message };
    }

    // Get public URL (with signed URL for private buckets)
    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKETS.VOICE_NOTES)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      console.error('Failed to get public URL for voice note');
      return { error: 'Failed to generate public URL' };
    }

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Voice note upload exception:', error);
    return {
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Get a signed URL for private file access (expires in 1 hour)
 */
export async function getSignedUrl(bucket: string, filePath: string, expiresIn = 3600) {
  try {
    const { data, error} = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error) {
    console.error('Signed URL exception:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to generate signed URL',
    };
  }
}

/**
 * Upload a proposal PDF
 */
export async function uploadProposalPDF(
  userId: string,
  proposalId: string,
  pdfBuffer: Buffer
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const filePath = `${userId}/${proposalId}.pdf`;

    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.PROPOSALS)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true, // Allow overwriting
      });

    if (error) {
      console.error('Proposal PDF upload error:', error);
      return { error: error.message };
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKETS.PROPOSALS)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      console.error('Failed to get public URL for proposal PDF');
      return { error: 'Failed to generate public URL' };
    }

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Proposal PDF upload exception:', error);
    return {
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload a deliverable file
 */
export async function uploadDeliverable(
  userId: string,
  projectId: string,
  file: File | Blob,
  fileName: string
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${projectId}/${sanitizedFileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.BIAB_DELIVERABLES)
      .upload(filePath, file, {
        upsert: false,
      });

    if (error) {
      console.error('Deliverable upload error:', error);
      return { error: error.message };
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKETS.BIAB_DELIVERABLES)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      console.error('Failed to get public URL for deliverable');
      return { error: 'Failed to generate public URL' };
    }

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Deliverable upload exception:', error);
    return {
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: string, filePath: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error('File deletion error:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('File deletion exception:', error);
    return { success: false };
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(bucket: string, filePath: string) {
  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).list(filePath);

    if (error) {
      console.error('File metadata error:', error);
      return { error: error.message };
    }

    return { metadata: data };
  } catch (error) {
    console.error('File metadata exception:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to get metadata',
    };
  }
}

/**
 * Download a file as buffer
 */
export async function downloadFile(bucket: string, filePath: string) {
  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).download(filePath);

    if (error) {
      console.error('File download error:', error);
      return { error: error.message };
    }

    return { file: data };
  } catch (error) {
    console.error('File download exception:', error);
    return {
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
}
