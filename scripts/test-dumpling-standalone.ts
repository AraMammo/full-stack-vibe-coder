/**
 * Standalone Dumpling API Test
 * No dependencies - just raw fetch
 */

// Load environment variables from .env file
import { config } from 'dotenv';
config();

async function testDumplingAPI() {
  console.log('🧪 Testing Dumpling API (Standalone)\n');
  console.log('=' .repeat(60));

  const apiKey = process.env.DUMPLING_API;

  console.log('Environment:');
  console.log(`  DUMPLING_API: ${apiKey ? '✅ Set (' + apiKey.substring(0, 10) + '...)' : '❌ Not set'}`);

  if (!apiKey) {
    console.error('\n❌ DUMPLING_API environment variable not set!');
    process.exit(1);
  }

  try {
    console.log('\n📝 Making API request...');
    console.log('   Endpoint: https://app.dumplingai.com/api/v1/generate-ai-image');
    console.log('   Model: FLUX.1-schnell');
    console.log('   Prompt: "minimalist tech logo with blue gradient"\n');

    const startTime = Date.now();

    const response = await fetch('https://app.dumplingai.com/api/v1/generate-ai-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'FLUX.1-schnell',
        input: {
          prompt: 'minimalist tech logo with blue gradient',
          aspect_ratio: '1:1',
          output_format: 'png',
          output_quality: 95,
          num_outputs: 1,
          seed: Date.now(),
          disable_safety_checker: false
        },
        permanent: true,
        requestSource: 'API'
      })
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`⏱️  Response time: ${duration}s`);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ API Error Response:');
      console.error(errorText);
      throw new Error(`Dumpling API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('\n📦 Full API Response:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n🔍 Response Analysis:');
    console.log(`   Has 'output' field: ${data.output ? '✅ Yes' : '❌ No'}`);
    console.log(`   Output is array: ${Array.isArray(data.output) ? '✅ Yes' : '❌ No'}`);
    console.log(`   Output length: ${data.output?.length || 0}`);
    console.log(`   First output value: ${data.output?.[0] || 'N/A'}`);

    if (data.output && data.output[0]) {
      console.log('\n' + '='.repeat(60));
      console.log('✅ TEST PASSED!');
      console.log('='.repeat(60));
      console.log(`\n  Image URL: ${data.output[0]}`);
      console.log('\n✅ Dumpling API is working correctly!\n');
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('⚠️  TEST PARTIALLY PASSED');
      console.log('='.repeat(60));
      console.log('\nAPI responded successfully, but:');
      console.log('  ❌ No image URL found in response.output[0]');
      console.log('\n🔍 DIAGNOSIS:');
      console.log('   The API response format is different than expected.');
      console.log('   Expected: { output: ["https://url-to-image.png"] }');
      console.log('   Got: See full response above');
      console.log('\n💡 SOLUTIONS:');
      console.log('   1. Update the code to match Dumpling\'s actual response format');
      console.log('   2. Contact Dumpling support about API format');
      console.log('   3. Switch to Replicate API (more reliable)');
      console.log('\n');
    }

  } catch (error: any) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(60));
    console.error('\nError:', error.message);

    if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n🔍 DIAGNOSIS: Authentication error');
      console.log('   Your API key may be invalid or expired.');
      console.log('\n🛠️  NEXT STEPS:');
      console.log('   1. Check the API key in Replit Secrets');
      console.log('   2. Verify it matches your Dumpling account');
      console.log('   3. Try generating a new API key');
    } else if (error.message.includes('fetch')) {
      console.log('\n🔍 DIAGNOSIS: Network error');
      console.log('   Could not connect to Dumpling API.');
      console.log('\n🛠️  NEXT STEPS:');
      console.log('   1. Check internet connection');
      console.log('   2. Verify Dumpling API is online');
    }

    console.log('\n');
    process.exit(1);
  }
}

// Run test
testDumplingAPI();
