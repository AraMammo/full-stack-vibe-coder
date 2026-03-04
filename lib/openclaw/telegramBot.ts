/**
 * OpenClaw Telegram Bot
 *
 * State machine for the Telegram-based ShipKit Presence intake.
 * Users send screenshots + a description via Telegram and get a live URL back.
 *
 * States:
 *   AWAITING_SCREENSHOTS → AWAITING_DESCRIPTION → GENERATING → LIVE → ITERATING
 */

import { prisma } from '@/lib/db';
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/storage';
import { extractVisualDNA } from '@/lib/intake/visionAnalysis';

// ============================================
// TYPES
// ============================================

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number; first_name?: string; last_name?: string; username?: string };
  from?: { id: number; first_name?: string; last_name?: string; username?: string };
  text?: string;
  photo?: Array<{ file_id: string; file_unique_id: string; width: number; height: number }>;
  document?: { file_id: string; file_name?: string; mime_type?: string };
}

interface TelegramFile {
  file_id: string;
  file_path?: string;
}

// ============================================
// BOT TOKEN
// ============================================

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');
  return token;
}

// ============================================
// TELEGRAM API HELPERS
// ============================================

async function sendMessage(chatId: number, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${getBotToken()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });
}

async function getFileUrl(fileId: string): Promise<string> {
  const token = getBotToken();
  const response = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const data = await response.json();
  const file: TelegramFile = data.result;
  return `https://api.telegram.org/file/bot${token}/${file.file_path}`;
}

// ============================================
// MAIN HANDLER
// ============================================

/**
 * Process an incoming Telegram webhook update.
 */
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id.toString();
  const text = message.text?.trim();

  try {
    // Find or create session
    let session = await prisma.openClawSession.findUnique({
      where: { chatId },
    });

    if (!session) {
      // New user — create session
      session = await prisma.openClawSession.create({
        data: {
          chatId,
          state: 'AWAITING_SCREENSHOTS',
          screenshots: [],
        },
      });

      // Find or create user record
      const userId = await findOrCreateTelegramUser(message);
      await prisma.openClawSession.update({
        where: { id: session.id },
        data: { userId },
      });

      await sendMessage(
        message.chat.id,
        "Welcome to ShipKit! I'll build you a professional website from a single message.\n\n" +
        "Send me screenshots of sites you like, or type *skip* to continue without them."
      );
      return;
    }

    // Route based on current state
    switch (session.state) {
      case 'AWAITING_SCREENSHOTS':
        await handleAwaitingScreenshots(session, message);
        break;

      case 'AWAITING_DESCRIPTION':
        await handleAwaitingDescription(session, message);
        break;

      case 'GENERATING':
        await sendMessage(
          message.chat.id,
          "Your site is being built right now. I'll send you the URL when it's ready!"
        );
        break;

      case 'LIVE':
        await handleLiveIteration(session, message);
        break;

      case 'ITERATING':
        await sendMessage(
          message.chat.id,
          "I'm processing your last change request. I'll send the updated URL when it's done!"
        );
        break;

      default:
        await sendMessage(message.chat.id, "Something went wrong. Send any message to start over.");
        await prisma.openClawSession.update({
          where: { id: session.id },
          data: { state: 'AWAITING_SCREENSHOTS', screenshots: [] },
        });
    }
  } catch (error) {
    console.error('[OpenClaw] Error handling update:', error);
    await sendMessage(
      message.chat.id,
      "Sorry, something went wrong. Please try again."
    );
  }
}

// ============================================
// STATE HANDLERS
// ============================================

async function handleAwaitingScreenshots(
  session: any,
  message: TelegramMessage
): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text?.trim().toLowerCase();

  // Check for skip/done commands
  if (text === 'skip' || text === 'done') {
    await prisma.openClawSession.update({
      where: { id: session.id },
      data: { state: 'AWAITING_DESCRIPTION' },
    });

    await sendMessage(
      chatId,
      "Got it! Now describe your business in one message.\n\n" +
      "Tell me: What do you do and who do you serve?"
    );
    return;
  }

  // Handle photo upload
  if (message.photo && message.photo.length > 0) {
    // Get the largest photo version
    const largestPhoto = message.photo[message.photo.length - 1];
    const fileUrl = await getFileUrl(largestPhoto.file_id);

    // Download and upload to Supabase Storage
    const fileResponse = await fetch(fileUrl);
    const buffer = Buffer.from(await fileResponse.arrayBuffer());

    const fileName = `${session.chatId}/${Date.now()}-screenshot.jpg`;
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.INTAKE_SCREENSHOTS)
      .upload(fileName, buffer, { contentType: 'image/jpeg' });

    if (error) {
      console.error('[OpenClaw] Screenshot upload error:', error);
      await sendMessage(chatId, "Failed to save screenshot. Please try again.");
      return;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKETS.INTAKE_SCREENSHOTS)
      .getPublicUrl(fileName);

    // Append to session screenshots
    const currentScreenshots = (session.screenshots as string[]) || [];
    currentScreenshots.push(urlData.publicUrl);

    await prisma.openClawSession.update({
      where: { id: session.id },
      data: { screenshots: currentScreenshots },
    });

    await sendMessage(
      chatId,
      `Screenshot saved! (${currentScreenshots.length} total)\n\nSend more, or type *done* to continue.`
    );
    return;
  }

  // Handle document upload (images sent as files)
  if (message.document?.mime_type?.startsWith('image/')) {
    const fileUrl = await getFileUrl(message.document.file_id);
    const fileResponse = await fetch(fileUrl);
    const buffer = Buffer.from(await fileResponse.arrayBuffer());

    const ext = message.document.file_name?.split('.').pop() || 'png';
    const fileName = `${session.chatId}/${Date.now()}-screenshot.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.INTAKE_SCREENSHOTS)
      .upload(fileName, buffer, { contentType: message.document.mime_type });

    if (error) {
      console.error('[OpenClaw] Document upload error:', error);
      await sendMessage(chatId, "Failed to save image. Please try again.");
      return;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKETS.INTAKE_SCREENSHOTS)
      .getPublicUrl(fileName);

    const currentScreenshots = (session.screenshots as string[]) || [];
    currentScreenshots.push(urlData.publicUrl);

    await prisma.openClawSession.update({
      where: { id: session.id },
      data: { screenshots: currentScreenshots },
    });

    await sendMessage(
      chatId,
      `Image saved! (${currentScreenshots.length} total)\n\nSend more, or type *done* to continue.`
    );
    return;
  }

  // Any other text
  await sendMessage(
    chatId,
    "Send me screenshots of sites you like, or type *skip* to continue without them."
  );
}

async function handleAwaitingDescription(
  session: any,
  message: TelegramMessage
): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text?.trim();

  if (!text || text.length < 10) {
    await sendMessage(
      chatId,
      "Please describe your business in at least a sentence. What do you do and who do you serve?"
    );
    return;
  }

  // Check for active payment
  if (session.userId) {
    const hasPayment = await prisma.payment.findFirst({
      where: {
        userId: session.userId,
        tier: 'PRESENCE',
        status: 'COMPLETED',
      },
    });

    if (!hasPayment) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://shipkit.io';
      await sendMessage(
        chatId,
        `To build your site, you'll need a ShipKit Presence subscription ($97).\n\n` +
        `Complete payment here: ${baseUrl}/get-started?tier=PRESENCE\n\n` +
        `Then send me your business description again!`
      );
      return;
    }
  }

  // Transition to GENERATING
  await prisma.openClawSession.update({
    where: { id: session.id },
    data: { state: 'GENERATING' },
  });

  await sendMessage(
    chatId,
    "Building your site now! This usually takes 2-3 minutes. I'll send your URL when it's live."
  );

  // Create project and trigger pipeline (async)
  triggerPresencePipeline(session, text).catch((err) => {
    console.error('[OpenClaw] Pipeline failed:', err);
    sendMessage(chatId, "Sorry, something went wrong building your site. Please try again later.");
    prisma.openClawSession.update({
      where: { id: session.id },
      data: { state: 'AWAITING_DESCRIPTION' },
    });
  });
}

async function handleLiveIteration(
  session: any,
  message: TelegramMessage
): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text?.trim();

  if (!text || text.length < 5) {
    await sendMessage(chatId, "Tell me what you'd like to change on your site.");
    return;
  }

  if (!session.projectId) {
    await sendMessage(chatId, "I can't find your project. Please start over by sending a new message.");
    return;
  }

  // Check subscription is active
  const deployedApp = await prisma.deployedApp.findFirst({
    where: { projectId: session.projectId },
    include: { subscription: true },
  });

  if (!deployedApp?.subscription || deployedApp.subscription.status !== 'active') {
    await sendMessage(
      chatId,
      "Your hosting subscription is not active. Reactivate it to request changes."
    );
    return;
  }

  // Transition to ITERATING
  await prisma.openClawSession.update({
    where: { id: session.id },
    data: { state: 'ITERATING' },
  });

  await sendMessage(chatId, "Processing your change request...");

  // Run change handler (async)
  try {
    const { processChangeRequest } = await import('@/lib/iteration/changeHandler');

    const changeRequest = await prisma.changeRequest.create({
      data: {
        projectId: session.projectId,
        userMessage: text,
        status: 'PENDING',
      },
    });

    const result = await processChangeRequest(
      session.projectId,
      changeRequest.id,
      text
    );

    if (result.success) {
      await sendMessage(
        chatId,
        `Done! Your site has been updated.\n\n` +
        `Live URL: ${result.deployUrl}\n` +
        `Changes: ${result.diffSummary}\n\n` +
        `Reply with another change request anytime.`
      );
    } else {
      await sendMessage(chatId, `Change request failed: ${result.error}`);
    }

    await prisma.openClawSession.update({
      where: { id: session.id },
      data: { state: 'LIVE' },
    });
  } catch (error) {
    console.error('[OpenClaw] Change request failed:', error);
    await sendMessage(chatId, "Sorry, the change request failed. Please try again.");
    await prisma.openClawSession.update({
      where: { id: session.id },
      data: { state: 'LIVE' },
    });
  }
}

// ============================================
// PIPELINE TRIGGER
// ============================================

async function triggerPresencePipeline(session: any, businessDescription: string): Promise<void> {
  const chatId = parseInt(session.chatId);

  // Create project
  const project = await prisma.project.create({
    data: {
      userId: session.userId || 'telegram-user',
      projectName: `Presence - ${businessDescription.substring(0, 50)}`,
      biabTier: 'PRESENCE',
      productType: 'PRESENCE',
      businessConcept: businessDescription,
      status: 'PENDING',
    },
  });

  await prisma.openClawSession.update({
    where: { id: session.id },
    data: { projectId: project.id },
  });

  // Process screenshots for visual DNA if any
  const screenshots = (session.screenshots as string[]) || [];
  if (screenshots.length > 0) {
    try {
      // Download first screenshot and extract visual DNA
      const screenshotUrl = screenshots[0];
      const response = await fetch(screenshotUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      const visualDna = await extractVisualDNA(buffer);

      await prisma.project.update({
        where: { id: project.id },
        data: {
          referenceScreenshotUrl: screenshotUrl,
          visualDna: visualDna as any,
        },
      });

      console.log('[OpenClaw] Visual DNA extracted from screenshot');
    } catch (err) {
      console.error('[OpenClaw] Visual DNA extraction failed:', err);
      // Continue without visual DNA
    }
  }

  // Trigger the orchestrator
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const executeResponse = await fetch(`${baseUrl}/api/shipkit/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: project.id,
      businessConcept: businessDescription,
      userId: session.userId || 'telegram-user',
      tier: 'PRESENCE',
    }),
  });

  if (!executeResponse.ok) {
    throw new Error(`Orchestrator failed: ${executeResponse.status}`);
  }

  // Get the result to find the deploy URL
  const result = await executeResponse.json();
  const deployUrl = result.codegenResult?.deploymentUrl || project.vercelDeploymentUrl;

  // Refresh project data
  const updatedProject = await prisma.project.findUnique({
    where: { id: project.id },
    include: { deployedApp: true },
  });

  const liveUrl = updatedProject?.deployedApp?.vercelProductionUrl || deployUrl;

  // Transition to LIVE
  await prisma.openClawSession.update({
    where: { id: session.id },
    data: { state: 'LIVE' },
  });

  await sendMessage(
    chatId,
    `Your site is live! 🎉\n\n` +
    `URL: ${liveUrl}\n\n` +
    `To request changes, just reply with what you want updated.`
  );
}

// ============================================
// USER IDENTITY
// ============================================

async function findOrCreateTelegramUser(message: TelegramMessage): Promise<string> {
  const telegramId = message.from?.id?.toString() || message.chat.id.toString();
  const name = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ') || 'Telegram User';

  // Look for existing user linked by a convention (telegram:chatId as email placeholder)
  const emailPlaceholder = `telegram_${telegramId}@openclaw.shipkit.io`;

  let user = await prisma.user.findUnique({
    where: { email: emailPlaceholder },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: emailPlaceholder,
        name,
      },
    });
    console.log(`[OpenClaw] Created user for Telegram ID ${telegramId}: ${user.id}`);
  }

  return user.id;
}
