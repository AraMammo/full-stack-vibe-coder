/**
 * Convert Markdown to Professional PDF
 *
 * Converts BIAB deliverable markdown files to beautifully formatted PDFs
 * with branding, table of contents, and professional styling.
 */

import puppeteer from 'puppeteer';
import MarkdownIt from 'markdown-it';
import { promises as fs } from 'fs';
import path from 'path';

interface PDFConversionOptions {
  projectName: string;
  documentTitle: string;
  sectionName: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  includeTableOfContents?: boolean;
  includePageNumbers?: boolean;
}

const DEFAULT_BRAND_COLORS = {
  primary: '#ec4899', // Pink
  secondary: '#06b6d4', // Cyan
  accent: '#10b981', // Green
};

/**
 * Convert markdown content to PDF with professional styling
 */
export async function convertMarkdownToPDF(
  markdownContent: string,
  options: PDFConversionOptions
): Promise<Buffer> {
  const {
    projectName,
    documentTitle,
    sectionName,
    brandColors = DEFAULT_BRAND_COLORS,
    includeTableOfContents = true,
    includePageNumbers = true,
  } = options;

  // Initialize markdown parser
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });

  // Convert markdown to HTML
  const contentHtml = md.render(markdownContent);

  // Generate table of contents from headings
  const toc = includeTableOfContents
    ? generateTableOfContents(markdownContent)
    : '';

  // Build complete HTML document with professional styling
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${documentTitle}</title>
  <style>
    /* Page setup */
    @page {
      size: A4;
      margin: 2.5cm 2cm;
      @bottom-right {
        content: ${includePageNumbers ? '"Page " counter(page)' : '""'};
        font-size: 10px;
        color: #666;
      }
    }

    /* Reset & Base */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
    }

    /* Cover page */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
      background: linear-gradient(135deg, ${brandColors.primary}15 0%, ${brandColors.secondary}15 100%);
      border-bottom: 4px solid ${brandColors.primary};
    }

    .cover-logo {
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary});
      border-radius: 24px;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      color: white;
      font-weight: bold;
    }

    .cover-title {
      font-size: 36pt;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
      max-width: 80%;
    }

    .cover-subtitle {
      font-size: 18pt;
      color: #666;
      margin-bottom: 1rem;
    }

    .cover-section {
      display: inline-block;
      background: ${brandColors.primary};
      color: white;
      padding: 0.5rem 1.5rem;
      border-radius: 20px;
      font-size: 12pt;
      font-weight: 600;
      margin-top: 2rem;
    }

    .cover-footer {
      position: absolute;
      bottom: 3cm;
      font-size: 10pt;
      color: #999;
    }

    /* Table of Contents */
    .toc {
      page-break-after: always;
      padding: 2rem 0;
    }

    .toc-title {
      font-size: 24pt;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 2rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid ${brandColors.primary};
    }

    .toc-list {
      list-style: none;
    }

    .toc-item {
      margin: 0.75rem 0;
      padding: 0.5rem;
      border-left: 3px solid transparent;
      transition: all 0.2s;
    }

    .toc-item:hover {
      border-left-color: ${brandColors.primary};
      background: #f9f9f9;
    }

    .toc-item.level-1 {
      font-weight: 600;
      font-size: 12pt;
    }

    .toc-item.level-2 {
      font-size: 11pt;
      padding-left: 1.5rem;
    }

    .toc-item.level-3 {
      font-size: 10pt;
      padding-left: 3rem;
      color: #666;
    }

    /* Content */
    .content {
      padding: 1rem 0;
    }

    h1 {
      font-size: 28pt;
      font-weight: 700;
      color: ${brandColors.primary};
      margin-top: 2rem;
      margin-bottom: 1rem;
      page-break-after: avoid;
      border-bottom: 3px solid ${brandColors.primary};
      padding-bottom: 0.5rem;
    }

    h2 {
      font-size: 20pt;
      font-weight: 600;
      color: #1a1a1a;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      page-break-after: avoid;
      border-left: 4px solid ${brandColors.secondary};
      padding-left: 0.75rem;
    }

    h3 {
      font-size: 14pt;
      font-weight: 600;
      color: #333;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      page-break-after: avoid;
    }

    h4, h5, h6 {
      font-size: 12pt;
      font-weight: 600;
      color: #555;
      margin-top: 0.75rem;
      margin-bottom: 0.5rem;
    }

    p {
      margin-bottom: 0.75rem;
      text-align: justify;
      orphans: 3;
      widows: 3;
    }

    /* Lists */
    ul, ol {
      margin: 0.75rem 0;
      padding-left: 2rem;
    }

    li {
      margin: 0.4rem 0;
      line-height: 1.6;
    }

    ul li::marker {
      color: ${brandColors.primary};
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      page-break-inside: avoid;
      font-size: 10pt;
    }

    th {
      background: ${brandColors.primary};
      color: white;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
    }

    td {
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid #e5e5e5;
    }

    tr:nth-child(even) {
      background: #f9f9f9;
    }

    /* Code blocks */
    code {
      background: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 9pt;
      color: ${brandColors.primary};
    }

    pre {
      background: #1a1a1a;
      color: #f5f5f5;
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin: 1rem 0;
      page-break-inside: avoid;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }

    /* Blockquotes */
    blockquote {
      border-left: 4px solid ${brandColors.accent};
      background: #f9f9f9;
      padding: 1rem 1.5rem;
      margin: 1rem 0;
      font-style: italic;
      color: #555;
    }

    /* Links */
    a {
      color: ${brandColors.primary};
      text-decoration: none;
      border-bottom: 1px dotted ${brandColors.primary};
    }

    a:hover {
      border-bottom-style: solid;
    }

    /* Emphasis */
    strong {
      font-weight: 600;
      color: #1a1a1a;
    }

    em {
      color: #555;
    }

    /* Horizontal rules */
    hr {
      border: none;
      border-top: 2px solid #e5e5e5;
      margin: 2rem 0;
    }

    /* Callout boxes */
    .callout {
      background: ${brandColors.accent}15;
      border-left: 4px solid ${brandColors.accent};
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 0 6px 6px 0;
    }

    /* Print optimizations */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-logo">
      ${projectName.charAt(0).toUpperCase()}
    </div>
    <h1 class="cover-title">${projectName}</h1>
    <p class="cover-subtitle">${documentTitle}</p>
    <span class="cover-section">${sectionName}</span>
    <p class="cover-footer">Generated with Business in a Box</p>
  </div>

  <!-- Table of Contents -->
  ${toc}

  <!-- Content -->
  <div class="content">
    ${contentHtml}
  </div>
</body>
</html>
  `;

  // Launch headless browser and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF with professional settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: '2.5cm',
        right: '2cm',
        bottom: '2.5cm',
        left: '2cm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generate table of contents from markdown headings
 */
function generateTableOfContents(markdownContent: string): string {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string }> = [];

  let match;
  while ((match = headingRegex.exec(markdownContent)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    headings.push({ level, text });
  }

  if (headings.length === 0) {
    return '';
  }

  const tocItems = headings
    .map(({ level, text }) => {
      return `<li class="toc-item level-${level}">${text}</li>`;
    })
    .join('\n');

  return `
    <div class="toc">
      <h2 class="toc-title">Table of Contents</h2>
      <ul class="toc-list">
        ${tocItems}
      </ul>
    </div>
  `;
}

/**
 * Batch convert multiple markdown files to PDFs
 */
export async function batchConvertToPDFs(
  documents: Array<{
    filename: string;
    content: string;
    title: string;
    section: string;
  }>,
  projectName: string,
  brandColors?: { primary: string; secondary: string; accent: string }
): Promise<Array<{ filename: string; buffer: Buffer }>> {
  const results: Array<{ filename: string; buffer: Buffer }> = [];

  for (const doc of documents) {
    console.log(`[PDF Converter] Converting: ${doc.title}`);

    const pdfBuffer = await convertMarkdownToPDF(doc.content, {
      projectName,
      documentTitle: doc.title,
      sectionName: doc.section,
      brandColors,
      includeTableOfContents: true,
      includePageNumbers: true,
    });

    const pdfFilename = doc.filename.replace(/\.md$/, '.pdf');
    results.push({ filename: pdfFilename, buffer: pdfBuffer });

    console.log(`[PDF Converter] ✓ Converted: ${pdfFilename}`);
  }

  return results;
}
