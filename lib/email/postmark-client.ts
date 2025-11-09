/**
 * SendGrid Email Client
 *
 * Sends transactional emails using SendGrid API.
 * Used for project notifications (started, completed).
 */

import sgMail from '@sendgrid/mail';
import { BIABTier } from '@/app/generated/prisma';

// ============================================
// TYPES
// ============================================

export interface EmailUser {
  email: string;
  name?: string;
}

export interface ProjectEmailData {
  projectId: string;
  projectName: string;
  tier: BIABTier;
  dashboardUrl: string;
}

export interface CompletionEmailData extends ProjectEmailData {
  downloadUrl: string;
  fileType: 'pdf' | 'zip';
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// POSTMARK CLIENT
// ============================================

/**
 * Send "Project Started" email
 *
 * @param user - Recipient user
 * @param projectData - Project information
 * @returns Email send result
 */
export async function sendProjectStartedEmail(
  user: EmailUser,
  projectData: ProjectEmailData
): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@fullstackvibecoder.com';

  if (!apiKey) {
    console.error('[SendGrid] API key not configured');
    return {
      success: false,
      error: 'SENDGRID_API_KEY environment variable not set',
    };
  }

  try {
    // Set SendGrid API key
    sgMail.setApiKey(apiKey);

    const { tier, projectName, dashboardUrl } = projectData;
    const tierName = getTierDisplayName(tier);
    const estimatedTime = getEstimatedCompletionTime(tier);

    const subject = `Building Your ${tierName}`;
    const htmlBody = generateProjectStartedHTML(user, tierName, projectName, estimatedTime, dashboardUrl);
    const textBody = generateProjectStartedText(user, tierName, projectName, estimatedTime, dashboardUrl);

    console.log(`[SendGrid] Sending project started email to ${user.email}`);

    const msg = {
      to: user.email,
      from: fromEmail,
      subject: subject,
      text: textBody,
      html: htmlBody,
    };

    const [response] = await sgMail.send(msg);

    console.log(`[SendGrid] ✓ Email sent, Message ID: ${response.headers['x-message-id']}`);

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    };

  } catch (error: any) {
    console.error('[SendGrid] Email send failed:', error);

    // SendGrid errors have detailed info
    if (error.response) {
      console.error('[SendGrid] Error response:', error.response.body);
    }

    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Send "Project Complete" email
 *
 * @param user - Recipient user
 * @param completionData - Project completion information
 * @returns Email send result
 */
export async function sendProjectCompleteEmail(
  user: EmailUser,
  completionData: CompletionEmailData
): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@fullstackvibecoder.com';

  if (!apiKey) {
    console.error('[SendGrid] API key not configured');
    return {
      success: false,
      error: 'SENDGRID_API_KEY environment variable not set',
    };
  }

  try {
    // Set SendGrid API key
    sgMail.setApiKey(apiKey);

    const { tier, projectName, downloadUrl, dashboardUrl, fileType } = completionData;
    const tierName = getTierDisplayName(tier);

    const subject = `Your ${tierName} is Ready!`;
    const htmlBody = generateProjectCompleteHTML(user, tierName, projectName, downloadUrl, dashboardUrl, fileType);
    const textBody = generateProjectCompleteText(user, tierName, projectName, downloadUrl, dashboardUrl, fileType);

    console.log(`[SendGrid] Sending project complete email to ${user.email}`);

    const msg = {
      to: user.email,
      from: fromEmail,
      subject: subject,
      text: textBody,
      html: htmlBody,
    };

    const [response] = await sgMail.send(msg);

    console.log(`[SendGrid] ✓ Email sent, Message ID: ${response.headers['x-message-id']}`);

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    };

  } catch (error: any) {
    console.error('[SendGrid] Email send failed:', error);

    // SendGrid errors have detailed info
    if (error.response) {
      console.error('[SendGrid] Error response:', error.response.body);
    }

    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get display name for tier
 */
function getTierDisplayName(tier: BIABTier): string {
  switch (tier) {
    case BIABTier.VALIDATION_PACK:
      return 'Validation Pack';
    case BIABTier.LAUNCH_BLUEPRINT:
      return 'Launch Blueprint';
    case BIABTier.TURNKEY_SYSTEM:
      return 'Turnkey System';
    default:
      return 'Business Package';
  }
}

/**
 * Get estimated completion time for tier
 */
function getEstimatedCompletionTime(tier: BIABTier): string {
  switch (tier) {
    case BIABTier.VALIDATION_PACK:
      return '15-20 minutes';
    case BIABTier.LAUNCH_BLUEPRINT:
      return '45-60 minutes';
    case BIABTier.TURNKEY_SYSTEM:
      return '90-120 minutes';
    default:
      return '30-60 minutes';
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Generate HTML for project started email
 */
function generateProjectStartedHTML(
  user: EmailUser,
  tierName: string,
  projectName: string,
  estimatedTime: string,
  dashboardUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Building Your ${tierName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ec4899, #06b6d4); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">We're Building Your ${tierName}</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${user.name || 'there'},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">Your <strong>${projectName}</strong> is now being generated by our AI agents!</p>

    <div style="background: white; border-left: 4px solid #06b6d4; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0; font-size: 14px; color: #666;">Estimated completion time:</p>
      <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #06b6d4;">${estimatedTime}</p>
    </div>

    <p style="font-size: 16px; margin-bottom: 20px;">Track your progress in real-time:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #06b6d4); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">View Dashboard</a>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">You'll receive another email when your ${tierName} is ready to download.</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; text-align: center;">
      FullStackVibeCoder - AI-Powered Startup Toolkit<br>
      <a href="https://fullstackvibecoder.com" style="color: #06b6d4; text-decoration: none;">fullstackvibecoder.com</a>
    </p>
  </div>
</body>
</html>
`;
}

/**
 * Generate plain text for project started email
 */
function generateProjectStartedText(
  user: EmailUser,
  tierName: string,
  projectName: string,
  estimatedTime: string,
  dashboardUrl: string
): string {
  return `
Building Your ${tierName}

Hi ${user.name || 'there'},

Your ${projectName} is now being generated by our AI agents!

Estimated completion time: ${estimatedTime}

Track your progress in real-time at:
${dashboardUrl}

You'll receive another email when your ${tierName} is ready to download.

---
FullStackVibeCoder - AI-Powered Startup Toolkit
https://fullstackvibecoder.com
`;
}

/**
 * Generate HTML for project complete email
 */
function generateProjectCompleteHTML(
  user: EmailUser,
  tierName: string,
  projectName: string,
  downloadUrl: string,
  dashboardUrl: string,
  fileType: 'pdf' | 'zip'
): string {
  const fileTypeText = fileType === 'pdf' ? 'PDF Report' : 'ZIP Package';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${tierName} is Ready!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981, #06b6d4); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✓ Your ${tierName} is Ready!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${user.name || 'there'},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">Great news! Your <strong>${projectName}</strong> is complete and ready to download.</p>

    <div style="background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0; font-size: 14px; color: #666;">Package type:</p>
      <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #10b981;">${fileTypeText}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; margin-bottom: 10px;">Download Now</a>
    </div>

    <p style="font-size: 14px; color: #666; text-align: center; margin-bottom: 20px;">or view in your dashboard:</p>

    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${dashboardUrl}" style="color: #06b6d4; text-decoration: none; font-size: 14px;">View in Dashboard →</a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Note:</strong> Download link expires in 7 days. Download and save your files soon!</p>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; text-align: center;">
      FullStackVibeCoder - AI-Powered Startup Toolkit<br>
      <a href="https://fullstackvibecoder.com" style="color: #06b6d4; text-decoration: none;">fullstackvibecoder.com</a>
    </p>
  </div>
</body>
</html>
`;
}

/**
 * Generate plain text for project complete email
 */
function generateProjectCompleteText(
  user: EmailUser,
  tierName: string,
  projectName: string,
  downloadUrl: string,
  dashboardUrl: string,
  fileType: 'pdf' | 'zip'
): string {
  const fileTypeText = fileType === 'pdf' ? 'PDF Report' : 'ZIP Package';

  return `
Your ${tierName} is Ready!

Hi ${user.name || 'there'},

Great news! Your ${projectName} is complete and ready to download.

Package type: ${fileTypeText}

Download here:
${downloadUrl}

Or view in your dashboard:
${dashboardUrl}

Note: Download link expires in 7 days. Download and save your files soon!

---
FullStackVibeCoder - AI-Powered Startup Toolkit
https://fullstackvibecoder.com
`;
}
