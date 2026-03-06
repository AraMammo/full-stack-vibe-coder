/**
 * Vision API Integration — Visual DNA Extraction
 *
 * Takes a screenshot image buffer, runs Google Cloud Vision API for
 * image properties and labels, then passes results to Claude to
 * produce a structured Visual DNA block.
 *
 * Visual DNA block format:
 *   COLOR SIGNALS: [dominant hex values, contrast style]
 *   LAYOUT SIGNALS: [density, nav pattern, hero pattern]
 *   TYPOGRAPHY SIGNALS: [heading weight, body style]
 *   COMPONENT PATTERNS: [card style, button style, imagery]
 */

import Anthropic from '@anthropic-ai/sdk';

// ============================================
// TYPES
// ============================================

export interface VisualDNABlock {
  raw: string; // The full text block to inject into prompts
  colorSignals: string;
  layoutSignals: string;
  typographySignals: string;
  componentPatterns: string;
}

interface VisionApiResponse {
  responses: Array<{
    imagePropertiesAnnotation?: {
      dominantColors?: {
        colors: Array<{
          color: { red: number; green: number; blue: number };
          score: number;
          pixelFraction: number;
        }>;
      };
    };
    labelAnnotations?: Array<{
      description: string;
      score: number;
    }>;
  }>;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Extract Visual DNA from an image buffer.
 * Uses Google Cloud Vision API for raw signals, then Claude for structured analysis.
 */
export async function extractVisualDNA(imageBuffer: Buffer): Promise<VisualDNABlock> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY not set');
  }

  console.log('[VisualDNA] Analyzing image with Google Vision API...');

  // Step 1: Call Google Cloud Vision API
  const base64Image = imageBuffer.toString('base64');

  const visionResponse = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'IMAGE_PROPERTIES', maxResults: 10 },
              { type: 'LABEL_DETECTION', maxResults: 15 },
            ],
          },
        ],
      }),
    }
  );

  if (!visionResponse.ok) {
    const errorText = await visionResponse.text();
    throw new Error(`Vision API failed: ${visionResponse.status} ${errorText}`);
  }

  const visionData: VisionApiResponse = await visionResponse.json();
  const annotation = visionData.responses[0];

  // Extract dominant colors
  const dominantColors = annotation.imagePropertiesAnnotation?.dominantColors?.colors || [];
  const colorList = dominantColors
    .slice(0, 6)
    .map((c) => {
      const hex = rgbToHex(c.color.red, c.color.green, c.color.blue);
      return `${hex} (score: ${c.score.toFixed(2)}, coverage: ${(c.pixelFraction * 100).toFixed(1)}%)`;
    })
    .join('\n');

  // Extract labels
  const labels = annotation.labelAnnotations || [];
  const labelList = labels
    .map((l) => `${l.description} (confidence: ${(l.score * 100).toFixed(0)}%)`)
    .join(', ');

  console.log(`[VisualDNA] Found ${dominantColors.length} colors, ${labels.length} labels`);

  // Step 2: Pass to Claude for structured analysis
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const claudeResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `Analyze these visual properties from a website screenshot and return a structured Visual DNA block. Return ONLY the block, no explanation.

Dominant Colors:
${colorList}

Detected Labels: ${labelList}

Return in this exact format:
COLOR SIGNALS: [dominant hex values, contrast style (high/medium/low), warm/cool/neutral palette]
LAYOUT SIGNALS: [density (sparse/balanced/dense), nav pattern, hero pattern]
TYPOGRAPHY SIGNALS: [heading weight (bold/medium/light), body style (serif/sans-serif/mixed)]
COMPONENT PATTERNS: [card style, button style, imagery style]`,
      },
    ],
  });

  const blockText =
    claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text.trim() : '';

  console.log('[VisualDNA] Visual DNA block generated');

  // Parse the block into structured fields
  return parseVisualDNABlock(blockText);
}

// ============================================
// HELPERS
// ============================================

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => {
        const hex = Math.round(v).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function parseVisualDNABlock(blockText: string): VisualDNABlock {
  const colorMatch = blockText.match(/COLOR SIGNALS:\s*\[([^\]]*)\]/i);
  const layoutMatch = blockText.match(/LAYOUT SIGNALS:\s*\[([^\]]*)\]/i);
  const typographyMatch = blockText.match(/TYPOGRAPHY SIGNALS:\s*\[([^\]]*)\]/i);
  const componentMatch = blockText.match(/COMPONENT PATTERNS:\s*\[([^\]]*)\]/i);

  return {
    raw: blockText,
    colorSignals: colorMatch?.[1]?.trim() || '',
    layoutSignals: layoutMatch?.[1]?.trim() || '',
    typographySignals: typographyMatch?.[1]?.trim() || '',
    componentPatterns: componentMatch?.[1]?.trim() || '',
  };
}
