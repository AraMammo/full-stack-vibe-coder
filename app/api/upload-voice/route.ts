/**
 * Voice Note Upload API
 *
 * Handles voice note uploads, storage, transcription, and workflow initiation.
 * This is the entry point for the entire AI agent orchestration system.
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/db';
import { uploadVoiceNote } from '@/lib/storage';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in first.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse form data
    const formData = await request.formData();
    const audio = formData.get('audio') as File;
    const sessionId = formData.get('sessionId') as string; // Stripe session ID

    if (!audio) {
      return NextResponse.json(
        { error: 'Missing audio file' },
        { status: 400 }
      );
    }

    console.log('📤 Received voice note:', {
      fileName: audio.name,
      fileSize: audio.size,
      userId,
      sessionId,
    });

    // Step 1: Verify payment if sessionId provided
    // TODO: Payment model not implemented - uncomment when added to Prisma schema
    /*
    if (sessionId) {
      const payment = await prisma.payment.findUnique({
        where: { stripeSessionId: sessionId },
      });

      if (!payment) {
        // Create payment record (will be updated by Stripe webhook)
        await prisma.payment.create({
          data: {
            userId,
            stripeSessionId: sessionId,
            amount: 29700, // $297
            currency: 'usd',
            status: 'pending',
            productType: 'startup_kit',
          },
        });
      }
    }
    */

    // Step 2: Upload audio file to Supabase Storage
    console.log('☁️  Uploading to Supabase Storage...');
    const uploadResult = await uploadVoiceNote(userId, audio, audio.name);

    if ('error' in uploadResult) {
      console.error('Storage upload failed:', uploadResult.error);
      return NextResponse.json(
        { error: 'Failed to store audio file: ' + uploadResult.error },
        { status: 500 }
      );
    }

    const { url: fileUrl, path: filePath } = uploadResult;
    console.log('✓ Audio uploaded:', filePath);

    // Step 3: Create database record for voice note
    // TODO: VoiceNote model not implemented - uncomment when added to Prisma schema
    /*
    const voiceNote = await prisma.voiceNote.create({
      data: {
        userId,
        fileUrl,
        fileName: audio.name,
        fileSize: audio.size,
        fileMimeType: audio.type || 'audio/webm',
        status: 'uploaded',
      },
    });

    console.log('✓ Voice note record created:', voiceNote.id);
    */

    const voiceNoteId = 'temp-' + Date.now(); // Temporary ID since model doesn't exist

    // Step 4: Transcribe audio with OpenAI Whisper
    console.log('🎤 Transcribing audio with Whisper API...');

    // Update status to transcribing
    // TODO: Uncomment when VoiceNote model exists
    /*
    await prisma.voiceNote.update({
      where: { id: voiceNote.id },
      data: { status: 'transcribing' },
    });
    */

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const transcription = await openai.audio.transcriptions.create({
        file: audio,
        model: 'whisper-1',
        language: 'en',
      });

      const transcript = transcription.text;
      console.log('✓ Transcription complete:', transcript.substring(0, 100) + '...');

      // Update voice note with transcript
      // TODO: Uncomment when VoiceNote model exists
      /*
      await prisma.voiceNote.update({
        where: { id: voiceNote.id },
        data: {
          transcript,
          transcribedAt: new Date(),
          status: 'transcribed',
        },
      });
      */

      // Step 5: Create workflow for AI agent processing
      // TODO: Workflow model not yet implemented - uncomment when added to Prisma schema
      /*
      console.log('🤖 Creating AI agent workflow...');
      const workflow = await prisma.workflow.create({
        data: {
          userId,
          voiceNoteId: voiceNote.id,
          status: 'pending',
          context: {
            transcript,
            originalFileName: audio.name,
            fileSize: audio.size,
            transcribedAt: new Date().toISOString(),
          },
        },
      });

      console.log('✓ Workflow created:', workflow.id);
      */

      // Step 6: Trigger workflow processing (async)
      // This will be handled by a separate background job or webhook
      // For now, we'll return immediately and process asynchronously

      // TODO: Trigger background job to start agent workflow
      // await triggerWorkflowProcessing(workflow.id);

      // For backwards compatibility with webhook, still send if configured
      const webhookUrl = process.env.BUSINESS_BLUEPRINT_WEBHOOK_URL;
      if (webhookUrl) {
        console.log('🔔 Sending to legacy webhook...');
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            transcript,
            timestamp: new Date().toISOString(),
          }),
        }).catch(err => {
          console.error('Webhook error (non-blocking):', err);
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Voice note received and transcribed successfully!',
        data: {
          voiceNoteId: voiceNoteId,
          transcriptPreview: transcript.substring(0, 200) + '...',
          note: 'Workflow processing not yet implemented - database models pending',
        },
      });

    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);

      // Update voice note status to failed
      // TODO: Uncomment when VoiceNote model exists
      /*
      await prisma.voiceNote.update({
        where: { id: voiceNote.id },
        data: { status: 'failed' },
      });
      */

      return NextResponse.json(
        {
          error: 'Failed to transcribe audio',
          details: transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

  } catch (err) {
    console.error('❌ Upload error:', err);
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
