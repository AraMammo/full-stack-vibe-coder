/**
 * Brand Strategy Extractor
 *
 * Extracts brand colors, fonts, and design mood from visual_identity_05 prompt execution
 * for use in v0 generation
 */

import { PrismaClient } from '@/app/generated/prisma';

// ============================================
// TYPES
// ============================================

export interface BrandStrategy {
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    neutral?: string;
    all: string[]; // All hex codes found
  };
  typography: {
    primary?: string;
    secondary?: string;
    all: string[]; // All fonts mentioned
  };
  mood?: string;
  logos?: {
    primary?: string;     // First logo variation
    variations: string[]; // All logo URLs
  };
  rawOutput: string; // Original output for reference
}

// ============================================
// EXTRACTION FUNCTIONS
// ============================================

/**
 * Extract brand strategy from visual_identity_05 prompt execution
 *
 * @param projectId - The project ID to extract brand strategy for
 * @returns Brand strategy object with colors, fonts, and mood
 */
export async function extractBrandStrategy(projectId: string): Promise<BrandStrategy | null> {
  const prisma = new PrismaClient();

  try {
    console.log(`[Brand Extractor] Extracting brand strategy for project: ${projectId}`);

    // Query visual_identity_05 execution
    const execution = await prisma.promptExecution.findFirst({
      where: {
        projectId,
        prompt: {
          promptId: 'visual_identity_05',
        },
      },
      include: {
        prompt: true,
      },
      orderBy: {
        executedAt: 'desc', // Get most recent if multiple
      },
    });

    if (!execution) {
      console.log('[Brand Extractor] No visual_identity_05 execution found');
      return null;
    }

    console.log(`[Brand Extractor] Found execution: ${execution.id}`);

    const output = execution.output;

    // Extract colors
    const colors = extractColors(output);
    console.log(`[Brand Extractor] Found ${colors.all.length} colors`);

    // Extract fonts
    const typography = extractFonts(output);
    console.log(`[Brand Extractor] Found ${typography.all.length} fonts`);

    // Extract mood
    const mood = extractMood(output);
    if (mood) {
      console.log(`[Brand Extractor] Found mood: ${mood.substring(0, 50)}...`);
    }

    // Extract logo URLs
    const logos = extractLogos(output);
    if (logos && logos.variations.length > 0) {
      console.log(`[Brand Extractor] Found ${logos.variations.length} logo variations`);
    }

    return {
      colors,
      typography,
      mood,
      logos,
      rawOutput: output,
    };

  } catch (error) {
    console.error('[Brand Extractor] Error extracting brand strategy:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Extract hex color codes from text
 *
 * Looks for patterns like:
 * - #3B82F6
 * - Primary: #3B82F6
 * - #3B82F6 (Blue)
 */
function extractColors(text: string): BrandStrategy['colors'] {
  // Find all hex codes (with or without #)
  const hexPattern = /#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  const matches = text.match(hexPattern) || [];

  // Normalize to include #
  const allColors = matches.map(hex => hex.startsWith('#') ? hex : `#${hex}`);

  // Remove duplicates
  const uniqueColors = [...new Set(allColors)];

  // Try to identify primary, secondary, accent, neutral
  const colors: BrandStrategy['colors'] = {
    all: uniqueColors,
  };

  // Look for labeled colors
  const primaryMatch = text.match(/primary[:\s]+#?([0-9A-Fa-f]{6})/i);
  if (primaryMatch) colors.primary = `#${primaryMatch[1]}`;

  const secondaryMatch = text.match(/secondary[:\s]+#?([0-9A-Fa-f]{6})/i);
  if (secondaryMatch) colors.secondary = `#${secondaryMatch[1]}`;

  const accentMatch = text.match(/accent[:\s]+#?([0-9A-Fa-f]{6})/i);
  if (accentMatch) colors.accent = `#${accentMatch[1]}`;

  const neutralMatch = text.match(/neutral[:\s]+#?([0-9A-Fa-f]{6})/i);
  if (neutralMatch) colors.neutral = `#${neutralMatch[1]}`;

  // If no labeled colors, use first 4
  if (!colors.primary && uniqueColors.length > 0) colors.primary = uniqueColors[0];
  if (!colors.secondary && uniqueColors.length > 1) colors.secondary = uniqueColors[1];
  if (!colors.accent && uniqueColors.length > 2) colors.accent = uniqueColors[2];
  if (!colors.neutral && uniqueColors.length > 3) colors.neutral = uniqueColors[3];

  return colors;
}

/**
 * Extract font families from text
 *
 * Looks for common font names and patterns like:
 * - Inter
 * - Primary Font: Inter
 * - Font Family: "Open Sans"
 */
function extractFonts(text: string): BrandStrategy['typography'] {
  const allFonts: string[] = [];

  // Common web fonts pattern
  const fontPattern = /(?:font|typeface|typography)[:\s]+["']?([A-Za-z\s]+)["']?/gi;
  let match;

  while ((match = fontPattern.exec(text)) !== null) {
    const font = match[1].trim();
    if (font && font.length > 2 && font.length < 30) {
      allFonts.push(font);
    }
  }

  // Also look for standalone font names (common web fonts)
  const commonFonts = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Raleway', 'Nunito', 'Playfair Display', 'Merriweather', 'PT Sans',
    'Source Sans Pro', 'Oswald', 'Slabo', 'Ubuntu', 'Noto Sans', 'Helvetica',
    'Arial', 'Georgia', 'Times New Roman', 'Work Sans', 'Rubik', 'Karla',
    'DM Sans', 'Space Grotesk', 'Outfit', 'Plus Jakarta Sans'
  ];

  for (const font of commonFonts) {
    // Case-insensitive word boundary search
    const regex = new RegExp(`\\b${font}\\b`, 'i');
    if (regex.test(text) && !allFonts.some(f => f.toLowerCase() === font.toLowerCase())) {
      allFonts.push(font);
    }
  }

  // Remove duplicates (case-insensitive)
  const uniqueFonts = allFonts.filter((font, index, self) =>
    index === self.findIndex(f => f.toLowerCase() === font.toLowerCase())
  );

  const typography: BrandStrategy['typography'] = {
    all: uniqueFonts,
  };

  // Try to identify primary and secondary
  const primaryMatch = text.match(/primary\s+font[:\s]+["']?([A-Za-z\s]+)["']?/i);
  if (primaryMatch) typography.primary = primaryMatch[1].trim();

  const secondaryMatch = text.match(/secondary\s+font[:\s]+["']?([A-Za-z\s]+)["']?/i);
  if (secondaryMatch) typography.secondary = secondaryMatch[1].trim();

  // If no labeled fonts, use first 2
  if (!typography.primary && uniqueFonts.length > 0) typography.primary = uniqueFonts[0];
  if (!typography.secondary && uniqueFonts.length > 1) typography.secondary = uniqueFonts[1];

  return typography;
}

/**
 * Extract design mood/aesthetic description
 *
 * Looks for sections like:
 * - Design Mood: ...
 * - Aesthetic: ...
 * - Style: ...
 */
function extractMood(text: string): string | undefined {
  // Look for mood/aesthetic section
  const moodPatterns = [
    /(?:design\s+mood|aesthetic|style|vibe)[:\s]+(.+?)(?:\n\n|\n#|$)/is,
    /##\s*(?:design\s+mood|aesthetic|style)\s*\n+(.+?)(?:\n\n|\n#|$)/is,
  ];

  for (const pattern of moodPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean up the match
      let mood = match[1].trim();
      // Remove markdown formatting
      mood = mood.replace(/[*_`]/g, '');
      // Limit to 200 characters
      if (mood.length > 200) {
        mood = mood.substring(0, 200).trim() + '...';
      }
      return mood;
    }
  }

  return undefined;
}

/**
 * Extract logo URLs from visual_identity_05 output
 *
 * Looks for section added by logo generation:
 * ## Generated Logo Files
 * **Logo Variation 1:**
 * - Download: https://...
 */
function extractLogos(text: string): BrandStrategy['logos'] | undefined {
  const logoUrls: string[] = [];

  // Look for logo URLs in the Generated Logo Files section
  const logoPattern = /Download:\s+(https?:\/\/[^\s\)]+)/g;
  let match;

  while ((match = logoPattern.exec(text)) !== null) {
    const url = match[1].trim();
    if (url && isValidUrl(url)) {
      logoUrls.push(url);
    }
  }

  if (logoUrls.length === 0) {
    return undefined;
  }

  return {
    primary: logoUrls[0], // First variation is primary
    variations: logoUrls,
  };
}

/**
 * Validate if a string is a valid URL
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if a URL is accessible (returns 2xx status)
 */
export async function checkUrlAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`[Brand Extractor] URL not accessible: ${url}`, error);
    return false;
  }
}

/**
 * Format brand strategy for v0 system prompt
 *
 * @param brandStrategy - Extracted brand strategy
 * @returns Formatted string to add to v0 system prompt
 */
export function formatBrandStrategyForV0(brandStrategy: BrandStrategy | null): string {
  if (!brandStrategy) {
    return '';
  }

  const parts: string[] = ['\n\nBRAND IDENTITY SYSTEM:'];

  // Add logo section first (most important visual element)
  if (brandStrategy.logos && brandStrategy.logos.variations.length > 0) {
    parts.push(`\n\nBRAND LOGO:`);
    parts.push(`- Primary Logo URL: ${brandStrategy.logos.primary}`);
    parts.push(`- Display this logo in your header/navigation using: <img src="${brandStrategy.logos.primary}" alt="Logo" />`);
    parts.push(`- DO NOT create placeholder logos - use the provided URL`);

    if (brandStrategy.logos.variations.length > 1) {
      parts.push(`- Alternative variations available: ${brandStrategy.logos.variations.length} total`);
      // Include alternative URLs as a list
      brandStrategy.logos.variations.slice(1, 3).forEach((url, idx) => {
        parts.push(`  - Variation ${idx + 2}: ${url}`);
      });
    }

    parts.push(`- Logo file format: PNG with transparency`);
  }

  // Add color palette
  if (brandStrategy.colors.all.length > 0) {
    parts.push(`\n\nBRAND COLORS:`);
    if (brandStrategy.colors.primary) {
      parts.push(`- Primary: ${brandStrategy.colors.primary} (use for buttons, links, CTAs)`);
    }
    if (brandStrategy.colors.secondary) {
      parts.push(`- Secondary: ${brandStrategy.colors.secondary} (use for accents, highlights)`);
    }
    if (brandStrategy.colors.accent) {
      parts.push(`- Accent: ${brandStrategy.colors.accent} (use sparingly for emphasis)`);
    }
    if (brandStrategy.colors.neutral) {
      parts.push(`- Neutral: ${brandStrategy.colors.neutral} (use for text, backgrounds)`);
    }

    // Add remaining colors
    const remaining = brandStrategy.colors.all.filter(c =>
      c !== brandStrategy.colors.primary &&
      c !== brandStrategy.colors.secondary &&
      c !== brandStrategy.colors.accent &&
      c !== brandStrategy.colors.neutral
    );
    if (remaining.length > 0) {
      parts.push(`- Additional: ${remaining.join(', ')}`);
    }

    parts.push(`- Apply these exact hex codes in your Tailwind config and inline styles`);
  }

  // Add typography
  if (brandStrategy.typography.all.length > 0) {
    parts.push(`\n\nTYPOGRAPHY:`);
    if (brandStrategy.typography.primary) {
      parts.push(`- Headings: ${brandStrategy.typography.primary} (use for h1, h2, h3, buttons)`);
    }
    if (brandStrategy.typography.secondary) {
      parts.push(`- Body: ${brandStrategy.typography.secondary} (use for paragraphs, labels)`);
    }
    parts.push(`- Import these fonts from Google Fonts or use system fallbacks`);
    parts.push(`- Example: font-family: '${brandStrategy.typography.primary || 'Inter'}', sans-serif`);
  }

  // Add mood
  if (brandStrategy.mood) {
    parts.push(`\n\nDESIGN AESTHETIC:`);
    parts.push(brandStrategy.mood);
    parts.push(`\nEnsure your design choices (spacing, borders, shadows, etc.) reflect this aesthetic.`);
  }

  // Add critical requirements
  parts.push(`\n\nCRITICAL IMPLEMENTATION REQUIREMENTS:`);

  if (brandStrategy.logos?.primary) {
    parts.push(`1. ✓ Display the logo in the header using the exact URL provided`);
    parts.push(`   - Use <img src="${brandStrategy.logos.primary}" alt="Logo" className="h-8 w-auto" />`);
    parts.push(`   - Do not use placeholder text or icons - this is the real logo`);
  }

  if (brandStrategy.colors.primary) {
    parts.push(`2. ✓ Apply brand colors to ALL interactive elements (buttons, links, etc.)`);
    parts.push(`   - Primary color (${brandStrategy.colors.primary}) for main CTAs`);
    parts.push(`   - Use Tailwind config or inline styles with exact hex codes`);
  }

  if (brandStrategy.typography.primary) {
    parts.push(`3. ✓ Use specified fonts throughout the application`);
    parts.push(`   - Import from Google Fonts or use @font-face`);
    parts.push(`   - Apply consistently to maintain brand identity`);
  }

  parts.push(`4. ✓ Match the design aesthetic described above in all UI decisions`);
  parts.push(`5. ✓ This is a real brand with real assets - do not use generic placeholders`);

  return parts.join('\n');
}

/**
 * Test function to verify extraction works
 */
export async function testBrandExtraction(projectId: string): Promise<void> {
  console.log(`\n🎨 Testing brand extraction for project: ${projectId}\n`);

  const brandStrategy = await extractBrandStrategy(projectId);

  if (!brandStrategy) {
    console.log('❌ No brand strategy found');
    return;
  }

  console.log('✅ Brand strategy extracted:');

  console.log('\n🎨 LOGOS:');
  if (brandStrategy.logos) {
    console.log('  Primary:', brandStrategy.logos.primary);
    console.log('  Variations:', brandStrategy.logos.variations.length);
    brandStrategy.logos.variations.forEach((url, idx) => {
      console.log(`    ${idx + 1}. ${url}`);
    });
  } else {
    console.log('  Not found - logos may not have been generated yet');
  }

  console.log('\n📊 COLORS:');
  console.log('  Primary:', brandStrategy.colors.primary || 'Not found');
  console.log('  Secondary:', brandStrategy.colors.secondary || 'Not found');
  console.log('  Accent:', brandStrategy.colors.accent || 'Not found');
  console.log('  All:', brandStrategy.colors.all.join(', '));

  console.log('\n✏️  TYPOGRAPHY:');
  console.log('  Primary:', brandStrategy.typography.primary || 'Not found');
  console.log('  Secondary:', brandStrategy.typography.secondary || 'Not found');
  console.log('  All:', brandStrategy.typography.all.join(', '));

  console.log('\n🎭 MOOD:');
  console.log(' ', brandStrategy.mood || 'Not found');

  console.log('\n📝 Formatted for v0:');
  console.log(formatBrandStrategyForV0(brandStrategy));
}
