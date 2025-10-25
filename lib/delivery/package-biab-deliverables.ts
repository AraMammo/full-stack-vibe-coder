/**
 * Business in a Box - Delivery Packaging System
 *
 * Creates tier-specific downloadable packages:
 * - VALIDATION_PACK: Single PDF report
 * - LAUNCH_BLUEPRINT: ZIP with all outputs + logos
 * - TURNKEY_SYSTEM: ZIP with everything + handoff documentation
 */

import { PrismaClient, BIABTier } from '@/app/generated/prisma';
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/storage';
import JSZip from 'jszip';
import { randomUUID } from 'crypto';
import { generateHandoffDocumentation } from '@/lib/services/deployment-handoff';

// ============================================
// TYPES
// ============================================

export interface PackageDeliverableResult {
  success: boolean;
  packageId?: string;
  downloadUrl?: string;
  expiresAt?: Date;
  fileSize?: number;
  fileType?: 'pdf' | 'zip'; // Tier-dependent
  error?: string;
}

export interface PackagingOptions {
  tier: BIABTier;
  logoUrls?: string[]; // For LAUNCH_BLUEPRINT and TURNKEY_SYSTEM
  repoUrl?: string; // For TURNKEY_SYSTEM
  deploymentUrl?: string; // For TURNKEY_SYSTEM
  supabaseProjectId?: string; // For TURNKEY_SYSTEM
  projectName?: string;
  // v0 deployment info
  v0ChatId?: string;
  v0PreviewUrl?: string;
  v0DeployUrl?: string;
}

interface SectionOutputs {
  section: string;
  outputs: Array<{
    promptName: string;
    content: string;
    tokensUsed: number;
  }>;
}

// ============================================
// DELIVERY PACKAGING FUNCTIONS
// ============================================

/**
 * Package BIAB deliverables based on tier
 *
 * - VALIDATION_PACK: Single PDF report
 * - LAUNCH_BLUEPRINT: ZIP with outputs + logos
 * - TURNKEY_SYSTEM: ZIP with everything + handoff docs
 */
export async function packageBIABDeliverables(
  projectId: string,
  userId: string,
  options: PackagingOptions
): Promise<PackageDeliverableResult> {
  const prisma = new PrismaClient();

  try {
    console.log(`[Package BIAB] Starting packaging for project ${projectId}`);
    console.log(`[Package BIAB] Tier: ${options.tier}`);

    // Query project to get v0 deployment info
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    // Add v0 data to options if available
    if (project.v0ChatId) {
      options.v0ChatId = project.v0ChatId;
      options.v0PreviewUrl = project.v0PreviewUrl || undefined;
      options.v0DeployUrl = project.v0DeployUrl || undefined;
      console.log(`[Package BIAB] Including v0 deployment info: ${project.v0PreviewUrl}`);
    }

    // Query all prompt executions for this project
    const executions = await prisma.promptExecution.findMany({
      where: { projectId },
      include: { prompt: true },
      orderBy: { prompt: { orderIndex: 'asc' } },
    });

    if (executions.length === 0) {
      return {
        success: false,
        error: 'No prompt executions found for this project',
      };
    }

    console.log(`[Package BIAB] Found ${executions.length} prompt executions`);

    // Organize outputs by section
    const sectionOutputs = organizeBySection(executions);

    // Handle tier-specific packaging
    if (options.tier === BIABTier.VALIDATION_PACK) {
      // VALIDATION_PACK: Single PDF report
      return await createValidationPDF(projectId, userId, sectionOutputs);
    }

    // LAUNCH_BLUEPRINT and TURNKEY_SYSTEM: Create ZIP
    const zipBuffer = await createZIPPackage(sectionOutputs, projectId, options);

    console.log(`[Package BIAB] Created ZIP file: ${zipBuffer.length} bytes`);

    // Upload to Supabase Storage
    const packageId = randomUUID();
    const fileName = `biab-${projectId}-${Date.now()}.zip`;
    const filePath = `${userId}/${projectId}/${fileName}`;

    console.log(`[Package BIAB] Uploading to bucket: ${STORAGE_BUCKETS.BIAB_DELIVERABLES}`);
    console.log(`[Package BIAB] File path: ${filePath}`);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.BIAB_DELIVERABLES)
      .upload(filePath, zipBuffer, {
        contentType: 'application/zip',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Package BIAB] Upload error:', uploadError);
      return {
        success: false,
        error: `Failed to upload package: ${uploadError.message}`,
      };
    }

    console.log(`[Package BIAB] Uploaded to storage: ${uploadData.path}`);

    // Create signed URL (valid for 7 days)
    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.BIAB_DELIVERABLES)
      .createSignedUrl(uploadData.path, expiresIn);

    if (signedUrlError) {
      console.error('[Package BIAB] Signed URL error:', signedUrlError);
      return {
        success: false,
        error: `Failed to generate download URL: ${signedUrlError.message}`,
      };
    }

    // Save package record to database
    const deliveryPackage = await prisma.deliveryPackage.create({
      data: {
        packageId,
        projectId,
        userId,
        downloadUrl: signedUrlData.signedUrl,
        storagePath: uploadData.path,
        fileSize: zipBuffer.length,
        expiresAt,
      },
    });

    console.log(`[Package BIAB] ✓ Package created successfully`);
    console.log(`[Package BIAB] Package ID: ${packageId}`);
    console.log(`[Package BIAB] File size: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[Package BIAB] Expires: ${expiresAt.toISOString()}`);

    return {
      success: true,
      packageId,
      downloadUrl: signedUrlData.signedUrl,
      expiresAt,
      fileSize: zipBuffer.length,
      fileType: 'zip',
    };

  } catch (error) {
    console.error('[Package BIAB] Packaging failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown packaging error',
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Create single PDF report for VALIDATION_PACK tier
 */
async function createValidationPDF(
  projectId: string,
  userId: string,
  sectionOutputs: SectionOutputs[]
): Promise<PackageDeliverableResult> {
  try {
    // Create a comprehensive markdown document
    const markdownContent = generateValidationReport(projectId, sectionOutputs);

    // Convert markdown to buffer (in production, use a PDF library like puppeteer or pdfkit)
    // For now, we'll save as markdown with PDF extension
    // TODO: Implement actual PDF generation
    const pdfBuffer = Buffer.from(markdownContent, 'utf-8');

    // Upload to Supabase Storage
    const packageId = randomUUID();
    const fileName = `validation-report-${projectId}-${Date.now()}.pdf`;
    const filePath = `${userId}/${projectId}/${fileName}`;

    console.log(`[Package BIAB] Creating validation PDF: ${fileName}`);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.BIAB_DELIVERABLES)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Package BIAB] Upload error:', uploadError);
      return {
        success: false,
        error: `Failed to upload package: ${uploadError.message}`,
      };
    }

    // Create signed URL (valid for 7 days)
    const expiresIn = 7 * 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.BIAB_DELIVERABLES)
      .createSignedUrl(uploadData.path, expiresIn);

    if (signedUrlError) {
      return {
        success: false,
        error: `Failed to generate download URL: ${signedUrlError.message}`,
      };
    }

    // Save package record to database
    const prisma = new PrismaClient();
    await prisma.deliveryPackage.create({
      data: {
        packageId,
        projectId,
        userId,
        downloadUrl: signedUrlData.signedUrl,
        storagePath: uploadData.path,
        fileSize: pdfBuffer.length,
        expiresAt,
      },
    });
    await prisma.$disconnect();

    console.log(`[Package BIAB] ✓ Validation PDF created successfully`);

    return {
      success: true,
      packageId,
      downloadUrl: signedUrlData.signedUrl,
      expiresAt,
      fileSize: pdfBuffer.length,
      fileType: 'pdf',
    };

  } catch (error) {
    console.error('[Package BIAB] PDF creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate validation report content (markdown format)
 */
function generateValidationReport(projectId: string, sectionOutputs: SectionOutputs[]): string {
  const totalOutputs = sectionOutputs.reduce((sum, s) => sum + s.outputs.length, 0);

  let report = `# Business Validation Report

**Project ID**: ${projectId}
**Generated**: ${new Date().toISOString()}
**Tier**: Validation Pack
**Total Analyses**: ${totalOutputs}

---

## Executive Summary

This validation report contains ${totalOutputs} core analyses to help you validate your business idea before making significant investments. Each section below provides critical insights into your market, customers, and business model.

---

`;

  // Add each section's content
  for (const section of sectionOutputs) {
    report += `\n## ${section.section}\n\n`;

    for (const output of section.outputs) {
      report += `### ${output.promptName}\n\n`;
      report += `${output.content}\n\n`;
      report += `---\n\n`;
    }
  }

  report += `\n## Next Steps

Based on this validation analysis:

1. **Review Key Findings**: Focus on the competitive analysis and target audience sections
2. **Validate Assumptions**: Test your pricing strategy with potential customers
3. **Refine Your Model**: Use the GTM plan to outline your first 90 days
4. **Consider Upgrade**: If validation looks promising, upgrade to Launch Blueprint for complete implementation toolkit

---

*Generated with FullStackVibeCoder - AI-Powered Startup Toolkit*
`;

  return report;
}

/**
 * Organize prompt executions by section
 */
function organizeBySection(executions: any[]): SectionOutputs[] {
  const sectionMap = new Map<string, SectionOutputs>();

  for (const execution of executions) {
    const section = execution.prompt.promptSection;

    if (!sectionMap.has(section)) {
      sectionMap.set(section, {
        section,
        outputs: [],
      });
    }

    sectionMap.get(section)!.outputs.push({
      promptName: execution.prompt.promptName,
      content: execution.output,
      tokensUsed: execution.tokensUsed,
    });
  }

  return Array.from(sectionMap.values());
}

/**
 * Create ZIP package with organized folder structure
 * Includes logos for LAUNCH_BLUEPRINT+ and handoff docs for TURNKEY_SYSTEM
 */
async function createZIPPackage(
  sectionOutputs: SectionOutputs[],
  projectId: string,
  options: PackagingOptions
): Promise<Buffer> {
  const zip = new JSZip();

  // Add README at root
  const v0Info = options.v0ChatId ? {
    chatId: options.v0ChatId,
    previewUrl: options.v0PreviewUrl,
    deployUrl: options.v0DeployUrl,
  } : undefined;
  const readme = generateREADME(projectId, sectionOutputs, options.tier, v0Info);
  zip.file('README.md', readme);

  // Create folders by section
  for (const section of sectionOutputs) {
    // Sanitize folder name
    const folderName = sanitizeFolderName(section.section);
    const folder = zip.folder(folderName);

    if (!folder) continue;

    // Add each prompt output as a markdown file
    for (let i = 0; i < section.outputs.length; i++) {
      const output = section.outputs[i];
      const fileName = `${i + 1}-${sanitizeFileName(output.promptName)}.md`;

      const content = generateMarkdownFile(output);
      folder.file(fileName, content);
    }
  }

  // LAUNCH_BLUEPRINT and TURNKEY_SYSTEM: Add brand assets (logos)
  if (options.tier !== BIABTier.VALIDATION_PACK) {
    // Extract logo URLs from visual_identity_05 execution if they exist
    const visualIdentity = sectionOutputs
      .flatMap(s => s.outputs)
      .find(o => o.content.includes('## Generated Logo Files'));

    if (visualIdentity) {
      const logoUrlMatches = visualIdentity.content.match(/Download: (https:\/\/[^\s\)]+)/g);

      if (logoUrlMatches && logoUrlMatches.length > 0) {
        const logoUrls = logoUrlMatches.map(match => match.replace('Download: ', ''));

        console.log(`[Package BIAB] Found ${logoUrls.length} logo URLs to include in package`);

        const brandAssetsFolder = zip.folder('brand-assets');
        const logosFolder = brandAssetsFolder?.folder('logos');

        if (logosFolder) {
          // Add README for logos
          logosFolder.file('README.md', `# Logo Variations\n\nThis folder contains ${logoUrls.length} AI-generated logo variations.\n\nSelect your favorite and customize further with your designer.\n\n## Logo Files\n\n${logoUrls.map((url, i) => `${i + 1}. logo-variation-${i + 1}.png`).join('\n')}\n`);

          // Download each logo and add to ZIP
          for (let i = 0; i < logoUrls.length; i++) {
            try {
              console.log(`[Package BIAB] Downloading logo ${i + 1}/${logoUrls.length}...`);
              const response = await fetch(logoUrls[i]);

              if (!response.ok) {
                console.error(`[Package BIAB] Failed to download logo ${i + 1}: ${response.status}`);
                continue;
              }

              const buffer = Buffer.from(await response.arrayBuffer());

              if (buffer.length === 0) {
                console.error(`[Package BIAB] Logo ${i + 1} is empty, skipping`);
                continue;
              }

              logosFolder.file(`logo-variation-${i + 1}.png`, buffer);
              console.log(`[Package BIAB] ✓ Added logo ${i + 1} to package (${buffer.length} bytes)`);

            } catch (error) {
              console.error(`[Package BIAB] Failed to include logo ${i + 1} in package:`, error);
              // Continue with remaining logos
            }
          }
        }
      }
    }
  }

  // LAUNCH_BLUEPRINT and TURNKEY_SYSTEM: Add v0 deployment info
  if (options.tier !== BIABTier.VALIDATION_PACK && (options.v0ChatId || options.v0PreviewUrl)) {
    const v0Folder = zip.folder('v0-deployment');

    if (v0Folder) {
      const v0Content = `# v0 Deployment Information\n\nYour application has been automatically deployed to Vercel v0!\n\n## Live URLs\n\n**Preview & Edit:**\n- URL: ${options.v0PreviewUrl || 'Not available'}\n- Chat ID: ${options.v0ChatId || 'Not available'}\n\n${options.v0DeployUrl ? `**Live Demo:**\n- URL: ${options.v0DeployUrl}\n\n` : ''}## What is v0?\n\nv0 is Vercel's AI-powered code generation platform. Your application has been automatically generated and is ready to preview, edit, and deploy.\n\n## Next Steps\n\n1. **Visit the Preview URL**\n   - Open ${options.v0PreviewUrl} in your browser\n   - You'll see your application running live\n\n2. **Make Changes**\n   - Use the chat interface to request modifications\n   - Edit code directly in the v0 editor\n   - See changes reflected in real-time\n\n3. **Deploy to Production**\n   - Click "Deploy" in the v0 interface\n   - Your app will be published to Vercel\n   - Get a permanent production URL\n\n4. **Customize Further**\n   - Download the code from v0\n   - Clone to GitHub repository\n   - Continue development locally\n\n## Alternative: Use the Replit Prompt\n\nIf you prefer to build manually or customize heavily:\n- Check the "Launch-Tools" folder for the Replit prompt\n- Use this prompt with any AI coding assistant\n- Build exactly to your specifications\n\n## Support\n\nFor help with v0 or your deployment:\n- v0 Documentation: https://v0.dev/docs\n- Vercel Support: https://vercel.com/support\n- FullStackVibeCoder: support@fullstackvibecoder.com\n`;

      v0Folder.file('README.md', v0Content);

      // Add quick access file with just the URLs
      v0Folder.file('DEPLOYMENT_URLS.txt', `v0 Preview & Edit: ${options.v0PreviewUrl || 'Not available'}\nv0 Chat ID: ${options.v0ChatId || 'Not available'}\n${options.v0DeployUrl ? `v0 Live Demo: ${options.v0DeployUrl}\n` : ''}\nGenerated: ${new Date().toISOString()}\n`);
    }
  }

  // TURNKEY_SYSTEM: Add handoff documentation
  if (options.tier === BIABTier.TURNKEY_SYSTEM) {
    const handoffFolder = zip.folder('handoff-documentation');

    if (handoffFolder) {
      const docs = generateHandoffDocumentation(
        options.projectName || 'Your Project',
        options.repoUrl,
        options.deploymentUrl
      );

      handoffFolder.file('1-github-setup.md', docs.githubSetup);
      handoffFolder.file('2-vercel-deployment.md', docs.vercelDeployment);
      handoffFolder.file('3-supabase-setup.md', docs.supabaseSetup);
      handoffFolder.file('4-stripe-config.md', docs.stripeConfig);
      handoffFolder.file('5-resend-email.md', docs.resendEmail);
      handoffFolder.file('credentials.txt', docs.credentials);
      handoffFolder.file('README.md', `# Handoff Documentation\n\nThis folder contains complete setup instructions for your turnkey system.\n\n## Getting Started\n\n1. Read documents in order (numbered 1-5)\n2. Follow setup instructions step-by-step\n3. Keep credentials.txt secure (never commit to version control)\n4. Reach out to support if you need help\n\n## What's Included\n\n- GitHub repository transfer instructions\n- Vercel deployment guide\n- Supabase project setup\n- Stripe payment configuration\n- Resend email service setup\n- All required credentials\n`);
    }
  }

  // Generate ZIP buffer
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return zipBuffer;
}

/**
 * Generate README file for the package
 */
function generateREADME(projectId: string, sectionOutputs: SectionOutputs[], tier: BIABTier, v0Info?: { chatId?: string; previewUrl?: string; deployUrl?: string }): string {
  const totalOutputs = sectionOutputs.reduce((sum, s) => sum + s.outputs.length, 0);
  const sections = sectionOutputs.map(s => s.section).join(', ');

  const tierName = tier === BIABTier.VALIDATION_PACK ? 'Validation Pack' :
                   tier === BIABTier.LAUNCH_BLUEPRINT ? 'Launch Blueprint' : 'Turnkey System';

  return `# Business in a Box - ${tierName}

**Project ID**: ${projectId}
**Tier**: ${tierName}
**Generated**: ${new Date().toISOString()}
**Total Documents**: ${totalOutputs}

## What's Inside

This package contains a ${tierName === 'Validation Pack' ? 'business validation toolkit' : tierName === 'Launch Blueprint' ? 'complete startup toolkit' : 'turnkey business system'} generated by FullStackVibeCoder's AI agents. Each section below contains detailed documents to help you ${tierName === 'Validation Pack' ? 'validate your business idea' : 'launch your business'}.

## Folder Structure

${sectionOutputs.map((section, i) => {
  const folderName = sanitizeFolderName(section.section);
  return `### ${i + 1}. ${section.section}

📁 \`${folderName}/\`

${section.outputs.map((output, j) => `- ${j + 1}-${sanitizeFileName(output.promptName)}.md`).join('\n')}
`;
}).join('\n')}

## How to Use This Package

1. **Review Each Section**: Start with "Business Model & Market Research" and work through each folder in order.
2. **Customize the Content**: These are AI-generated templates. Adapt them to your specific needs.
3. **Execute the Plan**: Use the documents as actionable blueprints for launching your startup.
4. **Track Progress**: Check off items as you complete them.

## Sections Overview

${sectionOutputs.map((section, i) => `${i + 1}. **${section.section}** (${section.outputs.length} documents)`).join('\n')}

## ${v0Info && v0Info.previewUrl ? '🚀 Live Deployment\n\nYour application has been automatically deployed to v0!\n\n**Preview & Edit:** ' + v0Info.previewUrl + '\n' + (v0Info.deployUrl ? '**Live Demo:** ' + v0Info.deployUrl + '\n' : '') + '\nSee the `v0-deployment/` folder for complete deployment information and instructions.\n\n## ' : ''}Support

For questions or support, contact: support@fullstackvibecoder.com

---

*Generated with FullStackVibeCoder - AI-Powered Startup Toolkit*
`;
}

/**
 * Generate markdown file for a prompt output
 */
function generateMarkdownFile(output: {
  promptName: string;
  content: string;
  tokensUsed: number;
}): string {
  return `# ${output.promptName}

---

${output.content}

---

*Generated by FullStackVibeCoder AI*
*Tokens used: ${output.tokensUsed.toLocaleString()}*
`;
}

/**
 * Sanitize folder name (remove special characters)
 */
function sanitizeFolderName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s&-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/&/g, 'and')
    .toLowerCase();
}

/**
 * Sanitize file name (remove special characters)
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Get delivery package by ID
 */
export async function getDeliveryPackage(packageId: string) {
  const prisma = new PrismaClient();

  try {
    const pkg = await prisma.deliveryPackage.findUnique({
      where: { packageId },
    });

    return pkg;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Regenerate signed URL for expired package
 */
export async function regeneratePackageURL(packageId: string): Promise<string | null> {
  const prisma = new PrismaClient();

  try {
    const pkg = await prisma.deliveryPackage.findUnique({
      where: { packageId },
    });

    if (!pkg) return null;

    // Create new signed URL (7 days)
    const expiresIn = 7 * 24 * 60 * 60;
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.BIAB_DELIVERABLES)
      .createSignedUrl(pkg.storagePath, expiresIn);

    if (error || !data) return null;

    // Update package with new URL and expiration
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000);
    await prisma.deliveryPackage.update({
      where: { packageId },
      data: {
        downloadUrl: data.signedUrl,
        expiresAt: newExpiresAt,
      },
    });

    return data.signedUrl;
  } finally {
    await prisma.$disconnect();
  }
}
