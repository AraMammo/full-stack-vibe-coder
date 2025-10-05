import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;
    const sessionId = formData.get('sessionId') as string;

    if (!audio || !sessionId) {
      return NextResponse.json(
        { error: 'Missing audio or session ID' },
        { status: 400 }
      );
    }

    console.log('Received voice note:', {
      fileName: audio.name,
      fileSize: audio.size,
      sessionId: sessionId,
    });

    // Step 1: Transcribe audio with OpenAI Whisper
    console.log('Transcribing audio with Whisper API...');
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'en',
    });

    const transcript = transcription.text;
    console.log('Transcription complete:', transcript.substring(0, 100) + '...');

    // Step 2: Send transcript to webhook for business blueprint automation
    const webhookUrl = process.env.BUSINESS_BLUEPRINT_WEBHOOK_URL;
    
    if (webhookUrl) {
      console.log('Sending transcript to webhook...');
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          transcript,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!webhookResponse.ok) {
        console.error('Webhook failed:', await webhookResponse.text());
        return NextResponse.json(
          { error: 'Failed to process business blueprint' },
          { status: 500 }
        );
      }

      console.log('Webhook sent successfully');
    } else {
      console.warn('No webhook URL configured. Skipping webhook call.');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Voice note received. Your business is being built!',
      transcript: transcript.substring(0, 200) + '...', // Return preview
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error') },
      { status: 500 }
    );
  }
}