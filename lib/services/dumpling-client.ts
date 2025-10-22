// lib/services/dumpling-client.ts
import { supabaseAdmin } from '../storage';

interface DumplingImageResponse {
  id?: string;
  output?: string[];
  status?: string;
  error?: string;
}

/**
 * Generate logos using DumplingAI image generation API
 * @param imagePrompt - Descriptive prompt for logo design
 * @param count - Number of logo variations to generate (default: 5)
 * @returns Array of logo URLs hosted on Supabase Storage
 */
export async function generateLogos(
  imagePrompt: string,
  count: number = 5
): Promise<string[]> {
  const apiKey = process.env.DUMPLING_API;

  if (!apiKey) {
    throw new Error('DUMPLING_API key not configured in environment variables');
  }

  if (!imagePrompt || imagePrompt.length < 20) {
    throw new Error('Invalid image prompt - must be at least 20 characters');
  }

  console.log(`[Dumpling] Generating ${count} logos...`);
  console.log(`[Dumpling] Prompt: ${imagePrompt.substring(0, 100)}...`);

  const logoUrls: string[] = [];
  const errors: string[] = [];

  // Generate logos (can request multiple in one call or separate calls)
  for (let i = 0; i < count; i++) {
    try {
      console.log(`[Dumpling] Generating logo ${i + 1}/${count}...`);

      // Call DumplingAI API with correct format
      const response = await fetch('https://app.dumplingai.com/api/v1/generate-ai-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'FLUX.1-schnell', // Fast model for logo generation
          input: {
            prompt: imagePrompt,
            aspect_ratio: '1:1', // Square for logos
            output_format: 'png',
            output_quality: 95,
            num_outputs: 1,
            seed: Date.now() + i, // Different seed for each variation
            disable_safety_checker: false
          },
          permanent: true, // Request permanent storage
          requestSource: 'API'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(
          `Dumpling API returned ${response.status}: ${errorData.error || response.statusText}`
        );
      }

      const data: DumplingImageResponse = await response.json();

      if (data.error) {
        throw new Error(`Dumpling error: ${data.error}`);
      }

      // Extract image URL from response
      const imageUrl = data.output?.[0];

      if (!imageUrl) {
        throw new Error('No image URL in Dumpling response');
      }

      console.log(`[Dumpling] ✓ Generated image, uploading to storage...`);

      // Upload to Supabase Storage for permanent hosting
      const storageUrl = await uploadLogoToStorage(
        imageUrl,
        `logo-variation-${i + 1}.png`
      );

      logoUrls.push(storageUrl);
      console.log(`[Dumpling] ✓ Logo ${i + 1}/${count} complete`);

      // Delay to avoid rate limits (2 seconds between requests)
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error: any) {
      console.error(`[Dumpling] ✗ Failed to generate logo ${i + 1}:`, error.message);
      errors.push(`Logo ${i + 1}: ${error.message}`);
      // Continue with remaining logos
    }
  }

  if (logoUrls.length === 0) {
    throw new Error(`All logo generation attempts failed:\n${errors.join('\n')}`);
  }

  if (errors.length > 0) {
    console.warn(`[Dumpling] ⚠️  Generated ${logoUrls.length}/${count} logos. Errors:\n${errors.join('\n')}`);
  }

  return logoUrls;
}

/**
 * Download image from Dumpling and upload to Supabase Storage
 */
async function uploadLogoToStorage(
  imageUrl: string,
  filename: string
): Promise<string> {
  try {
    console.log(`[Dumpling] Downloading image from Dumpling...`);
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length === 0) {
      throw new Error('Downloaded image is empty');
    }

    console.log(`[Dumpling] Downloaded ${Math.round(buffer.length / 1024)}KB, uploading to Supabase...`);

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const path = `logos/${timestamp}-${filename}`;

    const { data, error } = await supabaseAdmin.storage
      .from('biab-deliverables')
      .upload(path, buffer, {
        contentType: 'image/png',
        upsert: false,
        cacheControl: '3600'
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('biab-deliverables')
      .getPublicUrl(path);

    if (!urlData.publicUrl) {
      throw new Error('Failed to get public URL from Supabase');
    }

    console.log(`[Dumpling] ✓ Uploaded to storage`);
    return urlData.publicUrl;

  } catch (error: any) {
    throw new Error(`Failed to upload logo to storage: ${error.message}`);
  }
}

/**
 * Test function to verify Dumpling API connectivity
 */
export async function testDumplingConnection(): Promise<boolean> {
  const apiKey = process.env.DUMPLING_API;

  if (!apiKey) {
    console.error('[Dumpling] DUMPLING_API not configured');
    return false;
  }

  try {
    console.log('[Dumpling] Testing API connection...');

    // Test with simple image generation
    const logos = await generateLogos('minimalist tech logo with blue gradient', 1);

    if (logos.length === 1) {
      console.log(`[Dumpling] ✓ Test successful: ${logos[0]}`);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error(`[Dumpling] ✗ Test failed: ${error.message}`);
    return false;
  }
}
