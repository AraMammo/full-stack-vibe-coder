/**
 * Text Extraction Service
 *
 * Extracts text content from various file formats for RAG context building
 * Supports: PDF, DOCX, TXT, MD, HTML, and URL scraping
 */

// ============================================
// TYPES
// ============================================

export interface ExtractionResult {
  success: boolean;
  text: string;
  metadata: {
    fileType: string;
    fileName?: string;
    pageCount?: number;
    wordCount: number;
    charCount: number;
    extractedAt: string;
    sections?: string[];
    [key: string]: any;
  };
  error?: string;
}

export interface URLExtractionResult extends ExtractionResult {
  metadata: ExtractionResult['metadata'] & {
    url: string;
    title?: string;
    description?: string;
    author?: string;
  };
}

// ============================================
// TEXT EXTRACTION
// ============================================

/**
 * Extract text from a file buffer based on file type
 *
 * @param buffer - File buffer
 * @param fileName - Original file name
 * @param mimeType - MIME type of the file
 * @returns Extraction result with text and metadata
 */
export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ExtractionResult> {
  console.log(`[Text Extraction] Processing ${fileName} (${mimeType})...`);

  try {
    let text: string;
    let metadata: any = {
      fileType: mimeType,
      fileName,
      extractedAt: new Date().toISOString(),
    };

    // Route to appropriate extractor based on MIME type
    if (mimeType === 'application/pdf') {
      const result = await extractFromPDF(buffer);
      text = result.text;
      metadata = { ...metadata, ...result.metadata };
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await extractFromDOCX(buffer);
      text = result.text;
      metadata = { ...metadata, ...result.metadata };
    } else if (mimeType.startsWith('text/')) {
      // Plain text, markdown, etc.
      text = buffer.toString('utf-8');
      metadata.sections = detectSections(text);
    } else if (mimeType === 'text/html' || mimeType === 'application/xhtml+xml') {
      text = extractFromHTML(buffer.toString('utf-8'));
    } else {
      // Fallback: try to read as text
      text = buffer.toString('utf-8');
    }

    // Clean and normalize text
    text = cleanText(text);

    // Calculate word count
    metadata.wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    metadata.charCount = text.length;

    console.log(`[Text Extraction] ✓ Extracted ${metadata.wordCount} words from ${fileName}`);

    return {
      success: true,
      text,
      metadata,
    };

  } catch (error: any) {
    console.error(`[Text Extraction] ✗ Failed to extract text from ${fileName}:`, error.message);
    return {
      success: false,
      text: '',
      metadata: {
        fileType: mimeType,
        fileName,
        wordCount: 0,
        charCount: 0,
        extractedAt: new Date().toISOString(),
      },
      error: error.message,
    };
  }
}

/**
 * Extract text from PDF buffer
 * Uses pdf-parse library
 *
 * @param buffer - PDF file buffer
 * @returns Extracted text and metadata
 */
async function extractFromPDF(buffer: Buffer): Promise<{ text: string; metadata: any }> {
  try {
    // Dynamically import pdf-parse
    const pdfParseModule = await import('pdf-parse') as any;
    const pdfParse = pdfParseModule.default || pdfParseModule;

    const data = await pdfParse(buffer);

    return {
      text: data.text,
      metadata: {
        pageCount: data.numpages,
        pdfInfo: data.info,
      },
    };
  } catch (error: any) {
    console.error('[PDF Extraction] Error:', error.message);

    // If pdf-parse not installed, return helpful error
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error('PDF parsing requires pdf-parse package. Install with: npm install pdf-parse');
    }

    throw error;
  }
}

/**
 * Extract text from DOCX buffer
 * Uses mammoth library
 *
 * @param buffer - DOCX file buffer
 * @returns Extracted text and metadata
 */
async function extractFromDOCX(buffer: Buffer): Promise<{ text: string; metadata: any }> {
  try {
    // Dynamically import mammoth
    const mammoth = await import('mammoth');

    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value,
      metadata: {
        messages: result.messages,
      },
    };
  } catch (error: any) {
    console.error('[DOCX Extraction] Error:', error.message);

    // If mammoth not installed, return helpful error
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error('DOCX parsing requires mammoth package. Install with: npm install mammoth');
    }

    throw error;
  }
}

/**
 * Extract text from HTML string
 * Removes scripts, styles, and tags
 *
 * @param html - HTML string
 * @returns Plain text content
 */
function extractFromHTML(html: string): string {
  // Remove script and style tags with their content
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));

  return text;
}

// ============================================
// URL SCRAPING
// ============================================

/**
 * Extract text content from a URL
 * Fetches page and extracts main content
 *
 * @param url - URL to scrape
 * @returns Extraction result with text and metadata
 */
export async function extractTextFromURL(url: string): Promise<URLExtractionResult> {
  console.log(`[URL Extraction] Fetching ${url}...`);

  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported');
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FullstackVibeCoderBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract text from HTML
    const text = extractFromHTML(html);

    // Extract metadata from HTML
    const metadata = extractHTMLMetadata(html, url);

    // Clean text
    const cleanedText = cleanText(text);

    console.log(`[URL Extraction] ✓ Extracted ${metadata.wordCount} words from ${url}`);

    return {
      success: true,
      text: cleanedText,
      metadata: {
        ...metadata,
        fileType: 'text/html',
        url,
        extractedAt: new Date().toISOString(),
      },
    };

  } catch (error: any) {
    console.error(`[URL Extraction] ✗ Failed to extract from ${url}:`, error.message);
    return {
      success: false,
      text: '',
      metadata: {
        fileType: 'text/html',
        url,
        wordCount: 0,
        charCount: 0,
        extractedAt: new Date().toISOString(),
      },
      error: error.message,
    };
  }
}

/**
 * Extract metadata from HTML (title, description, author)
 *
 * @param html - HTML string
 * @param url - Page URL
 * @returns Metadata object
 */
function extractHTMLMetadata(html: string, url: string): any {
  const metadata: any = {
    url,
  };

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (descMatch) {
    metadata.description = descMatch[1].trim();
  }

  // Extract author
  const authorMatch = html.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i);
  if (authorMatch) {
    metadata.author = authorMatch[1].trim();
  }

  // Extract Open Graph metadata
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (ogTitleMatch && !metadata.title) {
    metadata.title = ogTitleMatch[1].trim();
  }

  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  if (ogDescMatch && !metadata.description) {
    metadata.description = ogDescMatch[1].trim();
  }

  // Calculate word count
  const text = extractFromHTML(html);
  metadata.wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  metadata.charCount = text.length;

  return metadata;
}

// ============================================
// TEXT CLEANING & PROCESSING
// ============================================

/**
 * Clean and normalize extracted text
 *
 * @param text - Raw extracted text
 * @returns Cleaned text
 */
function cleanText(text: string): string {
  // Remove excessive whitespace
  let cleaned = text.replace(/[ \t]+/g, ' ');

  // Normalize line breaks (max 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remove leading/trailing whitespace from each line
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');

  // Remove leading/trailing whitespace from entire text
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Detect sections in markdown or structured text
 * Useful for chunking by section
 *
 * @param text - Text to analyze
 * @returns Array of section titles
 */
function detectSections(text: string): string[] {
  const sections: string[] = [];

  // Look for markdown headers (# Header, ## Header, etc.)
  const headerRegex = /^#{1,6}\s+(.+)$/gm;
  let match;

  while ((match = headerRegex.exec(text)) !== null) {
    sections.push(match[1].trim());
  }

  // If no markdown headers, look for underlined headers
  if (sections.length === 0) {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1].trim();

      // Check if next line is all === or ---
      if (line.length > 0 && (nextLine.match(/^=+$/) || nextLine.match(/^-+$/))) {
        sections.push(line);
      }
    }
  }

  return sections;
}

/**
 * Split text into sections based on headers
 * Returns array of {title, content} objects
 *
 * @param text - Text to split
 * @returns Array of sections
 */
export function splitIntoSections(text: string): Array<{ title: string; content: string }> {
  const sections: Array<{ title: string; content: string }> = [];

  // Split by markdown headers
  const parts = text.split(/^(#{1,6}\s+.+)$/gm);

  if (parts.length === 1) {
    // No headers found, return entire text as single section
    return [{
      title: 'Main Content',
      content: text.trim(),
    }];
  }

  // Process parts (alternating headers and content)
  let currentTitle = 'Introduction';
  let currentContent = parts[0].trim(); // Content before first header

  if (currentContent) {
    sections.push({ title: currentTitle, content: currentContent });
  }

  for (let i = 1; i < parts.length; i += 2) {
    if (parts[i]) {
      // Remove markdown header symbols
      currentTitle = parts[i].replace(/^#+\s+/, '').trim();
      currentContent = parts[i + 1] ? parts[i + 1].trim() : '';

      if (currentContent) {
        sections.push({ title: currentTitle, content: currentContent });
      }
    }
  }

  return sections;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Detect file type from buffer
 * Checks magic bytes for common formats
 *
 * @param buffer - File buffer
 * @returns MIME type
 */
export function detectFileType(buffer: Buffer): string {
  // Check magic bytes
  if (buffer.length >= 4) {
    // PDF: %PDF
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'application/pdf';
    }

    // DOCX (ZIP format): PK
    if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
      // Check for word/document.xml inside
      const str = buffer.toString('utf-8', 0, Math.min(500, buffer.length));
      if (str.includes('word/')) {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      return 'application/zip';
    }

    // HTML: <htm or <!DO
    const start = buffer.toString('utf-8', 0, 10).toLowerCase();
    if (start.includes('<html') || start.includes('<!doctype')) {
      return 'text/html';
    }
  }

  // Try to decode as UTF-8 text
  try {
    const text = buffer.toString('utf-8');
    // Check if it's valid UTF-8
    if (text.length > 0 && !text.includes('\uFFFD')) {
      return 'text/plain';
    }
  } catch (e) {
    // Not valid UTF-8
  }

  return 'application/octet-stream';
}

/**
 * Check if file type is supported for text extraction
 *
 * @param mimeType - MIME type to check
 * @returns True if supported
 */
export function isSupportedFileType(mimeType: string): boolean {
  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/html',
    'text/xml',
    'application/json',
  ];

  return supportedTypes.includes(mimeType) || mimeType.startsWith('text/');
}

/**
 * Get human-readable file type name
 *
 * @param mimeType - MIME type
 * @returns Human-readable name
 */
export function getFileTypeName(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'text/plain': 'Text File',
    'text/markdown': 'Markdown File',
    'text/html': 'HTML Document',
    'text/xml': 'XML Document',
    'application/json': 'JSON File',
  };

  return typeMap[mimeType] || mimeType;
}
