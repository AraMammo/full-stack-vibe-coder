/**
 * POST /api/faceless-video/create
 * Creates a new faceless video generation job
 * Uploads files to MinIO and triggers n8n workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { minioClient } from '@/lib/services/minio-client';
import { nanoid } from 'nanoid';

interface CaptionSettings {
  fontFamily?: string;
  fontSize?: number;
  lineColor?: string;
  wordColor?: string;
  maxWordsPerLine?: number;
  position?: string;
  style?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email;

    // Parse form data
    const formData = await request.formData();

    // Extract caption settings
    const captionSettings: CaptionSettings = {
      fontFamily: formData.get('fontFamily') as string || 'The Bold Font',
      fontSize: parseInt(formData.get('fontSize') as string || '60'),
      lineColor: formData.get('lineColor') as string || '#FFFFFF',
      wordColor: formData.get('wordColor') as string || '#66ff74',
      maxWordsPerLine: parseInt(formData.get('maxWordsPerLine') as string || '3'),
      position: formData.get('position') as string || 'bottom_center',
      style: formData.get('style') as string || 'highlight',
    };

    // Get scene count
    const sceneCount = parseInt(formData.get('sceneCount') as string || '0');
    if (sceneCount === 0 || sceneCount > 10) {
      return NextResponse.json(
        { error: 'Invalid scene count. Must be between 1 and 10.' },
        { status: 400 }
      );
    }

    // Validate and process scenes
    const scenes: Array<{
      imageFile: File;
      audioFile: File;
      sceneIndex: number;
    }> = [];

    for (let i = 0; i < sceneCount; i++) {
      const imageFile = formData.get(`scene_${i}_image`) as File;
      const audioFile = formData.get(`scene_${i}_audio`) as File;

      if (!imageFile || !audioFile) {
        return NextResponse.json(
          { error: `Missing files for scene ${i + 1}` },
          { status: 400 }
        );
      }

      // Validate file types
      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: `Scene ${i + 1}: Invalid image file type` },
          { status: 400 }
        );
      }

      if (!audioFile.type.startsWith('audio/')) {
        return NextResponse.json(
          { error: `Scene ${i + 1}: Invalid audio file type` },
          { status: 400 }
        );
      }

      // Validate file sizes (10MB for images, 50MB for audio)
      if (imageFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `Scene ${i + 1}: Image must be under 10MB` },
          { status: 400 }
        );
      }

      if (audioFile.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: `Scene ${i + 1}: Audio must be under 50MB` },
          { status: 400 }
        );
      }

      scenes.push({ imageFile, audioFile, sceneIndex: i });
    }

    // Create job in database
    const job = await prisma.facelessVideoJob.create({
      data: {
        userId,
        userEmail,
        status: 'UPLOADING',
        fontFamily: captionSettings.fontFamily!,
        fontSize: captionSettings.fontSize!,
        lineColor: captionSettings.lineColor!,
        wordColor: captionSettings.wordColor!,
        maxWordsPerLine: captionSettings.maxWordsPerLine!,
        position: captionSettings.position!,
        captionStyle: captionSettings.style!,
      },
    });

    // Upload files to MinIO
    const uploadPromises = scenes.map(async (scene) => {
      const jobId = job.id;
      const imageExt = scene.imageFile.name.split('.').pop();
      const audioExt = scene.audioFile.name.split('.').pop();

      const imageKey = `uploads/${userId}/${jobId}/scene_${scene.sceneIndex}.${imageExt}`;
      const audioKey = `uploads/${userId}/${jobId}/scene_${scene.sceneIndex}.${audioExt}`;

      // Convert files to buffers
      const imageBuffer = Buffer.from(await scene.imageFile.arrayBuffer());
      const audioBuffer = Buffer.from(await scene.audioFile.arrayBuffer());

      // Upload to MinIO
      const [imageResult, audioResult] = await Promise.all([
        minioClient.uploadFile(imageKey, imageBuffer, scene.imageFile.type),
        minioClient.uploadFile(audioKey, audioBuffer, scene.audioFile.type),
      ]);

      // Create scene record in database
      return prisma.videoScene.create({
        data: {
          jobId: job.id,
          sceneIndex: scene.sceneIndex,
          imageUrl: imageResult.url,
          imagePath: imageResult.path,
          audioUrl: audioResult.url,
          audioPath: audioResult.path,
        },
      });
    });

    const uploadedScenes = await Promise.all(uploadPromises);

    // Update job status to QUEUED
    await prisma.facelessVideoJob.update({
      where: { id: job.id },
      data: { status: 'QUEUED', startedAt: new Date() },
    });

    // Trigger n8n workflow
    const n8nWebhookUrl = process.env.N8N_FACELESS_VIDEO_WEBHOOK || 'http://localhost:5678/webhook/faceless-video';
    const callbackUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/faceless-video/webhook`;

    const n8nPayload = {
      job_id: job.id,
      user_id: userId,
      webhook_callback: callbackUrl,
      scenes: uploadedScenes.map((scene) => ({
        image: scene.imageUrl,
        audio: scene.audioUrl,
      })),
      caption_settings: {
        font_family: captionSettings.fontFamily,
        font_size: captionSettings.fontSize,
        line_color: captionSettings.lineColor,
        word_color: captionSettings.wordColor,
        max_words_per_line: captionSettings.maxWordsPerLine,
        position: captionSettings.position,
        style: captionSettings.style,
      },
    };

    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(n8nPayload),
      });

      if (!n8nResponse.ok) {
        console.error('n8n webhook failed:', await n8nResponse.text());
        throw new Error('Failed to trigger n8n workflow');
      }

      // Store n8n webhook data for debugging
      await prisma.facelessVideoJob.update({
        where: { id: job.id },
        data: {
          n8nWebhookData: n8nPayload as any,
        },
      });
    } catch (error) {
      console.error('Failed to trigger n8n workflow:', error);
      await prisma.facelessVideoJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorMessage: 'Failed to trigger video generation workflow',
        },
      });

      return NextResponse.json(
        { error: 'Failed to start video generation. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Video generation started successfully',
    });
  } catch (error) {
    console.error('Faceless video creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create video generation job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
