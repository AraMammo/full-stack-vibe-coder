/**
 * RAG (Retrieval-Augmented Generation) Service
 *
 * Provides semantic search and context retrieval for enhancing AI prompts
 * Uses OpenAI embeddings for vector similarity search
 */

import { PrismaClient } from '@/app/generated/prisma';
import {
  generateEmbedding,
  generateBatchEmbeddings,
  chunkText,
  cosineSimilarity,
} from './embedding-service';
import {
  extractTextFromFile,
  extractTextFromURL,
} from './text-extraction-service';
import { createClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface ProcessContextOptions {
  userId: string;
  file?: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
  };
  url?: string;
  text?: {
    content: string;
    fileName: string;
  };
}

export interface ProcessContextResult {
  success: boolean;
  contextId?: string;
  chunksCreated?: number;
  totalTokensUsed?: number;
  error?: string;
}

export interface RetrievalResult {
  chunks: Array<{
    id: string;
    text: string;
    similarity: number;
    metadata: any;
    contextId: string;
    fileName: string;
  }>;
  totalChunks: number;
  query: string;
}

export interface ContextSummary {
  contextId: string;
  fileName: string;
  fileType: string;
  status: string;
  uploadedAt: Date;
  chunksCount: number;
  wordCount?: number;
}

// ============================================
// CONTEXT PROCESSING
// ============================================

/**
 * Process and store user context (file, URL, or raw text)
 * Extracts text, chunks it, generates embeddings, and stores in database
 *
 * @param options - Context processing options
 * @returns Result with context ID and metadata
 */
export async function processUserContext(
  options: ProcessContextOptions
): Promise<ProcessContextResult> {
  const prisma = new PrismaClient();

  try {
    console.log('[RAG] Processing user context...');

    // Step 1: Extract text based on input type
    let extractedText: string;
    let fileName: string;
    let fileType: string;
    let metadata: any = {};

    if (options.file) {
      // Extract from file
      const extraction = await extractTextFromFile(
        options.file.buffer,
        options.file.fileName,
        options.file.mimeType
      );

      if (!extraction.success) {
        return {
          success: false,
          error: extraction.error || 'Text extraction failed',
        };
      }

      extractedText = extraction.text;
      fileName = options.file.fileName;
      fileType = options.file.mimeType;
      metadata = extraction.metadata;

    } else if (options.url) {
      // Extract from URL
      const extraction = await extractTextFromURL(options.url);

      if (!extraction.success) {
        return {
          success: false,
          error: extraction.error || 'URL extraction failed',
        };
      }

      extractedText = extraction.text;
      fileName = new URL(options.url).hostname;
      fileType = 'URL';
      metadata = extraction.metadata;

    } else if (options.text) {
      // Use raw text
      extractedText = options.text.content;
      fileName = options.text.fileName;
      fileType = 'TEXT';
      metadata = {
        wordCount: extractedText.split(/\s+/).length,
        charCount: extractedText.length,
      };

    } else {
      return {
        success: false,
        error: 'No file, URL, or text provided',
      };
    }

    console.log(`[RAG] Extracted ${metadata.wordCount || 0} words from ${fileName}`);

    // Step 2: Create UserContext record
    const context = await prisma.userContext.create({
      data: {
        userId: options.userId,
        fileName,
        fileType: fileType as any,
        fileSize: extractedText.length,
        storagePath: '', // Will be updated if uploaded to Supabase
        status: 'PROCESSING',
        metadata,
      },
    });

    console.log(`[RAG] Created context record: ${context.id}`);

    // Step 3: Chunk the text
    const chunks = chunkText(extractedText, {
      maxChunkSize: 8000,
      overlap: 200,
    });

    console.log(`[RAG] Split into ${chunks.length} chunks`);

    // Step 4: Generate embeddings for all chunks
    const chunkTexts = chunks.map(c => c.text);
    const embeddingResult = await generateBatchEmbeddings(chunkTexts);

    console.log(`[RAG] Generated ${embeddingResult.chunks.length} embeddings (${embeddingResult.totalTokensUsed} tokens)`);

    // Step 5: Store chunks with embeddings in database
    const chunkRecords = embeddingResult.chunks.map((chunk, index) => ({
      contextId: context.id,
      chunkIndex: index,
      text: chunk.text,
      embedding: chunk.embedding, // Store as JSON
      metadata: chunks[index].metadata,
    }));

    await prisma.contextChunk.createMany({
      data: chunkRecords,
    });

    // Step 6: Update context status to COMPLETED
    await prisma.userContext.update({
      where: { id: context.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    console.log(`[RAG] ✓ Context processing complete`);

    return {
      success: true,
      contextId: context.id,
      chunksCreated: chunks.length,
      totalTokensUsed: embeddingResult.totalTokensUsed,
    };

  } catch (error: any) {
    console.error('[RAG] ✗ Context processing failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// SEMANTIC SEARCH
// ============================================

/**
 * Retrieve relevant context chunks for a query using semantic search
 *
 * @param userId - User ID to search within
 * @param query - Search query
 * @param options - Search options
 * @returns Relevant chunks ranked by similarity
 */
export async function retrieveRelevantContext(
  userId: string,
  query: string,
  options?: {
    topK?: number;
    minSimilarity?: number;
    contextIds?: string[]; // Limit to specific contexts
  }
): Promise<RetrievalResult> {
  const prisma = new PrismaClient();

  try {
    const topK = options?.topK || 5;
    const minSimilarity = options?.minSimilarity || 0.7;

    console.log(`[RAG] Retrieving context for query: "${query.substring(0, 100)}..."`);

    // Step 1: Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    console.log(`[RAG] Generated query embedding (${queryEmbedding.embedding.length}d)`);

    // Step 2: Fetch all chunks for this user
    const whereClause: any = {
      context: {
        userId,
        status: 'COMPLETED',
      },
    };

    // Optionally filter by specific contexts
    if (options?.contextIds && options.contextIds.length > 0) {
      whereClause.contextId = {
        in: options.contextIds,
      };
    }

    const chunks = await prisma.contextChunk.findMany({
      where: whereClause,
      include: {
        context: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
          },
        },
      },
    });

    console.log(`[RAG] Found ${chunks.length} chunks to search`);

    if (chunks.length === 0) {
      return {
        chunks: [],
        totalChunks: 0,
        query,
      };
    }

    // Step 3: Calculate similarity for each chunk
    const results = chunks.map(chunk => {
      const chunkEmbedding = chunk.embedding as unknown as number[];
      const similarity = cosineSimilarity(queryEmbedding.embedding, chunkEmbedding);

      return {
        id: chunk.id,
        text: chunk.text,
        similarity,
        metadata: chunk.metadata as any,
        contextId: chunk.contextId,
        fileName: chunk.context.fileName,
        fileType: chunk.context.fileType,
      };
    });

    // Step 4: Filter by minimum similarity and sort
    const filteredResults = results
      .filter(r => r.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    console.log(`[RAG] ✓ Found ${filteredResults.length} relevant chunks (top similarity: ${filteredResults[0]?.similarity.toFixed(3) || 'N/A'})`);

    return {
      chunks: filteredResults,
      totalChunks: chunks.length,
      query,
    };

  } catch (error: any) {
    console.error('[RAG] ✗ Retrieval failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Format retrieved context for injection into AI prompts
 *
 * @param retrievalResult - Result from retrieveRelevantContext()
 * @returns Formatted context string
 */
export function formatContextForPrompt(retrievalResult: RetrievalResult): string {
  if (retrievalResult.chunks.length === 0) {
    return '';
  }

  const sections = retrievalResult.chunks.map((chunk, index) => {
    return `
### Context ${index + 1} (Similarity: ${(chunk.similarity * 100).toFixed(1)}%)
**Source:** ${chunk.fileName}

${chunk.text.trim()}
`;
  });

  return `
# USER CONTEXT

The following information has been provided by the user to personalize this business plan:

${sections.join('\n---\n')}

**Instructions:** Use the above context to personalize your response. Reference specific details from the user's background, experience, and preferences when relevant. DO NOT invent information not present in the context.
`;
}

// ============================================
// CONTEXT MANAGEMENT
// ============================================

/**
 * Get all contexts for a user
 *
 * @param userId - User ID
 * @returns Array of context summaries
 */
export async function getUserContexts(userId: string): Promise<ContextSummary[]> {
  const prisma = new PrismaClient();

  try {
    const contexts = await prisma.userContext.findMany({
      where: { userId },
      include: {
        chunks: {
          select: { id: true },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return contexts.map(ctx => ({
      contextId: ctx.id,
      fileName: ctx.fileName,
      fileType: ctx.fileType,
      status: ctx.status,
      uploadedAt: ctx.uploadedAt,
      chunksCount: ctx.chunks.length,
      wordCount: (ctx.metadata as any)?.wordCount,
    }));

  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Delete a context and all its chunks
 *
 * @param contextId - Context ID to delete
 * @param userId - User ID (for authorization)
 * @returns Success status
 */
export async function deleteUserContext(
  contextId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const prisma = new PrismaClient();

  try {
    // Verify ownership
    const context = await prisma.userContext.findFirst({
      where: {
        id: contextId,
        userId,
      },
    });

    if (!context) {
      return {
        success: false,
        error: 'Context not found or unauthorized',
      };
    }

    // Delete context (chunks will be cascade deleted)
    await prisma.userContext.delete({
      where: { id: contextId },
    });

    console.log(`[RAG] Deleted context: ${contextId}`);

    return { success: true };

  } catch (error: any) {
    console.error(`[RAG] Failed to delete context ${contextId}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get statistics about user's context library
 *
 * @param userId - User ID
 * @returns Statistics object
 */
export async function getContextStats(userId: string): Promise<{
  totalContexts: number;
  totalChunks: number;
  totalWords: number;
  byFileType: Record<string, number>;
}> {
  const prisma = new PrismaClient();

  try {
    const contexts = await prisma.userContext.findMany({
      where: { userId },
      include: {
        chunks: {
          select: { id: true },
        },
      },
    });

    const byFileType: Record<string, number> = {};
    let totalWords = 0;
    let totalChunks = 0;

    contexts.forEach(ctx => {
      // Count by file type
      byFileType[ctx.fileType] = (byFileType[ctx.fileType] || 0) + 1;

      // Sum words
      const metadata = ctx.metadata as any;
      totalWords += metadata?.wordCount || 0;

      // Sum chunks
      totalChunks += ctx.chunks.length;
    });

    return {
      totalContexts: contexts.length,
      totalChunks,
      totalWords,
      byFileType,
    };

  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Test RAG system with sample data
 */
export async function testRAGSystem(userId: string): Promise<void> {
  console.log('\n🧪 Testing RAG System\n');

  try {
    // Test 1: Process sample context
    console.log('Test 1: Processing sample context...');
    const sampleText = `
# About Me
I'm a software engineer with 5 years of experience in building SaaS products.
I specialize in React, Node.js, and PostgreSQL.

# Previous Projects
- Built a CRM system that handles 10,000+ users
- Created a real-time collaboration tool
- Experienced with AWS, Docker, and CI/CD

# Goals
I want to build a B2B SaaS product in the project management space.
Target customers are small teams (5-20 people) who need simple, affordable tools.
`;

    const processResult = await processUserContext({
      userId,
      text: {
        content: sampleText,
        fileName: 'test-context.txt',
      },
    });

    if (!processResult.success) {
      throw new Error(`Processing failed: ${processResult.error}`);
    }

    console.log(`✓ Context processed: ${processResult.contextId}`);
    console.log(`✓ Created ${processResult.chunksCreated} chunks`);
    console.log(`✓ Used ${processResult.totalTokensUsed} tokens\n`);

    // Test 2: Retrieve relevant context
    console.log('Test 2: Retrieving relevant context...');
    const query = 'What technical skills does the user have?';
    const retrievalResult = await retrieveRelevantContext(userId, query, {
      topK: 3,
      minSimilarity: 0.6,
    });

    console.log(`✓ Retrieved ${retrievalResult.chunks.length} relevant chunks`);
    retrievalResult.chunks.forEach((chunk, i) => {
      console.log(`  ${i + 1}. ${chunk.fileName} (similarity: ${chunk.similarity.toFixed(3)})`);
      console.log(`     "${chunk.text.substring(0, 80)}..."`);
    });
    console.log();

    // Test 3: Format for prompt
    console.log('Test 3: Formatting context for prompt...');
    const formattedContext = formatContextForPrompt(retrievalResult);
    console.log(`✓ Formatted context (${formattedContext.length} chars)`);
    console.log(formattedContext.substring(0, 300) + '...\n');

    // Test 4: Get user stats
    console.log('Test 4: Getting context stats...');
    const stats = await getContextStats(userId);
    console.log(`✓ Total contexts: ${stats.totalContexts}`);
    console.log(`✓ Total chunks: ${stats.totalChunks}`);
    console.log(`✓ Total words: ${stats.totalWords}`);
    console.log(`✓ By file type:`, stats.byFileType);
    console.log();

    console.log('🎉 All RAG tests passed!\n');

  } catch (error: any) {
    console.error('\n❌ RAG test failed:', error.message);
    throw error;
  }
}
