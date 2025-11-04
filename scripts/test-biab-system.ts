// @ts-nocheck
import 'dotenv/config';
/**
 * Test script for BIAB System
 *
 * Tests the complete workflow:
 * 1. Execute BIAB orchestrator
 * 2. Package deliverables
 * 3. Verify download
 */

import { BIABOrchestratorAgent } from '../lib/agents/biab-orchestrator-agent';
import { packageBIABDeliverables } from '../lib/delivery/package-biab-deliverables';

async function testBIABSystem() {
  console.log('🧪 Testing BIAB System\n');

  const testProjectId = `test-project-${Date.now()}`;
  const testUserId = 'test-user-123';
  const testBusinessConcept = `
A mobile app called "TimeTrackr" that helps freelancers and consultants:
- Track billable hours with one-tap timers
- Automatically generate professional invoices
- Integrate with Stripe for payments
- Send automated payment reminders
- Generate tax reports for quarterly filings

Target users: Freelancers, consultants, and small agencies who struggle with manual time tracking and invoicing.
Revenue model: $15/month subscription with 14-day free trial.
`;

  try {
    // ============================================
    // Step 1: Execute BIAB Orchestrator
    // ============================================
    console.log('📋 Step 1: Executing BIAB Orchestrator...\n');
    console.log(`Project ID: ${testProjectId}`);
    console.log(`Business Concept: ${testBusinessConcept.substring(0, 100)}...\n`);

    const orchestrator = new BIABOrchestratorAgent();
    const executionResult = await orchestrator.execute({
      projectId: testProjectId,
      businessConcept: testBusinessConcept,
      userId: testUserId,
    });

    if (!executionResult.success) {
      console.error('❌ Orchestrator execution failed:', executionResult.error);
      return;
    }

    console.log('✅ Orchestrator completed successfully!\n');
    console.log('Summary:');
    console.log(`  - Total prompts: ${executionResult.executionsSummary?.totalPrompts}`);
    console.log(`  - Completed: ${executionResult.executionsSummary?.completedPrompts}`);
    console.log(`  - Total tokens: ${executionResult.executionsSummary?.totalTokensUsed.toLocaleString()}`);
    console.log(`  - Execution time: ${((executionResult.executionsSummary?.totalExecutionTimeMs || 0) / 1000).toFixed(2)}s`);
    console.log(`  - By section:`, executionResult.executionsSummary?.bySection);
    console.log();

    // ============================================
    // Step 2: Get Execution Summary
    // ============================================
    console.log('📊 Step 2: Getting execution summary...\n');

    const summary = await orchestrator.getExecutionSummary(testProjectId);
    console.log('✅ Summary retrieved:');
    console.log(`  - Total executions: ${summary.totalExecutions}`);
    console.log(`  - Total tokens: ${summary.totalTokens.toLocaleString()}`);
    console.log(`  - First execution: ${summary.executions[0]?.promptName || 'N/A'}`);
    console.log(`  - Last execution: ${summary.executions[summary.executions.length - 1]?.promptName || 'N/A'}`);
    console.log();

    // ============================================
    // Step 3: Package Deliverables
    // ============================================
    console.log('📦 Step 3: Packaging deliverables...\n');

    const packageResult = await packageBIABDeliverables(testProjectId, testUserId);

    if (!packageResult.success) {
      console.error('❌ Packaging failed:', packageResult.error);
      return;
    }

    console.log('✅ Package created successfully!\n');
    console.log('Package Details:');
    console.log(`  - Package ID: ${packageResult.packageId}`);
    console.log(`  - File size: ${((packageResult.fileSize || 0) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - Expires: ${packageResult.expiresAt?.toISOString()}`);
    console.log(`  - Download URL: ${packageResult.downloadUrl?.substring(0, 80)}...`);
    console.log();

    // ============================================
    // Final Summary
    // ============================================
    console.log('🎉 BIAB System Test Complete!\n');
    console.log('Next steps:');
    console.log(`1. Download package: ${packageResult.downloadUrl}`);
    console.log(`2. Extract ZIP file to view all documents`);
    console.log(`3. Review the 16 generated startup documents`);
    console.log();
    console.log(`Test project ID: ${testProjectId}`);
    console.log(`Package ID: ${packageResult.packageId}`);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testBIABSystem()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
