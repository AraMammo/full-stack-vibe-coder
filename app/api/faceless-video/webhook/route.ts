/**
 * POST /api/faceless-video/webhook
 * Webhook endpoint for n8n to report video generation completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { minioClient } from '@/lib/services/minio-client';

interface WebhookPayload {
  job_id: string;
  status: 'completed' | 'failed';
  output_video_url?: string;
  error_message?: string;
  video_duration?: number;
  file_size?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (REQUIRED in production)
    const webhookSecret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

    // In production, webhook secret is required
    if (!expectedSecret) {
      // Allow in development mode only
      if (process.env.NODE_ENV === 'production') {
        console.error('[Webhook] N8N_WEBHOOK_SECRET not configured in production');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
      console.warn('[Webhook] N8N_WEBHOOK_SECRET not set - allowing request in development');
    } else if (webhookSecret !== expectedSecret) {
      console.error('[Webhook] Invalid webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: WebhookPayload = await request.json();
    const { job_id, status, output_video_url, error_message, video_duration, file_size } = payload;

    if (!job_id) {
      return NextResponse.json({ error: 'Missing job_id' }, { status: 400 });
    }

    // Find the job
    const job = await prisma.facelessVideoJob.findUnique({
      where: { id: job_id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (status === 'completed') {
      if (!output_video_url) {
        return NextResponse.json({ error: 'Missing output_video_url' }, { status: 400 });
      }

      // Update job with completion details
      await prisma.facelessVideoJob.update({
        where: { id: job_id },
        data: {
          status: 'COMPLETED',
          outputVideoUrl: output_video_url,
          videoDuration: video_duration,
          fileSize: file_size,
          completedAt: new Date(),
          progress: 100,
        },
      });

      // TODO: Send email notification to user
      console.log(`Video generation completed for job ${job_id}`);

      return NextResponse.json({
        success: true,
        message: 'Job completed successfully',
      });
    } else if (status === 'failed') {
      // Update job with failure details
      await prisma.facelessVideoJob.update({
        where: { id: job_id },
        data: {
          status: 'FAILED',
          errorMessage: error_message || 'Video generation failed',
          completedAt: new Date(),
        },
      });

      // TODO: Send email notification to user about failure
      console.error(`Video generation failed for job ${job_id}: ${error_message}`);

      return NextResponse.json({
        success: true,
        message: 'Job failure recorded',
      });
    } else {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
