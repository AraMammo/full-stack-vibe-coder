/**
 * GET /api/v2/faceless-video/stories/[storyId] - Get story details and progress
 * POST /api/v2/faceless-video/stories/[storyId] - Continue processing (process one shot)
 * DELETE /api/v2/faceless-video/stories/[storyId] - Delete a story
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, processOneShot, finalizeScenesAndStory } from '@/lib/services/faceless-video';

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = params;

    const story = await db.getStory(storyId);

    if (!story) {
      return NextResponse.json(
        { success: false, error: 'Story not found' },
        { status: 404 }
      );
    }

    // Calculate detailed progress
    const { progress, totalShots, completedShots } = await db.calculateProgress(storyId);

    // Determine current step description
    let currentStep = 'Initializing...';
    switch (story.status) {
      case 'pending':
        currentStep = 'Queued for processing';
        break;
      case 'generating_story':
        currentStep = 'Generating story text';
        break;
      case 'generating_scenes':
        currentStep = 'Creating scenes and shots';
        break;
      case 'generating_media':
        currentStep = `Generating media (${completedShots}/${totalShots} shots)`;
        break;
      case 'building_video':
        currentStep = 'Building final video';
        break;
      case 'adding_captions':
        currentStep = 'Adding captions';
        break;
      case 'completed':
        currentStep = 'Complete!';
        break;
      case 'failed':
        currentStep = 'Failed';
        break;
    }

    return NextResponse.json({
      success: true,
      story: {
        id: story.id,
        name: story.name,
        status: story.status,
        progress,
        currentStep,
        totalScenes: story.total_scenes,
        totalShots: story.total_shots,
        completedShots,
        generatedStory: story.generated_story,
        finalVideoUrl: story.final_video_url,
        finalVideoCaptionedUrl: story.final_video_captioned_url,
        srtContent: story.srt_content,
        errorMessage: story.error_message,
        createdAt: story.created_at,
        completedAt: story.completed_at,
        storyType: story.story_type ? {
          name: story.story_type.name,
          width: story.story_type.width,
          height: story.story_type.height,
        } : null,
        scenes: story.scenes?.map(scene => ({
          id: scene.id,
          name: scene.name,
          sortOrder: scene.sort_order,
          status: scene.status,
          videoUrl: scene.video_url,
          shots: scene.shots?.map(shot => ({
            id: shot.id,
            name: shot.name,
            script: shot.script,
            sortOrder: shot.sort_order,
            imageUrl: shot.image_url,
            audioUrl: shot.audio_url,
            videoUrl: shot.video_url,
            finalVideoUrl: shot.final_video_url,
            imageStatus: shot.image_status,
            audioStatus: shot.audio_status,
            videoStatus: shot.video_status,
            finalStatus: shot.final_status,
          })),
        })),
      },
    });
  } catch (error) {
    console.error('[story] Get error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch story' },
      { status: 500 }
    );
  }
}

/**
 * POST - Continue processing by handling one incomplete shot or finalizing
 * This allows incremental processing without hitting serverless timeouts
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = params;

    const story = await db.getStory(storyId);
    if (!story) {
      return NextResponse.json(
        { success: false, error: 'Story not found' },
        { status: 404 }
      );
    }

    // If story is already completed or failed, nothing to do
    if (story.status === 'completed' || story.status === 'failed') {
      return NextResponse.json({
        success: true,
        message: `Story is already ${story.status}`,
        done: true,
      });
    }

    // Get all shots and find one that needs processing
    const shots = await db.getShotsByStory(storyId);
    const incompleteShot = shots.find(s => s.final_status !== 'completed');

    if (incompleteShot) {
      // Process this one shot
      console.log(`[story] Processing shot ${incompleteShot.id}: ${incompleteShot.name}`);

      const result = await processOneShot(incompleteShot, story.story_type!);

      // Update progress
      const { progress, completedShots, totalShots } = await db.calculateProgress(storyId);
      await db.updateStory(storyId, { progress });

      return NextResponse.json({
        success: true,
        message: result.message,
        shotId: incompleteShot.id,
        shotName: incompleteShot.name,
        completedShots,
        totalShots,
        progress,
        done: false,
      });
    }

    // All shots are complete - finalize scenes and story
    console.log(`[story] All shots complete, finalizing story ${storyId}`);
    const result = await finalizeScenesAndStory(storyId);

    return NextResponse.json({
      success: true,
      message: result.message,
      finalVideoUrl: result.finalVideoUrl,
      done: result.done,
    });
  } catch (error) {
    console.error('[story] Continue processing error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = params;

    await db.deleteStory(storyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[story] Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete story' },
      { status: 500 }
    );
  }
}
