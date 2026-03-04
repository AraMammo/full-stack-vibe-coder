/**
 * OpenClaw Telegram Webhook
 *
 * POST /api/openclaw/telegram
 * Receives webhook updates from the Telegram Bot API.
 * Register this URL with Telegram via:
 *   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<BASE_URL>/api/openclaw/telegram"
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/lib/openclaw/telegramBot';

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();

    console.log(`[Telegram] Received update: ${update.update_id}`);

    // Process the update asynchronously — respond immediately to Telegram
    handleTelegramUpdate(update).catch((error) => {
      console.error('[Telegram] Error processing update:', error);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Telegram] Webhook error:', error);
    // Always return 200 to Telegram to prevent retries
    return NextResponse.json({ ok: true });
  }
}
