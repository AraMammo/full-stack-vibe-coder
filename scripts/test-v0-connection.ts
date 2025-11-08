/**
 * Test v0 API Connection
 * Verifies v0 API key and creates a simple test chat
 */

import { config } from 'dotenv';
config();

import { generateV0App, getV0Chat } from '../lib/services/v0-client';

async function testV0Connection() {
  console.log('🧪 Testing v0 API Connection\n');
  console.log('=' .repeat(60));

  const apiKey = process.env.V0_API_KEY;

  console.log('Environment:');
  console.log(`  V0_API_KEY: ${apiKey ? '✅ Set (' + apiKey.substring(0, 10) + '...)' : '❌ Not set'}`);

  if (!apiKey) {
    console.error('\n❌ V0_API_KEY environment variable not set!');
    console.log('\nSet it with:');
    console.log('  export V0_API_KEY=your_api_key');
    process.exit(1);
  }

  try {
    console.log('\n📝 Creating test chat...');
    console.log('   Prompt: "Create a simple Next.js page with a centered h1 that says Hello World"');
    console.log('   Model: v0-1.5-lg');
    console.log('   Privacy: private\n');

    const startTime = Date.now();

    const result = await generateV0App({
      prompt: 'Create a simple Next.js page with a centered h1 that says "Hello World" using Tailwind CSS',
      chatPrivacy: 'private',
      waitForCompletion: false, // Don't wait for completion, just test creation
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`⏱️  Response time: ${duration}s`);

    if (!result.success) {
      console.log('\n' + '='.repeat(60));
      console.log('❌ TEST FAILED');
      console.log('='.repeat(60));
      console.error('\nError:', result.error);

      if (result.error?.includes('401') || result.error?.includes('403')) {
        console.log('\n🔍 DIAGNOSIS: Authentication error');
        console.log('   Your API key may be invalid or expired.');
        console.log('\n🛠️  NEXT STEPS:');
        console.log('   1. Check the API key in Replit Secrets');
        console.log('   2. Verify it matches your v0.dev account');
        console.log('   3. Try generating a new API key');
      }

      console.log('\n');
      process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST PASSED!');
    console.log('='.repeat(60));
    console.log(`\n  Chat ID: ${result.chatId}`);
    console.log(`  Web URL: ${result.webUrl}`);
    console.log(`  Status: ${result.metadata?.status || 'unknown'}`);

    if (result.demoUrl) {
      console.log(`  Demo URL: ${result.demoUrl}`);
    }

    console.log('\n✅ v0 API is working correctly!');
    console.log('\n💡 Next step: Visit the Web URL to see your generated app');
    console.log(`   ${result.webUrl}`);
    console.log('\n');

  } catch (error: any) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(60));
    console.error('\nError:', error.message);
    console.log('\n');
    process.exit(1);
  }
}

// Run test
testV0Connection();
