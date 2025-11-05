/**
 * Embedding Service
 *
 * Generates vector embeddings for text using OpenAI's text-embedding-3-small model
 * Used for RAG (Retrieval-Augmented Generation) to enable semantic search
 */

import OpenAI from 'openai';

// ============================================
// TYPES
// ============================================

export interface EmbeddingResult {
  embedding: number[];
  tokensUsed: number;
}

export interface ChunkEmbeddingResult {
  chunkIndex: number;
  text: string;
  embedding: number[];
  tokensUsed: number;
}

export interface BatchEmbeddingResult {
  chunks: ChunkEmbeddingResult[];
  totalTokensUsed: number;
}

// ============================================
// CONFIGURATION
// ============================================

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536; // Default for text-embedding-3-small
const MAX_CHUNK_SIZE = 8000; // Characters per chunk (safe for token limits)
const CHUNK_OVERLAP = 200; // Overlap between chunks for context continuity

// ============================================
// EMBEDDING GENERATION
// ============================================

/**
 * Generate embedding for a single text string
 *
 * @param text - The text to embed
 * @returns Embedding vector and token usage
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  console.log(`[Embedding] Generating embedding for text (${text.length} chars)...`);

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim(),
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const embedding = response.data[0].embedding;
    const tokensUsed = response.usage.total_tokens;

    console.log(`[Embedding] ✓ Generated ${embedding.length}d vector (${tokensUsed} tokens)`);

    return {
      embedding,
      tokensUsed,
    };

  } catch (error: any) {
    console.error('[Embedding] ✗ Failed to generate embedding:', error.message);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple text chunks in batch
 * More efficient than calling generateEmbedding() multiple times
 *
 * @param texts - Array of text strings to embed
 * @returns Array of embeddings with metadata
 */
export async function generateBatchEmbeddings(
  texts: string[]
): Promise<BatchEmbeddingResult> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!texts || texts.length === 0) {
    throw new Error('Cannot generate embeddings for empty array');
  }

  // Remove empty strings
  const validTexts = texts.filter(t => t && t.trim().length > 0);

  if (validTexts.length === 0) {
    throw new Error('All texts are empty');
  }

  console.log(`[Embedding] Generating embeddings for ${validTexts.length} chunks...`);

  try {
    // OpenAI API supports batch embedding
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: validTexts.map(t => t.trim()),
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const chunks: ChunkEmbeddingResult[] = response.data.map((item, index) => ({
      chunkIndex: index,
      text: validTexts[index],
      embedding: item.embedding,
      tokensUsed: 0, // Individual token counts not provided in batch
    }));

    const totalTokensUsed = response.usage.total_tokens;

    console.log(`[Embedding] ✓ Generated ${chunks.length} embeddings (${totalTokensUsed} tokens total)`);

    return {
      chunks,
      totalTokensUsed,
    };

  } catch (error: any) {
    console.error('[Embedding] ✗ Batch embedding failed:', error.message);
    throw new Error(`Batch embedding generation failed: ${error.message}`);
  }
}

// ============================================
// TEXT CHUNKING
// ============================================

/**
 * Split large text into chunks suitable for embedding
 * Uses sliding window with overlap to maintain context
 *
 * @param text - The full text to chunk
 * @param options - Chunking configuration
 * @returns Array of text chunks with metadata
 */
export function chunkText(
  text: string,
  options?: {
    maxChunkSize?: number;
    overlap?: number;
  }
): Array<{ index: number; text: string; metadata: any }> {
  const maxSize = options?.maxChunkSize || MAX_CHUNK_SIZE;
  const overlap = options?.overlap || CHUNK_OVERLAP;

  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleanText = text.trim();

  // If text is small enough, return as single chunk
  if (cleanText.length <= maxSize) {
    return [{
      index: 0,
      text: cleanText,
      metadata: {
        startChar: 0,
        endChar: cleanText.length,
        totalChunks: 1,
      },
    }];
  }

  const chunks: Array<{ index: number; text: string; metadata: any }> = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanText.length) {
    // Calculate end index for this chunk
    let endIndex = Math.min(startIndex + maxSize, cleanText.length);

    // If not at the end, try to break at a sentence or word boundary
    if (endIndex < cleanText.length) {
      // Look for sentence break (. ! ?) within last 100 chars
      const searchStart = Math.max(endIndex - 100, startIndex);
      const segment = cleanText.substring(searchStart, endIndex);
      const sentenceBreak = segment.search(/[.!?]\s/);

      if (sentenceBreak !== -1) {
        endIndex = searchStart + sentenceBreak + 2; // Include punctuation and space
      } else {
        // If no sentence break, look for word boundary
        const spaceIndex = cleanText.lastIndexOf(' ', endIndex);
        if (spaceIndex > startIndex) {
          endIndex = spaceIndex;
        }
      }
    }

    const chunkText = cleanText.substring(startIndex, endIndex).trim();

    chunks.push({
      index: chunkIndex,
      text: chunkText,
      metadata: {
        startChar: startIndex,
        endChar: endIndex,
        totalChunks: -1, // Will be updated after all chunks are created
      },
    });

    // Move start index forward, with overlap
    startIndex = endIndex - overlap;
    chunkIndex++;

    // Safety check to prevent infinite loops
    if (startIndex >= cleanText.length || chunkIndex > 1000) {
      break;
    }
  }

  // Update totalChunks in metadata
  chunks.forEach(chunk => {
    chunk.metadata.totalChunks = chunks.length;
  });

  console.log(`[Chunking] Split ${cleanText.length} chars into ${chunks.length} chunks`);

  return chunks;
}

// ============================================
// SIMILARITY COMPUTATION
// ============================================

/**
 * Compute cosine similarity between two embedding vectors
 * Returns value between -1 (opposite) and 1 (identical)
 *
 * @param embeddingA - First embedding vector
 * @param embeddingB - Second embedding vector
 * @returns Cosine similarity score
 */
export function cosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
  if (embeddingA.length !== embeddingB.length) {
    throw new Error('Embeddings must have same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
    normA += embeddingA[i] * embeddingA[i];
    normB += embeddingB[i] * embeddingB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Find the top K most similar embeddings to a query embedding
 *
 * @param queryEmbedding - The query embedding to compare against
 * @param candidateEmbeddings - Array of candidate embeddings with IDs
 * @param topK - Number of top results to return
 * @returns Top K most similar embeddings with similarity scores
 */
export function findTopKSimilar(
  queryEmbedding: number[],
  candidateEmbeddings: Array<{ id: string; embedding: number[]; metadata?: any }>,
  topK: number = 5
): Array<{ id: string; similarity: number; metadata?: any }> {
  // Calculate similarity for each candidate
  const similarities = candidateEmbeddings.map(candidate => ({
    id: candidate.id,
    similarity: cosineSimilarity(queryEmbedding, candidate.embedding),
    metadata: candidate.metadata,
  }));

  // Sort by similarity (descending) and take top K
  const topResults = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  console.log(`[Similarity] Found top ${topResults.length} results (scores: ${topResults.map(r => r.similarity.toFixed(3)).join(', ')})`);

  return topResults;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Validate that an embedding has the correct dimensions
 *
 * @param embedding - The embedding to validate
 * @returns True if valid, throws error otherwise
 */
export function validateEmbedding(embedding: number[]): boolean {
  if (!Array.isArray(embedding)) {
    throw new Error('Embedding must be an array');
  }

  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Embedding must have ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`);
  }

  if (embedding.some(v => typeof v !== 'number' || isNaN(v))) {
    throw new Error('Embedding contains invalid values');
  }

  return true;
}

/**
 * Estimate token count for text (rough approximation)
 * Used to predict costs before generating embeddings
 *
 * @param text - The text to estimate
 * @returns Approximate token count
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost for embedding generation
 * Based on OpenAI's pricing: $0.00002 per 1K tokens (as of 2024)
 *
 * @param tokens - Number of tokens used
 * @returns Cost in USD
 */
export function calculateEmbeddingCost(tokens: number): number {
  const COST_PER_1K_TOKENS = 0.00002; // text-embedding-3-small
  return (tokens / 1000) * COST_PER_1K_TOKENS;
}

/**
 * Test the embedding service with a sample text
 */
export async function testEmbeddingService(): Promise<void> {
  console.log('\n🧪 Testing Embedding Service\n');

  const sampleText = 'This is a test sentence for embedding generation.';

  try {
    // Test 1: Single embedding
    console.log('Test 1: Single embedding generation');
    const result = await generateEmbedding(sampleText);
    console.log(`✓ Generated ${result.embedding.length}d vector`);
    console.log(`✓ Used ${result.tokensUsed} tokens`);
    console.log(`✓ Cost: $${calculateEmbeddingCost(result.tokensUsed).toFixed(6)}\n`);

    // Test 2: Batch embeddings
    console.log('Test 2: Batch embedding generation');
    const sampleTexts = [
      'First test sentence.',
      'Second test sentence.',
      'Third test sentence.',
    ];
    const batchResult = await generateBatchEmbeddings(sampleTexts);
    console.log(`✓ Generated ${batchResult.chunks.length} embeddings`);
    console.log(`✓ Total tokens: ${batchResult.totalTokensUsed}`);
    console.log(`✓ Cost: $${calculateEmbeddingCost(batchResult.totalTokensUsed).toFixed(6)}\n`);

    // Test 3: Text chunking
    console.log('Test 3: Text chunking');
    const longText = 'This is a long text. '.repeat(1000);
    const chunks = chunkText(longText, { maxChunkSize: 500, overlap: 50 });
    console.log(`✓ Split ${longText.length} chars into ${chunks.length} chunks`);
    console.log(`✓ First chunk: ${chunks[0].text.substring(0, 50)}...\n`);

    // Test 4: Similarity
    console.log('Test 4: Cosine similarity');
    const similarity = cosineSimilarity(
      batchResult.chunks[0].embedding,
      batchResult.chunks[1].embedding
    );
    console.log(`✓ Similarity between chunk 0 and 1: ${similarity.toFixed(4)}\n`);

    console.log('🎉 All tests passed!\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  }
}
