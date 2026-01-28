/**
 * Context Upload API
 *
 * POST /api/context/upload
 * Handles file uploads for RAG context building
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { processUserContext } from '@/lib/services/rag-service';
import { isSupportedFileType, detectFileType } from '@/lib/services/text-extraction-service';
import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/html',
];

// ============================================
// UPLOAD HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Step 1: Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Step 2: Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;

    // Must provide either file or URL
    if (!file && !url) {
      return NextResponse.json(
        { error: 'No file or URL provided' },
        { status: 400 }
      );
    }

    // Step 3: Process based on input type
    if (file) {
      // File upload
      console.log(`[Context Upload] Processing file: ${file.name} (${file.size} bytes)`);

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          },
          { status: 400 }
        );
      }

      // Validate file type
      const buffer = Buffer.from(await file.arrayBuffer());
      const detectedType = detectFileType(buffer);

      if (!isSupportedFileType(detectedType) && !ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Unsupported file type: ${detectedType}. Supported types: PDF, DOCX, TXT, MD, HTML`,
          },
          { status: 400 }
        );
      }

      // Process the file
      const result = await processUserContext({
        userId,
        file: {
          buffer,
          fileName: file.name,
          mimeType: file.type || detectedType,
        },
      });

      if (!result.success) {
        return NextResponse.json(
          {
            error: result.error || 'Failed to process file',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'File processed successfully',
        data: {
          contextId: result.contextId,
          chunksCreated: result.chunksCreated,
          tokensUsed: result.totalTokensUsed,
          fileName: file.name,
        },
      });

    } else if (url) {
      // URL processing
      console.log(`[Context Upload] Processing URL: ${url}`);

      // Validate URL format
      try {
        new URL(url);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }

      // Process the URL
      const result = await processUserContext({
        userId,
        url,
      });

      if (!result.success) {
        return NextResponse.json(
          {
            error: result.error || 'Failed to process URL',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'URL processed successfully',
        data: {
          contextId: result.contextId,
          chunksCreated: result.chunksCreated,
          tokensUsed: result.totalTokensUsed,
          url,
        },
      });
    }

  } catch (error: any) {
    console.error('[Context Upload] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// OPTIONS (CORS)
// ============================================

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
