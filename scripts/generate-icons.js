#!/usr/bin/env node

/**
 * Generate PNG icons from favicon SVG
 *
 * Creates android-chrome-192x192.png and android-chrome-512x512.png
 * from the favicon.svg for PWA manifest support.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/favicon.svg');
const publicDir = path.join(__dirname, '../public');

const sizes = [
  { size: 192, filename: 'android-chrome-192x192.png' },
  { size: 512, filename: 'android-chrome-512x512.png' }
];

async function generateIcons() {
  try {
    console.log('🎨 Generating PNG icons from favicon.svg...\n');

    // Read SVG file
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate each icon size
    for (const { size, filename } of sizes) {
      const outputPath = path.join(publicDir, filename);

      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);

      console.log(`✅ Created ${filename} (${size}x${size})`);
      console.log(`   File size: ${fileSizeKB} KB\n`);
    }

    console.log('🎉 All icons generated successfully!');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
