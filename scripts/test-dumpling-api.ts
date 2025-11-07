/**
 * Quick test of Dumpling API
 * Tests logo generation in isolation
 */

import { generateLogos } from '../lib/services/dumpling-client';

async function testDumplingAPI() {
  console.log('🧪 Testing Dumpling API...\n');
  console.log('=' .repeat(60));

  try {
    console.log('Environment:');
    console.log(`  DUMPLING_API: ${process.env.DUMPLING_API ? '✅ Set' : '❌ Not set'}`);

    if (!process.env.DUMPLING_API) {
      console.error('\n❌ DUMPLING_API environment variable not set!');
      console.log('\nSet it with:');
      console.log('  export DUMPLING_API=your_api_key');
      process.exit(1);
    }

    console.log('\n📝 Generating test logo with simple prompt...');
    console.log('   Prompt: "minimalist tech logo with blue gradient"');
    console.log('   Count: 1 logo\n');

    const startTime = Date.now();

    const logoUrls = await generateLogos(
      'minimalist tech logo with blue gradient',
      1 // Just generate 1 logo for testing
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST PASSED!');
    console.log('='.repeat(60));
    console.log(`\n  Time: ${duration} seconds`);
    console.log(`  Logos generated: ${logoUrls.length}`);
    console.log(`\n  Logo URLs:`);
    logoUrls.forEach((url, i) => {
      console.log(`    ${i + 1}. ${url}`);
    });

    console.log('\n✅ Dumpling API is working correctly!\n');

  } catch (error: any) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(60));
    console.error('\nError:', error.message);

    if (error.message.includes('No image URL')) {
      console.log('\n🔍 DIAGNOSIS:');
      console.log('   The API responded, but the response format is unexpected.');
      console.log('   Check the debug logs above to see what Dumpling returned.');
      console.log('\n💡 POSSIBLE CAUSES:');
      console.log('   1. Dumpling API format changed');
      console.log('   2. API key has wrong permissions');
      console.log('   3. Model name is incorrect');
      console.log('\n🛠️  NEXT STEPS:');
      console.log('   1. Check Dumpling API documentation');
      console.log('   2. Verify API key permissions in Replit Secrets');
      console.log('   3. Consider switching to Replicate API');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n🔍 DIAGNOSIS:');
      console.log('   Authentication error - API key is invalid or expired.');
      console.log('\n🛠️  NEXT STEPS:');
      console.log('   1. Check DUMPLING_API in Replit Secrets');
      console.log('   2. Verify the API key is correct');
      console.log('   3. Check if the key has expired');
    } else {
      console.log('\n🔍 Check the error message above for details.');
    }

    console.log('\n');
    process.exit(1);
  }
}

// Run test
testDumplingAPI();
