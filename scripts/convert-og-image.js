#!/usr/bin/env node

/**
 * Convert OG image SVG to PNG
 *
 * Converts public/og-image.svg to public/og-image.png
 * at 1200x630 dimensions for optimal social media sharing.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/og-image.svg');
const pngPath = path.join(__dirname, '../public/og-image.png');

async function convertOGImage() {
  try {
    console.log('🎨 Converting OG image from SVG to PNG...');

    // Read SVG file
    const svgBuffer = fs.readFileSync(svgPath);

    // Convert to PNG with specific dimensions
    await sharp(svgBuffer)
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .png({
        quality: 100,
        compressionLevel: 9
      })
      .toFile(pngPath);

    console.log('✅ Successfully created og-image.png (1200x630)');
    console.log(`   Location: ${pngPath}`);

    // Get file size
    const stats = fs.statSync(pngPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    console.log(`   File size: ${fileSizeKB} KB`);

  } catch (error) {
    console.error('❌ Error converting OG image:', error.message);
    process.exit(1);
  }
}

convertOGImage();
