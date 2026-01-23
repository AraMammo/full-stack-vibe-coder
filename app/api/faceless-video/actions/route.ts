/**
 * POST /api/faceless-video/actions
 *
 * Webhook endpoint that receives action requests from Airtable automations.
 * Replaces Make.com scenarios.
 *
 * Expected payload:
 * {
 *   "aid": "18",           // Action ID from Actions table
 *   "recordId": "recXXX"   // Airtable record ID to process
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleAction, ACTION_IDS } from '@/lib/services/faceless-video-actions';

// Webhook secret for validation (optional but recommended)
const WEBHOOK_SECRET = process.env.FACELESS_VIDEO_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Parse request body first
    const body = await request.json();
    const { aid, recordId, secret } = body;

    // Optional: Validate webhook secret (supports header OR body)
    if (WEBHOOK_SECRET) {
      const authHeader = request.headers.get('authorization');
      const isValidHeader = authHeader === `Bearer ${WEBHOOK_SECRET}`;
      const isValidBody = secret === WEBHOOK_SECRET;

      if (!isValidHeader && !isValidBody) {
        console.warn('[actions webhook] Invalid authorization');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log(`[actions webhook] Received: aid=${aid}, recordId=${recordId}`);

    // Validate required fields
    if (!aid) {
      return NextResponse.json(
        { success: false, error: 'Missing action ID (aid)' },
        { status: 400 }
      );
    }

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: 'Missing record ID (recordId)' },
        { status: 400 }
      );
    }

    // Handle the action
    const result = await handleAction(aid, recordId);

    if (!result.success) {
      console.error(`[actions webhook] Action failed: ${result.error}`);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    console.log(`[actions webhook] Action completed successfully`);

    return NextResponse.json({
      success: true,
      message: `Action ${aid} completed for record ${recordId}`,
    });
  } catch (error) {
    console.error('[actions webhook] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Also support GET for testing/health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/faceless-video/actions',
    description: 'Webhook endpoint for Airtable automations',
    supportedActions: Object.entries(ACTION_IDS).map(([name, id]) => ({
      name,
      id,
    })),
  });
}
