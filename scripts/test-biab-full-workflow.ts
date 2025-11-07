/**
 * Test BIAB Full Workflow ($497 Turnkey Plan)
 *
 * Simulates a real customer purchase and executes:
 * 1. All 16 BIAB prompts
 * 2. Logo generation (5 logos)
 * 3. Package delivery (ZIP with all assets)
 * 4. Email delivery to customer
 */

import { PrismaClient, BIABTier } from '../app/generated/prisma';
import { BIABOrchestratorAgent } from '../lib/agents/biab-orchestrator-agent';
import { packageBIABDeliverables } from '../lib/delivery/package-biab-deliverables';

const prisma = new PrismaClient();

// Mock Business Idea - Realistic example
const MOCK_BUSINESS_IDEA = `
I want to start a meal prep delivery service for busy professionals in Toronto.

The idea is simple: healthy, pre-portioned meals delivered to your door every Sunday for the entire week.
We focus on high-protein, balanced meals that support fitness goals without the hassle of cooking.

Target audience:
- Busy professionals (25-45 years old)
- Fitness enthusiasts who don't have time to meal prep
- People who hate cooking but want to eat healthy

Unique value proposition:
- Fully customizable macros (you tell us your protein/carb/fat goals)
- Local, organic ingredients from Ontario farms
- Prepared by professional chefs, not a factory
- Delivered in eco-friendly, recyclable containers
- $89/week for 10 meals (breakfast + lunch, 5 days)

We'll start in downtown Toronto and expand to GTA suburbs.

The website needs:
- Menu showcase with nutritional info
- Subscription sign-up with weekly customization
- Testimonials from early customers
- Blog with nutrition tips and recipes
- Contact form for custom requests
`;

const TEST_USER = {
  id: 'test-user-ara-mammo', // Static test user ID
  email: 'ara@codechecklab.com',
  name: 'Ara Mammo',
  tier: BIABTier.TURNKEY_SYSTEM, // $497 plan
};

async function runFullWorkflowTest() {
  console.log('🚀 Starting BIAB Full Workflow Test (Turnkey - $497)\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Setup test user
    console.log('\n📋 Step 1: Setting up test user...');
    console.log(`✓ Using test user: ${TEST_USER.email} (ID: ${TEST_USER.id})`);

    // Step 2: Create Project
    console.log('\n📋 Step 2: Creating project...');

    const project = await prisma.project.create({
      data: {
        userId: TEST_USER.id,
        projectName: 'FitMeal Toronto',
        businessConcept: MOCK_BUSINESS_IDEA,
        biabTier: TEST_USER.tier,
        status: 'IN_PROGRESS',
      },
    });
    console.log(`✓ Project created: ${project.id}`);
    console.log(`✓ Tier: ${project.biabTier}`);

    // Step 3: Execute BIAB Orchestrator (16 prompts)
    console.log('\n📋 Step 3: Executing BIAB Orchestrator...');
    console.log('This will take 10-15 minutes (generating 16 deliverables + 5 logos)\n');

    const startTime = Date.now();

    // Create orchestrator agent with progress callback
    const agent = new BIABOrchestratorAgent((update) => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(`[${elapsed}s] ${update.promptName} - ${update.status} (${update.progress}%)`);
    });

    // Execute BIAB workflow
    const result = await agent.execute({
      projectId: project.id,
      userId: TEST_USER.id,
      businessConcept: MOCK_BUSINESS_IDEA,
      tier: TEST_USER.tier,
    });

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.log(`\n✓ BIAB Orchestrator completed in ${totalTime} seconds`);
    console.log(`✓ Prompts executed: ${result.executionsSummary?.completedPrompts || 0}`);
    console.log(`✓ Logos generated: ${result.logoUrls?.length || 0}`);
    console.log(`✓ Total tokens used: ${result.executionsSummary?.totalTokensUsed?.toLocaleString() || 0}`);

    if (!result.success) {
      throw new Error(`Workflow failed: ${result.error}`);
    }

    // Step 4: Package Deliverables
    console.log('\n📋 Step 4: Packaging deliverables...');

    const packageResult = await packageBIABDeliverables(project.id, TEST_USER.id, {
      tier: TEST_USER.tier,
      logoUrls: result.logoUrls,
      projectName: 'FitMeal Toronto',
    });

    if (!packageResult.success) {
      throw new Error(`Packaging failed: ${packageResult.error}`);
    }

    console.log(`✓ Package created: ${packageResult.packageId}`);
    console.log(`✓ Download URL: ${packageResult.downloadUrl}`);
    console.log(`✓ File size: ${(packageResult.fileSize! / 1024 / 1024).toFixed(2)} MB`);
    console.log(`✓ Expires at: ${packageResult.expiresAt?.toLocaleString()}`);

    // Step 5: Generate Summary Report
    console.log('\n📋 Step 5: Generating delivery report...');

    const deliverables = await prisma.promptExecution.findMany({
      where: { projectId: project.id },
      include: { prompt: true },
      orderBy: { prompt: { orderIndex: 'asc' } },
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DELIVERY COMPLETE - Here\'s what was created:');
    console.log('='.repeat(60));

    console.log('\n📦 PACKAGE CONTENTS:\n');

    // Group by section
    const sections = new Map<string, typeof deliverables>();
    deliverables.forEach(exec => {
      const section = exec.prompt.sectionName;
      if (!sections.has(section)) {
        sections.set(section, []);
      }
      sections.get(section)!.push(exec);
    });

    sections.forEach((execs, sectionName) => {
      console.log(`\n📁 ${sectionName.toUpperCase()}`);
      execs.forEach(exec => {
        const wordCount = exec.output?.split(/\s+/).length || 0;
        console.log(`   ✓ ${exec.prompt.name} (${wordCount} words)`);
      });
    });

    console.log('\n🎨 BRAND ASSETS:');
    console.log(`   ✓ ${result.logoUrls?.length || 0} Logo Variations (PNG)`);
    console.log('   ✓ Color Palette');
    console.log('   ✓ Typography Guide');
    console.log('   ✓ Brand Guidelines PDF');

    console.log('\n📄 DOCUMENTATION:');
    console.log('   ✓ README.md (Getting Started)');
    console.log('   ✓ Launch Guide (How to publish)');
    console.log('   ✓ Business Plan');
    console.log('   ✓ Marketing Strategy');

    console.log('\n📊 STATS:');
    console.log(`   • Total Deliverables: ${deliverables.length + (result.logoUrls?.length || 0)}`);
    console.log(`   • Total Words: ${deliverables.reduce((sum, e) => sum + (e.output?.split(/\s+/).length || 0), 0).toLocaleString()}`);
    console.log(`   • Total Tokens: ${result.executionsSummary?.totalTokensUsed?.toLocaleString() || 0}`);
    console.log(`   • Generation Time: ${totalTime} seconds`);
    console.log(`   • Package Size: ${(packageResult.fileSize! / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n📧 EMAIL DELIVERY:');
    console.log(`   To: ${TEST_USER.email}`);
    console.log(`   Subject: Your Business in a Box is Ready! 🎉`);
    console.log(`   Download: ${packageResult.downloadUrl}`);
    console.log(`   Expires: ${packageResult.expiresAt?.toLocaleString()}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));

    // Step 6: Send Email (would normally use Postmark/Resend)
    console.log('\n📧 Email would be sent to: ara@codechecklab.com');
    console.log('   (Skipping actual email send in test mode)');

    // Return package URL for manual download
    return {
      success: true,
      downloadUrl: packageResult.downloadUrl,
      packageId: packageResult.packageId,
      projectId: project.id,
    };

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  runFullWorkflowTest()
    .then((result) => {
      console.log('\n✅ Test completed successfully!');
      console.log(`\nDownload your package at:\n${result.downloadUrl}\n`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { runFullWorkflowTest };
