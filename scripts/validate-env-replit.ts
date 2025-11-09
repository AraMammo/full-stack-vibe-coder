/**
 * Validate Environment Variables for Replit Deployment
 *
 * Checks that all critical environment variables are set in Replit Secrets.
 * Run this script in Replit to verify your deployment is properly configured.
 */

import { config } from 'dotenv';
config();

interface EnvCheck {
  name: string;
  required: boolean;
  description: string;
  alternativeNames?: string[];
}

const ENV_CHECKS: EnvCheck[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string (Neon/Supabase)',
  },

  // Authentication
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'NextAuth.js secret for session encryption',
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Application URL for email links and callbacks',
  },

  // Payment
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    description: 'Stripe secret key for payment processing',
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe publishable key (client-side)',
  },

  // AI Services - CRITICAL
  {
    name: 'ANTHROPIC_API_KEY',
    required: true,
    description: '🔴 CRITICAL: Claude API for BIAB workflow (all 16 prompts)',
  },
  {
    name: 'OPENAI_API_KEY',
    required: true,
    description: 'OpenAI API for Whisper transcription',
  },
  {
    name: 'DUMPLING_API',
    required: true,
    description: 'Dumpling AI for logo generation',
  },
  {
    name: 'V0_API_KEY',
    required: true,
    description: 'v0 API for website deployment',
    alternativeNames: ['VERCEL_V0_API_KEY'],
  },

  // Storage
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key (client-side)',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (server-side)',
  },

  // Email
  {
    name: 'SENDGRID_API_KEY',
    required: true,
    description: 'SendGrid API for transactional emails',
  },
  {
    name: 'SENDGRID_FROM_EMAIL',
    required: false,
    description: 'SendGrid from email (defaults to noreply@fullstackvibecoder.com)',
  },

  // Optional
  {
    name: 'VERCEL_API_TOKEN',
    required: false,
    description: 'Vercel API token (optional)',
  },
];

function validateEnvironment() {
  console.log('🔍 Validating Environment Variables for Replit Deployment');
  console.log('='.repeat(70));
  console.log('');

  let hasErrors = false;
  let hasWarnings = false;
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  for (const check of ENV_CHECKS) {
    const isSet = !!process.env[check.name];
    const alternativeSet = check.alternativeNames?.some(alt => !!process.env[alt]);

    let status = '❌';
    let message = '';

    if (isSet) {
      status = '✅';
      message = `Set`;
    } else if (alternativeSet && check.alternativeNames) {
      status = '✅';
      const setAlt = check.alternativeNames.find(alt => !!process.env[alt]);
      message = `Set (using ${setAlt})`;
    } else if (check.required) {
      status = '🔴';
      message = `MISSING - REQUIRED`;
      missingRequired.push(check.name);
      hasErrors = true;
    } else {
      status = '⚠️';
      message = `Not set (optional)`;
      missingOptional.push(check.name);
      hasWarnings = true;
    }

    console.log(`${status} ${check.name}`);
    console.log(`   ${message}`);
    console.log(`   ${check.description}`);

    if (check.alternativeNames) {
      console.log(`   Alternative names: ${check.alternativeNames.join(', ')}`);
    }

    console.log('');
  }

  console.log('='.repeat(70));
  console.log('');

  // Summary
  if (hasErrors) {
    console.log('🔴 CRITICAL ERRORS FOUND');
    console.log('');
    console.log('Missing required environment variables:');
    missingRequired.forEach(name => {
      console.log(`   - ${name}`);
    });
    console.log('');
    console.log('⚠️  Your application will NOT work without these variables!');
    console.log('');
    console.log('📝 To fix:');
    console.log('   1. Go to Replit Secrets (🔒 icon in sidebar)');
    console.log('   2. Add each missing variable');
    console.log('   3. Restart your Replit');
    console.log('');

    // Special handling for ANTHROPIC_API_KEY
    if (missingRequired.includes('ANTHROPIC_API_KEY')) {
      console.log('🔴 ANTHROPIC_API_KEY IS CRITICAL!');
      console.log('   The entire BIAB workflow requires Claude API.');
      console.log('   Without this, all 16 prompts will fail.');
      console.log('   Get your key at: https://console.anthropic.com/settings/keys');
      console.log('');
    }
  } else if (hasWarnings) {
    console.log('⚠️  WARNINGS');
    console.log('');
    console.log('Missing optional environment variables:');
    missingOptional.forEach(name => {
      console.log(`   - ${name}`);
    });
    console.log('');
    console.log('✅ All required variables are set!');
    console.log('   Optional variables will use default values.');
    console.log('');
  } else {
    console.log('✅ ALL ENVIRONMENT VARIABLES CONFIGURED!');
    console.log('');
    console.log('Your Replit deployment is ready for production.');
    console.log('');
  }

  // Return exit code
  return hasErrors ? 1 : 0;
}

// Run validation
const exitCode = validateEnvironment();
process.exit(exitCode);
