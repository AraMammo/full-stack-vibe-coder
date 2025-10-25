# Brand Strategy Extraction for v0

## Overview

The BIAB system now automatically extracts brand colors and fonts from the `visual_identity_05` prompt execution and pipes them directly to v0, ensuring generated applications perfectly match the user's brand.

## How It Works

### 1. Storage Location

Brand strategy is stored in the **`PromptExecution` table**:

```prisma
model PromptExecution {
  id        Int     @id
  promptId  Int
  projectId String
  output    String  @db.Text  // ← Brand strategy stored here as markdown
  ...
}
```

The `visual_identity_05` prompt execution contains:
- **Color palette** (3-5 colors with hex codes)
- **Typography** (2-3 fonts)
- **Logo URLs** (5 PNG variations from Dumpling AI) ← NEW
- **Logo concept** (design description)
- **Design mood/aesthetic**

### 2. Example Output

The `output` field contains markdown like:

```markdown
# Visual Identity

## Color Palette
- Primary: #3B82F6 (Professional Blue)
- Secondary: #10B981 (Success Green)
- Accent: #F59E0B (Warm Amber)
- Neutral: #6B7280 (Cool Gray)

## Typography
- Primary Font: Inter (Modern, Clean)
- Secondary Font: Open Sans (Readable Body)

## Design Mood
Modern, professional, tech-forward aesthetic with clean lines
and accessible design. Emphasizes trust and innovation.

## Generated Logo Files

**Logo Variation 1:**
- Download: https://supabase-url.com/logos/1234-logo-variation-1.png
- File: logo-variation-1.png

**Logo Variation 2:**
- Download: https://supabase-url.com/logos/1234-logo-variation-2.png
- File: logo-variation-2.png

...
```

### 3. Extraction Flow

```
visual_identity_05 Execution Completes
        ↓
Output Stored in PromptExecution.output
        ↓
replit_site_16 Execution Completes
        ↓
Extract Brand Strategy from visual_identity_05
        ↓
Parse Colors (hex codes)
Parse Fonts (font families)
Parse Mood (design aesthetic)
        ↓
Format for v0 System Prompt
        ↓
Send to v0 with Brand Instructions
        ↓
v0 Generates App with Exact Brand Colors/Fonts
```

## API Usage

### Extract Brand Strategy

```typescript
import { extractBrandStrategy } from '@/lib/services/brand-strategy-extractor';

const brandStrategy = await extractBrandStrategy(projectId);

if (brandStrategy) {
  console.log('Primary Color:', brandStrategy.colors.primary);
  console.log('Primary Font:', brandStrategy.typography.primary);
  console.log('All Colors:', brandStrategy.colors.all);
  console.log('All Fonts:', brandStrategy.typography.all);
  console.log('Mood:', brandStrategy.mood);
}
```

**Returns:**
```typescript
interface BrandStrategy {
  colors: {
    primary?: string;      // e.g., "#3B82F6"
    secondary?: string;    // e.g., "#10B981"
    accent?: string;       // e.g., "#F59E0B"
    neutral?: string;      // e.g., "#6B7280"
    all: string[];        // All hex codes found
  };
  typography: {
    primary?: string;      // e.g., "Inter"
    secondary?: string;    // e.g., "Open Sans"
    all: string[];        // All fonts mentioned
  };
  logos?: {               // ← NEW
    primary?: string;     // First logo variation URL
    variations: string[]; // All logo URLs (typically 5)
  };
  mood?: string;          // Design aesthetic description
  rawOutput: string;      // Original markdown output
}
```

### Format for v0

```typescript
import { formatBrandStrategyForV0 } from '@/lib/services/brand-strategy-extractor';

const formattedInstructions = formatBrandStrategyForV0(brandStrategy);

// Add to v0 system prompt
const systemPrompt = `You are an expert developer. ${formattedInstructions}`;
```

**Output:**
```
BRAND IDENTITY SYSTEM:

BRAND LOGO:
- Primary Logo URL: https://supabase.com/.../logo-variation-1.png
- Display this logo in your header/navigation using: <img src="..." alt="Logo" />
- DO NOT create placeholder logos - use the provided URL
- Alternative variations available: 5 total
- Logo file format: PNG with transparency

BRAND COLORS:
- Primary: #3B82F6 (use for buttons, links, CTAs)
- Secondary: #10B981 (use for accents, highlights)
- Accent: #F59E0B (use sparingly for emphasis)
- Additional: #6B7280

TYPOGRAPHY:
- Headings: Inter (use for h1, h2, h3, buttons)
- Body: Open Sans (use for paragraphs, labels)
- Import these fonts from Google Fonts or use system fallbacks

DESIGN AESTHETIC:
Modern, professional, tech-forward aesthetic with clean lines
and accessible design. Emphasizes trust and innovation.

CRITICAL IMPLEMENTATION REQUIREMENTS:
1. ✓ Display the logo in the header using the exact URL provided
2. ✓ Apply brand colors to ALL interactive elements
3. ✓ Use specified fonts throughout the application
4. ✓ Match the design aesthetic described above
5. ✓ This is a real brand with real assets - do not use generic placeholders
```

### Test Extraction

```bash
npx tsx -e "
import { testBrandExtraction } from './lib/services/brand-strategy-extractor';
testBrandExtraction('your-project-id');
"
```

## Automatic Integration

The brand extraction is **automatically integrated** into the v0 deployment flow:

1. **After `replit_site_16` executes**
2. **Extract brand strategy** from `visual_identity_05`
3. **Format for v0** system prompt
4. **Send to v0** with brand instructions
5. **v0 generates app** using exact brand colors and fonts

### Orchestrator Integration

In `lib/agents/biab-orchestrator-agent.ts`:

```typescript
// Step 1: Extract brand strategy
const brandStrategy = await extractBrandStrategy(projectId);

// Step 2: Build system prompt with brand
let systemPrompt = 'You are an expert full-stack developer...';

if (brandStrategy) {
  const brandInstructions = formatBrandStrategyForV0(brandStrategy);
  systemPrompt += `\n\n${brandInstructions}\n\nIMPORTANT: Use these exact brand colors and fonts...`;
}

// Step 3: Generate with brand-aware prompt
const v0Result = await generateV0App({
  prompt: replitPrompt,
  systemPrompt, // Includes brand strategy
  chatPrivacy: 'private',
  waitForCompletion: true,
});
```

## Extraction Logic

### Color Extraction

Looks for patterns like:
- `#3B82F6` (hex codes)
- `Primary: #3B82F6`
- `#3B82F6 (Blue)`

Identifies:
- Primary, secondary, accent, neutral (by label)
- Falls back to first 4 colors if not labeled
- Removes duplicates

### Font Extraction

Looks for patterns like:
- `Primary Font: Inter`
- `Font Family: "Open Sans"`
- Common web font names (Inter, Roboto, Lato, etc.)

Identifies:
- Primary and secondary fonts (by label)
- Falls back to first 2 fonts if not labeled
- Case-insensitive matching

### Mood Extraction

Looks for sections like:
- `Design Mood: ...`
- `## Aesthetic`
- `Style: ...`

Extracts:
- Up to 200 characters of description
- Cleans markdown formatting

## Benefits

### Before Brand Extraction

v0 generated apps with:
- ❌ Generic colors (default Tailwind palette)
- ❌ Default fonts (system fonts)
- ❌ No brand consistency

### After Brand Extraction

v0 generates apps with:
- ✅ **Exact brand colors** from visual identity
- ✅ **Specified fonts** from typography
- ✅ **Brand-consistent design** matching mood
- ✅ **Professional appearance** from day one
- ✅ **No manual styling needed**

## Example Comparison

### Without Brand Extraction

```typescript
// Generic v0 prompt
systemPrompt: 'You are an expert developer. Build a Next.js app.'
```

**Result:** Generic blue (#3B82F6), system fonts, no brand personality

### With Brand Extraction

```typescript
// Brand-aware v0 prompt
systemPrompt: `You are an expert developer. Build a Next.js app.

BRAND COLORS:
- Primary: #6366F1 (Indigo)
- Secondary: #EC4899 (Pink)
- Accent: #F59E0B (Amber)

TYPOGRAPHY:
- Headings: Montserrat
- Body: Inter

DESIGN AESTHETIC:
Bold, modern, and energetic with vibrant colors

IMPORTANT: Use these exact brand colors and fonts in your implementation.`
```

**Result:** Uses #6366F1, #EC4899, Montserrat & Inter, vibrant energy

## Troubleshooting

### No Brand Strategy Extracted

**Problem:** `extractBrandStrategy()` returns `null`

**Causes:**
1. `visual_identity_05` prompt not executed yet
2. Project ID is incorrect
3. Database connection issue

**Solution:**
```typescript
// Check if execution exists
const execution = await prisma.promptExecution.findFirst({
  where: {
    projectId: 'your-project-id',
    prompt: { promptId: 'visual_identity_05' }
  }
});

console.log('Execution found:', !!execution);
```

### Colors Not Extracted

**Problem:** `brandStrategy.colors.all` is empty

**Causes:**
1. Output doesn't contain hex codes
2. Colors not in standard format (#RRGGBB)
3. Text encoding issues

**Solution:**
- Check `rawOutput` field
- Verify hex codes are present
- Ensure format is `#3B82F6` or `3B82F6`

### Fonts Not Extracted

**Problem:** `brandStrategy.typography.all` is empty

**Causes:**
1. Font names not recognized
2. Unusual font names not in common list
3. Font mentioned without "font" keyword

**Solution:**
- Add custom fonts to `commonFonts` array
- Check if fonts are mentioned with context words
- Verify rawOutput contains font information

## Testing

### Unit Test

```bash
npx tsx -e "
import { testBrandExtraction } from './lib/services/brand-strategy-extractor';

// Test with real project ID
testBrandExtraction('abc-123-def').then(() => {
  console.log('✓ Test complete');
});
"
```

**Expected Output:**
```
🎨 Testing brand extraction for project: abc-123-def

[Brand Extractor] Extracting brand strategy for project: abc-123-def
[Brand Extractor] Found execution: 42
[Brand Extractor] Found 4 colors
[Brand Extractor] Found 2 fonts
[Brand Extractor] Found mood: Modern, professional...

✅ Brand strategy extracted:

📊 COLORS:
  Primary: #3B82F6
  Secondary: #10B981
  Accent: #F59E0B
  All: #3B82F6, #10B981, #F59E0B, #6B7280

✏️  TYPOGRAPHY:
  Primary: Inter
  Secondary: Open Sans
  All: Inter, Open Sans

🎭 MOOD:
  Modern, professional, tech-forward aesthetic...

📝 Formatted for v0:
BRAND COLORS:
- Primary: #3B82F6
...
```

### Integration Test

Run full BIAB flow and check logs:

```bash
npx tsx scripts/test-biab-complete-flow.ts
```

**Look for:**
```
[BIAB Orchestrator] 🚀 Deploying to v0...
[BIAB Orchestrator] Extracting brand strategy...
[Brand Extractor] Found execution: 42
[Brand Extractor] Found 4 colors
[Brand Extractor] Found 2 fonts
[BIAB Orchestrator] ✓ Brand strategy added to system prompt
[BIAB Orchestrator]   Colors: 4 found
[BIAB Orchestrator]   Fonts: 2 found
[v0] Starting app generation...
```

## Advanced Usage

### Custom System Prompt

```typescript
import { extractBrandStrategy } from '@/lib/services/brand-strategy-extractor';

const brandStrategy = await extractBrandStrategy(projectId);

// Build custom prompt
let customPrompt = 'You are a senior designer. ';

if (brandStrategy?.colors.primary) {
  customPrompt += `Use ${brandStrategy.colors.primary} as the hero color. `;
}

if (brandStrategy?.typography.primary) {
  customPrompt += `Use ${brandStrategy.typography.primary} for all headings. `;
}

if (brandStrategy?.mood) {
  customPrompt += `The aesthetic should be: ${brandStrategy.mood}`;
}
```

### Extract for Email Templates

```typescript
// Use brand colors in email templates
const brand = await extractBrandStrategy(projectId);

const emailTemplate = `
  <style>
    .primary-button {
      background-color: ${brand.colors.primary};
      font-family: ${brand.typography.primary}, sans-serif;
    }
  </style>
`;
```

### Extract for Marketing Assets

```typescript
// Use brand strategy for Canva/Figma generation
const brand = await extractBrandStrategy(projectId);

const canvaRequest = {
  palette: brand.colors.all,
  primaryFont: brand.typography.primary,
  secondaryFont: brand.typography.secondary,
  mood: brand.mood,
};
```

## Performance

- **Extraction time**: 50-200ms (database query + parsing)
- **Memory usage**: Minimal (<1MB)
- **Caching**: Not cached (cheap operation, always fresh)
- **Impact on v0 generation**: +0-1 second

## Future Enhancements

1. **Structured Storage**
   - Store brand strategy in dedicated `BrandStrategy` table
   - JSON schema for colors, fonts, mood
   - Versioning for brand updates

2. **Visual Attachments**
   - Include logo URLs in v0 attachments
   - Pass design mockups to v0
   - Reference color swatches

3. **Advanced Parsing**
   - Extract RGB, HSL, named colors
   - Parse font weights and styles
   - Extract spacing/sizing guidelines

4. **Brand Validation**
   - Verify extracted colors are accessible (WCAG)
   - Check font availability on web
   - Validate hex code format

## Resources

- **Code**: `lib/services/brand-strategy-extractor.ts`
- **Integration**: `lib/agents/biab-orchestrator-agent.ts` (line 508)
- **Database**: `PromptExecution.output` field
- **Prompt**: `visual_identity_05` in `prisma/seed-biab-prompts.ts`

---

**Questions?** See `V0_INTEGRATION_GUIDE.md` or contact support.
