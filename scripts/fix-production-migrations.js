#!/usr/bin/env node

/**
 * Fix production migration issues by marking migrations as already applied
 * This resolves the conflict where tables already exist in production
 * but Prisma doesn't know the migrations were applied
 */

const { execSync } = require('child_process');

console.log('🔧 Fixing production migration issues...\n');

// Check if we're in production environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

if (!isProduction) {
  console.log('⚠️  This script should only be run in production environment');
  console.log('Set NODE_ENV=production to run this script\n');
  process.exit(1);
}

try {
  // Step 1: Mark all existing migrations as applied
  console.log('1️⃣  Marking existing migrations as applied in production...');
  
  // Mark the baseline migration as applied
  execSync('npx prisma migrate resolve --applied "20251021121929_baseline_existing_tables"', { 
    stdio: 'inherit' 
  });
  
  // Mark the prompt_templates migration as applied
  execSync('npx prisma migrate resolve --applied "20251021122500_add_prompt_templates"', { 
    stdio: 'inherit' 
  });
  
  console.log('✅ Migrations marked as applied\n');
  
  // Step 2: Verify migration status
  console.log('2️⃣  Verifying migration status...');
  execSync('npx prisma migrate status', { stdio: 'inherit' });
  
  console.log('\n✅ Production migrations fixed successfully!');
  console.log('You can now deploy without migration conflicts.\n');
  
} catch (error) {
  console.error('❌ Error fixing migrations:', error.message);
  process.exit(1);
}