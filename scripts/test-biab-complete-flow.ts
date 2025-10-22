// scripts/test-biab-complete-flow.ts
import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma';
import { BIABOrchestratorAgent } from '../lib/agents/biab-orchestrator-agent';
import { packageBIABDeliverables } from '../lib/delivery/package-biab-deliverables';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
  console.log(`${icons[type]} ${message}`);
}

function addResult(name: string, passed: boolean, error?: string, duration?: number) {
  results.push({ name, passed, error, duration });
  if (passed) {
    log(`${name}: PASSED${duration ? ` (${duration}ms)` : ''}`, 'success');
  } else {
    log(`${name}: FAILED - ${error}`, 'error');
  }
}

async function testEnvironmentVariables() {
  log('\n📋 Testing Environment Variables...');
  const startTime = Date.now();
  
  const required = [
    'DATABASE_URL',
    'ANTHROPIC_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'POSTMARK_API_KEY',
    'DUMPLING_API',
    'GITHUB_PAT',
    'VERCEL_TOKEN'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    addResult('Environment Variables', false, `Missing: ${missing.join(', ')}`, Date.now() - startTime);
    return false;
  }
  
  addResult('Environment Variables', true, undefined, Date.now() - startTime);
  return true;
}

async function testDatabaseConnection() {
  log('\n📋 Testing Database Connection...');
  const startTime = Date.now();
  
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    addResult('Database Connection', true, undefined, Date.now() - startTime);
    return true;
  } catch (error: any) {
    addResult('Database Connection', false, error.message, Date.now() - startTime);
    return false;
  }
}

async function testPromptTemplatesSeeded() {
  log('\n📋 Testing Prompt Templates...');
  const startTime = Date.now();
  
  try {
    const prompts = await prisma.promptTemplate.findMany();
    
    if (prompts.length !== 16) {
      addResult('Prompt Templates Seeded', false, `Expected 16 prompts, found ${prompts.length}`, Date.now() - startTime);
      return false;
    }
    
    // Check tier assignments
    const validationPrompts = prompts.filter(p => 
      p.includedInTiers.includes('VALIDATION_PACK')
    );
    
    const launchPrompts = prompts.filter(p => 
      p.includedInTiers.includes('LAUNCH_BLUEPRINT')
    );
    
    const turnkeyPrompts = prompts.filter(p => 
      p.includedInTiers.includes('TURNKEY_SYSTEM')
    );
    
    if (validationPrompts.length !== 5) {
      addResult('Prompt Templates Seeded', false, `Expected 5 VALIDATION prompts, found ${validationPrompts.length}`, Date.now() - startTime);
      return false;
    }
    
    if (launchPrompts.length !== 16) {
      addResult('Prompt Templates Seeded', false, `Expected 16 LAUNCH prompts, found ${launchPrompts.length}`, Date.now() - startTime);
      return false;
    }
    
    if (turnkeyPrompts.length !== 16) {
      addResult('Prompt Templates Seeded', false, `Expected 16 TURNKEY prompts, found ${turnkeyPrompts.length}`, Date.now() - startTime);
      return false;
    }
    
    addResult('Prompt Templates Seeded', true, undefined, Date.now() - startTime);
    return true;
  } catch (error: any) {
    addResult('Prompt Templates Seeded', false, error.message, Date.now() - startTime);
    return false;
  }
}

async function testValidationTierExecution() {
  log('\n📋 Testing VALIDATION_PACK Tier Execution...');
  const startTime = Date.now();
  
  const projectId = `test-validation-${Date.now()}`;
  const userId = 'test-user-validation';
  
  try {
    const orchestrator = new BIABOrchestratorAgent();
    
    const result = await orchestrator.execute({
      projectId,
      userId,
      businessConcept: 'A mobile app for tracking daily water intake with reminders and health insights.',
      tier: 'VALIDATION_PACK'
    });
    
    // Should execute exactly 5 prompts
    const executions = await prisma.promptExecution.findMany({
      where: { projectId }
    });
    
    if (executions.length !== 5) {
      addResult('VALIDATION Tier Execution', false, `Expected 5 executions, got ${executions.length}`, Date.now() - startTime);
      return false;
    }
    
    // Check all completed successfully
    const failed = executions.filter(e => e.status === 'FAILED');
    if (failed.length > 0) {
      addResult('VALIDATION Tier Execution', false, `${failed.length} prompts failed`, Date.now() - startTime);
      return false;
    }
    
    addResult('VALIDATION Tier Execution', true, undefined, Date.now() - startTime);
    return true;
  } catch (error: any) {
    addResult('VALIDATION Tier Execution', false, error.message, Date.now() - startTime);
    return false;
  } finally {
    // Cleanup
    await prisma.promptExecution.deleteMany({ where: { projectId } });
  }
}

async function testLaunchBlueprintTierExecution() {
  log('\n📋 Testing LAUNCH_BLUEPRINT Tier Execution...');
  const startTime = Date.now();

  const projectId = `test-launch-${Date.now()}`;
  const userId = 'test-user-launch';

  try {
    const orchestrator = new BIABOrchestratorAgent();

    const result = await orchestrator.execute({
      projectId,
      userId,
      businessConcept: 'A SaaS platform for freelancers to track time and generate invoices automatically.',
      tier: 'LAUNCH_BLUEPRINT'
    });

    // Should execute all 16 prompts
    const executions = await prisma.promptExecution.findMany({
      where: { projectId },
      include: { prompt: true }
    });

    if (executions.length !== 16) {
      addResult('LAUNCH_BLUEPRINT Tier Execution', false, `Expected 16 executions, got ${executions.length}`, Date.now() - startTime);
      return false;
    }

    // Check all completed successfully
    const failed = executions.filter(e => e.status === 'FAILED');
    if (failed.length > 0) {
      addResult('LAUNCH_BLUEPRINT Tier Execution', false, `${failed.length} prompts failed`, Date.now() - startTime);
      return false;
    }

    // Check if logos were generated
    const visualIdentityExecution = executions.find(e => e.prompt.promptId === 'visual_identity_05');
    if (!visualIdentityExecution) {
      addResult('LAUNCH_BLUEPRINT Tier Execution', false, 'visual_identity_05 execution not found', Date.now() - startTime);
      return false;
    }

    // Check for logo section in output
    const hasLogoSection = visualIdentityExecution.output.includes('## Generated Logo Files') ||
                          visualIdentityExecution.output.includes('Logo Variation');

    if (!hasLogoSection) {
      addResult('LAUNCH_BLUEPRINT Tier Execution', false, 'Logo generation section not found in output', Date.now() - startTime);
      return false;
    }

    // Count logo URLs
    const logoMatches = visualIdentityExecution.output.match(/Logo Variation \d+/g);
    const logoCount = logoMatches ? logoMatches.length : 0;

    if (logoCount < 3) {
      addResult('LAUNCH_BLUEPRINT Tier Execution', false, `Expected at least 3 logos, found ${logoCount}`, Date.now() - startTime);
      return false;
    }

    addResult('LAUNCH_BLUEPRINT Tier Execution', true, `All 16 prompts completed, ${logoCount} logos generated`, Date.now() - startTime);
    return true;
  } catch (error: any) {
    addResult('LAUNCH_BLUEPRINT Tier Execution', false, error.message, Date.now() - startTime);
    return false;
  } finally {
    // Cleanup
    await prisma.promptExecution.deleteMany({ where: { projectId } });
  }
}

async function testPackageDelivery() {
  log('\n📋 Testing Package Delivery...');
  const startTime = Date.now();
  
  const projectId = `test-package-${Date.now()}`;
  const userId = 'test-user-package';
  
  try {
    // Create test project with executions
    const orchestrator = new BIABOrchestratorAgent();
    
    await orchestrator.execute({
      projectId,
      userId,
      businessConcept: 'A marketplace for local artisans to sell handmade goods online.',
      tier: 'LAUNCH_BLUEPRINT'
    });
    
    // Package deliverables
    const deliveryPackage = await packageBIABDeliverables(projectId, userId, {
      tier: 'LAUNCH_BLUEPRINT',
      projectName: 'Test Marketplace'
    });
    
    if (!deliveryPackage) {
      addResult('Package Delivery', false, 'Package creation failed', Date.now() - startTime);
      return false;
    }
    
    // Verify package has download URL
    if (!deliveryPackage.downloadUrl) {
      addResult('Package Delivery', false, 'No download URL generated', Date.now() - startTime);
      return false;
    }
    
    // Verify file size is reasonable (should be > 1KB)
    if (deliveryPackage.fileSize < 1000) {
      addResult('Package Delivery', false, `File size too small: ${deliveryPackage.fileSize} bytes`, Date.now() - startTime);
      return false;
    }
    
    addResult('Package Delivery', true, undefined, Date.now() - startTime);
    return true;
  } catch (error: any) {
    addResult('Package Delivery', false, error.message, Date.now() - startTime);
    return false;
  } finally {
    // Cleanup
    await prisma.deliveryPackage.deleteMany({ where: { projectId } });
    await prisma.promptExecution.deleteMany({ where: { projectId } });
  }
}

async function testSSEEndpoint() {
  log('\n📋 Testing SSE Endpoint...');
  const startTime = Date.now();

  const projectId = `test-sse-${Date.now()}`;

  try {
    // Get actual prompt IDs from database
    const prompts = await prisma.promptTemplate.findMany({
      where: {
        promptId: {
          in: ['business_model_01', 'competitive_analysis_02']
        }
      }
    });

    if (prompts.length < 2) {
      addResult('SSE Endpoint Data Structure', false, 'Required prompts not found in database', Date.now() - startTime);
      return false;
    }

    // Create test project with some executions
    await prisma.promptExecution.createMany({
      data: [
        {
          projectId,
          promptId: prompts[0].id,
          input: 'Test input',
          output: 'Test output',
          status: 'COMPLETED',
          tokensUsed: 1000,
          executionTimeMs: 1000,
          executedAt: new Date()
        },
        {
          projectId,
          promptId: prompts[1].id,
          input: 'Test input',
          output: 'Test output',
          status: 'IN_PROGRESS',
          tokensUsed: 500,
          executionTimeMs: 500,
          executedAt: new Date()
        }
      ]
    });
    
    // Test SSE endpoint (would need server running)
    // For now, just verify the data structure is queryable
    const executions = await prisma.promptExecution.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    });
    
    const completed = executions.filter(e => e.status === 'COMPLETED');
    const inProgress = executions.find(e => e.status === 'IN_PROGRESS');
    
    if (completed.length !== 1 || !inProgress) {
      addResult('SSE Endpoint Data Structure', false, 'Execution status query failed', Date.now() - startTime);
      return false;
    }
    
    addResult('SSE Endpoint Data Structure', true, 'Data structure valid (endpoint requires running server to test)', Date.now() - startTime);
    return true;
  } catch (error: any) {
    addResult('SSE Endpoint Data Structure', false, error.message, Date.now() - startTime);
    return false;
  } finally {
    // Cleanup
    await prisma.promptExecution.deleteMany({ where: { projectId } });
  }
}

async function testPostmarkEmailConfig() {
  log('\n📋 Testing Postmark Configuration...');
  const startTime = Date.now();

  try {
    if (!process.env.POSTMARK_API_KEY) {
      addResult('Postmark Configuration', false, 'POSTMARK_API_KEY not set', Date.now() - startTime);
      return false;
    }

    // Test Postmark API key validity (without sending email)
    const response = await fetch('https://api.postmarkapp.com/server', {
      headers: {
        'Accept': 'application/json',
        'X-Postmark-Server-Token': process.env.POSTMARK_API_KEY
      }
    });

    if (!response.ok) {
      addResult('Postmark Configuration', false, `API returned ${response.status}`, Date.now() - startTime);
      return false;
    }

    addResult('Postmark Configuration', true, undefined, Date.now() - startTime);
    return true;
  } catch (error: any) {
    addResult('Postmark Configuration', false, error.message, Date.now() - startTime);
    return false;
  }
}

async function testDumplingAPI() {
  log('\n📋 Testing Dumpling API Connection...');
  const startTime = Date.now();

  try {
    const { testDumplingConnection } = await import('../lib/services/dumpling-client');
    const success = await testDumplingConnection();

    if (!success) {
      addResult('Dumpling API Connection', false, 'API test failed', Date.now() - startTime);
      return false;
    }

    addResult('Dumpling API Connection', true, undefined, Date.now() - startTime);
    return true;
  } catch (error: any) {
    addResult('Dumpling API Connection', false, error.message, Date.now() - startTime);
    return false;
  }
}

async function testSupabaseStorageBucket() {
  log('\n📋 Testing Supabase Storage Bucket...');
  const startTime = Date.now();
  
  try {
    const { supabaseAdmin } = await import('../lib/storage');
    
    // Check if biab-deliverables bucket exists
    const { data, error } = await supabaseAdmin.storage.getBucket('biab-deliverables');
    
    if (error || !data) {
      addResult('Supabase Storage Bucket', false, 'biab-deliverables bucket not found', Date.now() - startTime);
      return false;
    }
    
    addResult('Supabase Storage Bucket', true, undefined, Date.now() - startTime);
    return true;
  } catch (error: any) {
    addResult('Supabase Storage Bucket', false, error.message, Date.now() - startTime);
    return false;
  }
}

async function generateReport() {
  log('\n\n═══════════════════════════════════════════');
  log('📊 TEST REPORT', 'info');
  log('═══════════════════════════════════════════\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const passRate = Math.round((passed / total) * 100);
  
  log(`Total Tests: ${total}`);
  log(`Passed: ${passed}`, 'success');
  log(`Failed: ${failed}`, failed > 0 ? 'error' : 'success');
  log(`Pass Rate: ${passRate}%\n`, passRate === 100 ? 'success' : 'warn');
  
  if (failed > 0) {
    log('❌ FAILED TESTS:', 'error');
    results.filter(r => !r.passed).forEach(r => {
      log(`  • ${r.name}: ${r.error}`);
    });
  } else {
    log('🎉 ALL TESTS PASSED!', 'success');
  }
  
  log('\n═══════════════════════════════════════════\n');
  
  // Summary recommendations
  if (failed > 0) {
    log('🔧 RECOMMENDATIONS:', 'warn');
    
    if (results.find(r => r.name === 'Environment Variables' && !r.passed)) {
      log('  1. Check your .env file has all required variables');
    }
    
    if (results.find(r => r.name === 'Database Connection' && !r.passed)) {
      log('  2. Verify DATABASE_URL is correct and database is accessible');
    }
    
    if (results.find(r => r.name === 'Prompt Templates Seeded' && !r.passed)) {
      log('  3. Run: npx tsx prisma/seed-biab-prompts.ts');
    }
    
    if (results.find(r => r.name.includes('Tier Execution') && !r.passed)) {
      log('  4. Check ANTHROPIC_API_KEY is valid and has credits');
    }
    
    if (results.find(r => r.name === 'Supabase Storage Bucket' && !r.passed)) {
      log('  5. Create biab-deliverables bucket in Supabase dashboard');
    }
    
    log('');
  }
}

async function runAllTests() {
  log('🚀 Starting BIAB Complete Flow Test Suite...\n');
  log('This will test the entire system from database to delivery.\n');
  
  const startTime = Date.now();
  
  // Run tests sequentially
  const envOk = await testEnvironmentVariables();
  if (!envOk) {
    log('\n⚠️  Skipping remaining tests due to missing environment variables', 'warn');
    await generateReport();
    process.exit(1);
  }
  
  const dbOk = await testDatabaseConnection();
  if (!dbOk) {
    log('\n⚠️  Skipping remaining tests due to database connection failure', 'warn');
    await generateReport();
    process.exit(1);
  }
  
  await testPromptTemplatesSeeded();
  await testSupabaseStorageBucket();
  await testPostmarkEmailConfig();
  await testDumplingAPI();

  // These tests actually execute the orchestrator (will consume API credits)
  log('\n⚠️  The following tests will consume Anthropic and Dumpling API credits...', 'warn');
  await testValidationTierExecution();
  await testLaunchBlueprintTierExecution();
  await testPackageDelivery();
  
  // SSE endpoint test (requires running server)
  await testSSEEndpoint();
  
  const totalTime = Date.now() - startTime;
  log(`\n⏱️  Total test time: ${Math.round(totalTime / 1000)}s`);
  
  await generateReport();
  
  // Exit with error code if any tests failed
  const failed = results.filter(r => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests()
  .catch((error) => {
    log(`\n❌ Test suite crashed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
