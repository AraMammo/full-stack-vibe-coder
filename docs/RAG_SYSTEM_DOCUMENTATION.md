# RAG System Documentation

**Retrieval-Augmented Generation for Personalized BIAB Outputs**

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [API Reference](#api-reference)
5. [User Guide](#user-guide)
6. [Developer Guide](#developer-guide)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Future Enhancements](#future-enhancements)

---

## Overview

### What is RAG?

Retrieval-Augmented Generation (RAG) enhances AI responses by injecting relevant context from a knowledge base. Instead of generic outputs, RAG produces personalized responses based on the user's specific background, experience, and preferences.

### Value Proposition

- **10x Better Outputs**: Personalized business plans vs generic templates
- **Context-Aware**: Uses user's LinkedIn, portfolio, competitor research
- **Semantic Search**: Finds relevant context automatically
- **Privacy-First**: User controls their data (manual upload MVP)

### Use Cases

1. **Founder Profile**: Upload LinkedIn PDF for personalized business plans
2. **Portfolio Context**: Share previous projects to inform recommendations
3. **Competitor Research**: Add competitor URLs for differentiation insights
4. **Industry Knowledge**: Upload industry reports, whitepapers, articles

---

## Architecture

### System Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Uploads files/URLs
       ▼
┌─────────────────────────────────────┐
│  /dashboard/context                 │
│  - File upload (PDF, DOCX, TXT, MD) │
│  - URL scraping                     │
│  - Context library management       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  POST /api/context/upload           │
│  1. Validate file/URL               │
│  2. Extract text                    │
│  3. Chunk text (8K chars)           │
│  4. Generate embeddings (OpenAI)    │
│  5. Store in Supabase (Postgres)    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Database (Postgres)                │
│  - UserContext (files, metadata)    │
│  - ContextChunk (text + embeddings) │
└────────────┬────────────────────────┘
             │
             │ User starts BIAB workflow
             ▼
┌─────────────────────────────────────┐
│  POST /api/business-in-a-box/execute│
│  - Includes contextIds parameter    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  BIABOrchestratorAgent              │
│  1. Load user context (if provided) │
│  2. Semantic search (query = concept)│
│  3. Retrieve top 5 relevant chunks  │
│  4. Format context for injection    │
│  5. Execute 16 BIAB prompts         │
│  6. Inject context into each prompt │
└─────────────────────────────────────┘
```

### Data Models

```prisma
model Project {
  // ... existing fields ...
  contextIds  String[]  @default([])  // User contexts used
}

model UserContext {
  id          String              @id @default(uuid())
  userId      String
  fileName    String
  fileType    ContextFileType
  fileSize    Int
  storagePath String
  downloadUrl String?
  uploadedAt  DateTime            @default(now())
  processedAt DateTime?
  status      ContextStatus       @default(PENDING)
  metadata    Json?
  chunks      ContextChunk[]

  @@index([userId])
  @@index([status])
}

model ContextChunk {
  id          String      @id @default(uuid())
  contextId   String
  chunkIndex  Int
  text        String      @db.Text
  embedding   Json        // 1536-dim vector as JSON array
  metadata    Json?
  createdAt   DateTime    @default(now())
  context     UserContext @relation(...)

  @@index([contextId])
}

enum ContextFileType {
  PDF | TEXT | MARKDOWN | DOCX | URL | IMAGE
}

enum ContextStatus {
  PENDING | PROCESSING | COMPLETED | FAILED
}
```

---

## Components

### 1. Embedding Service

**File**: `lib/services/embedding-service.ts`

**Functions**:

- `generateEmbedding(text)` - Single embedding via OpenAI
- `generateBatchEmbeddings(texts[])` - Batch processing
- `chunkText(text, options)` - Smart chunking with overlap
- `cosineSimilarity(a, b)` - Vector similarity
- `findTopKSimilar(query, candidates, k)` - Semantic search

**Configuration**:
- Model: `text-embedding-3-small`
- Dimensions: 1536
- Chunk size: 8000 chars
- Overlap: 200 chars

**Cost**: $0.00002 per 1K tokens

### 2. Text Extraction Service

**File**: `lib/services/text-extraction-service.ts`

**Functions**:

- `extractTextFromFile(buffer, fileName, mimeType)` - Universal extractor
- `extractTextFromURL(url)` - Web scraping
- `extractFromPDF(buffer)` - PDF → text (pdf-parse)
- `extractFromDOCX(buffer)` - DOCX → text (mammoth)
- `extractFromHTML(html)` - HTML → plain text
- `detectFileType(buffer)` - Magic bytes detection
- `splitIntoSections(text)` - Section-based chunking

**Supported Formats**:
- PDF (`.pdf`)
- Word Documents (`.docx`)
- Plain Text (`.txt`)
- Markdown (`.md`)
- HTML (`.html`)
- URLs (web pages)

### 3. RAG Service

**File**: `lib/services/rag-service.ts`

**Core Functions**:

#### `processUserContext(options)`
Processes file, URL, or raw text:
1. Extract text
2. Chunk into 8K segments
3. Generate embeddings (batch)
4. Store in database

**Options**:
```typescript
{
  userId: string;
  file?: { buffer, fileName, mimeType };
  url?: string;
  text?: { content, fileName };
}
```

#### `retrieveRelevantContext(userId, query, options)`
Semantic search across user contexts:
1. Generate query embedding
2. Calculate similarity with all chunks
3. Filter by minimum similarity (0.6)
4. Return top K results (5)

**Options**:
```typescript
{
  topK?: number;        // Default: 5
  minSimilarity?: number; // Default: 0.7
  contextIds?: string[]; // Filter to specific contexts
}
```

#### `formatContextForPrompt(retrievalResult)`
Formats context for AI injection:
```
# USER CONTEXT

The following information has been provided by the user...

### Context 1 (Similarity: 85.3%)
**Source:** linkedin-profile.pdf

[Relevant text chunk...]

---

### Context 2 (Similarity: 78.2%)
**Source:** portfolio.md

[Relevant text chunk...]

**Instructions:** Use the above context to personalize your response...
```

---

## API Reference

### Upload Context

**POST** `/api/context/upload`

Upload file or URL for context processing.

**Request** (multipart/form-data):
```typescript
{
  file?: File;  // PDF, DOCX, TXT, MD (max 10MB)
  url?: string; // Web page URL
}
```

**Response**:
```json
{
  "success": true,
  "message": "File processed successfully",
  "data": {
    "contextId": "uuid",
    "chunksCreated": 12,
    "tokensUsed": 3456,
    "fileName": "portfolio.pdf"
  }
}
```

**Errors**:
- `400` - File too large, unsupported type, invalid URL
- `401` - Unauthorized
- `500` - Processing failed

### List Contexts

**GET** `/api/context?stats=true`

Retrieve user's uploaded contexts.

**Response**:
```json
{
  "success": true,
  "data": {
    "contexts": [
      {
        "contextId": "uuid",
        "fileName": "linkedin-profile.pdf",
        "fileType": "PDF",
        "status": "COMPLETED",
        "uploadedAt": "2025-01-15T10:00:00Z",
        "chunksCount": 15,
        "wordCount": 2500
      }
    ],
    "stats": {
      "totalContexts": 3,
      "totalChunks": 45,
      "totalWords": 12000,
      "byFileType": {
        "PDF": 2,
        "URL": 1
      }
    }
  }
}
```

### Delete Context

**DELETE** `/api/context/[id]`

Delete specific context and all chunks.

**Response**:
```json
{
  "success": true,
  "message": "Context deleted successfully"
}
```

### Execute BIAB with Context

**POST** `/api/business-in-a-box/execute`

Execute BIAB with optional context enhancement.

**Request**:
```json
{
  "projectId": "uuid",
  "businessConcept": "A mobile app for...",
  "userId": "user@example.com",
  "tier": "LAUNCH_BLUEPRINT",
  "contextIds": ["context-uuid-1", "context-uuid-2"]  // ✨ NEW
}
```

**Response**:
```json
{
  "success": true,
  "projectId": "uuid",
  "summary": {
    "totalPrompts": 16,
    "completedPrompts": 16,
    "totalTokensUsed": 45000
  }
}
```

---

## User Guide

### Step 1: Upload Context

1. Navigate to **Dashboard → Context Library** (`/dashboard/context`)
2. Upload files or add URLs:
   - **LinkedIn Profile**: Export as PDF from LinkedIn
   - **Portfolio**: Upload resume, project descriptions
   - **Competitor Research**: Add competitor website URLs
   - **Industry Reports**: Upload whitepapers, articles

### Step 2: Start BIAB Project

1. Go to **Dashboard → New Project** (`/upload`)
2. Record business concept or paste description
3. Select tier (Validation, Launch, Turnkey)
4. **(Future)** Select contexts to use for personalization
5. Submit

### Step 3: View Results

1. BIAB executes 16 prompts with injected context
2. Download complete package from **Dashboard**
3. Review personalized business plan

### Tips for Best Results

- **Upload Multiple Contexts**: Diverse sources = better personalization
- **Use Recent Data**: Keep contexts up-to-date
- **Specific Content**: Detailed profiles work better than vague descriptions
- **Competitor Context**: Add 2-3 competitors for differentiation insights

---

## Developer Guide

### Running Tests

#### Test Embedding Service
```bash
cd /Users/aramammo/fullstack-vibe-coder-final
npx tsx -e "import { testEmbeddingService } from './lib/services/embedding-service'; testEmbeddingService()"
```

#### Test RAG Service
```bash
npx tsx -e "import { testRAGSystem } from './lib/services/rag-service'; testRAGSystem('test-user@example.com')"
```

### Adding New File Types

1. **Update Enum** (prisma/schema.prisma):
```prisma
enum ContextFileType {
  // ... existing ...
  NEW_TYPE
}
```

2. **Add Extraction Logic** (lib/services/text-extraction-service.ts):
```typescript
else if (mimeType === 'application/new-type') {
  text = await extractFromNewType(buffer);
}
```

3. **Run Migration**:
```bash
npx prisma db push
```

### Customizing RAG Retrieval

Edit `lib/agents/biab-orchestrator-agent.ts`:

```typescript
const retrievalResult = await retrieveRelevantContext(
  userId,
  businessConcept,
  {
    topK: 10,           // Increase from 5
    minSimilarity: 0.5, // Lower threshold
    contextIds,
  }
);
```

### Debugging

Enable verbose logging:
```typescript
// In lib/services/rag-service.ts
console.log('[RAG] Query embedding:', queryEmbedding);
console.log('[RAG] Similarity scores:', results.map(r => r.similarity));
```

---

## Testing

### Manual Testing Checklist

- [ ] Upload PDF file
- [ ] Upload DOCX file
- [ ] Add website URL
- [ ] View context library
- [ ] Delete context
- [ ] Start BIAB project (without context)
- [ ] Start BIAB project (with context)
- [ ] Compare outputs (generic vs personalized)
- [ ] Check database (contexts, chunks, embeddings)

### Automated Tests

```bash
# TypeScript compilation
npx tsc --noEmit --jsx preserve

# Embedding service
npx tsx lib/services/embedding-service.ts

# RAG service
npx tsx lib/services/rag-service.ts
```

---

## Deployment

### Environment Variables

Add to `.env`:
```env
# Required for RAG
OPENAI_API_KEY=sk-...           # For embeddings
DATABASE_URL=postgresql://...    # Supabase Postgres
```

### Database Migration

Run on production:
```bash
npx prisma db push
```

### Verify Setup

1. **Check Database**: Verify `user_contexts` and `context_chunks` tables exist
2. **Test Upload**: Try uploading a test file
3. **Check Embeddings**: Verify chunks have embedding data (JSON array)
4. **Test BIAB**: Run complete workflow with context

---

## Future Enhancements

### Phase 2: Official API Integrations

- **LinkedIn API**: Direct profile import (requires OAuth)
- **GitHub API**: Repository analysis for technical context
- **Google Drive**: Connect to existing documents

### Phase 3: Advanced Features

- **Knowledge Graphs**: Relationship mapping between entities
- **Multi-Query Retrieval**: Multiple semantic searches per prompt
- **Hybrid Search**: Combine semantic + keyword search
- **Context Summarization**: Condense long contexts
- **Relevance Feedback**: User confirms which chunks were useful

### Phase 4: Vector Database

Migrate from JSON embeddings to pgvector extension:
- Faster similarity search (ANN algorithms)
- Index optimization
- Supports 100K+ chunks efficiently

**Migration Path**:
```sql
-- Enable extension
CREATE EXTENSION vector;

-- Alter table
ALTER TABLE context_chunks ADD COLUMN embedding_vector vector(1536);

-- Migrate data
UPDATE context_chunks SET embedding_vector = embedding::text::vector;

-- Create index
CREATE INDEX ON context_chunks USING ivfflat (embedding_vector vector_cosine_ops);
```

### Phase 5: Premium Tier

**BIAB Plus with Context Enhancement** - $497
- Unlimited context uploads
- Priority processing
- Advanced semantic search
- Knowledge graph visualization
- API access for integrations

---

## Cost Analysis

### API Costs Per User

**Embedding Generation**:
- Average document: 2,000 words = ~15 chunks
- Tokens per chunk: ~2,000
- Total tokens: 30,000
- Cost: 30K × $0.00002 / 1K = **$0.60 per document**

**BIAB Execution**:
- Context retrieval: ~5K tokens (5 chunks)
- Cost per execution: **$0.10**

**Total Cost Per User**:
- 3 documents uploaded: $1.80
- 1 BIAB execution: $0.10
- **Total: $1.90 per user**

**Margins**:
- Launch Blueprint ($197): **$195.10 profit** (102x margin)
- Turnkey System ($497): **$495.10 profit** (261x margin)

---

## Support

### Common Issues

**Issue**: "Embedding generation failed"
- **Solution**: Check OPENAI_API_KEY is set and valid

**Issue**: "PDF extraction failed"
- **Solution**: PDF may be scanned image. Use OCR or provide text version

**Issue**: "No relevant context found"
- **Solution**: Lower minSimilarity threshold or upload more relevant content

**Issue**: "Context chunks not showing in output"
- **Solution**: Verify contextIds passed to BIAB execute API

### Getting Help

- GitHub Issues: https://github.com/AraMammo/full-stack-vibe-coder/issues
- Email: support@fullstackvibecoder.com
- Docs: https://docs.fullstackvibecoder.com

---

## Technical Reference

### Embedding Model Specifications

**Model**: `text-embedding-3-small`
- Dimensions: 1536
- Max input tokens: 8191
- Output: Float32 vector
- Similarity metric: Cosine similarity
- Performance: ~1000 embeds/sec (batch)

### Chunking Strategy

**Sliding Window**:
- Window size: 8000 chars (~2000 tokens)
- Overlap: 200 chars (~50 tokens)
- Boundary detection: Sentence > Word > Char
- Metadata: startChar, endChar, totalChunks

### Similarity Thresholds

- **0.9-1.0**: Near-identical text
- **0.7-0.9**: Highly relevant
- **0.5-0.7**: Somewhat relevant
- **<0.5**: Low relevance

**Recommended minimum**: 0.6

---

## Changelog

### v1.0.0 (2025-01-15)
- Initial RAG system implementation
- Support for PDF, DOCX, TXT, MD, HTML, URLs
- OpenAI embedding integration
- Semantic search with cosine similarity
- Context management UI
- BIAB orchestrator enhancement
- Complete API endpoints

---

**Built with ❤️ by the Fullstack Vibe Coder Team**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
