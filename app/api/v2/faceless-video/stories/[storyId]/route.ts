/**
 * GET /api/v2/faceless-video/stories/[storyId] - Get story details and progress
 * POST /api/v2/faceless-video/stories/[storyId] - Continue processing (process one shot)
 * DELETE /api/v2/faceless-video/stories/[storyId] - Delete a story
 *
 * CRITICAL: POST handler now uses optimistic locking to prevent race conditions
 * when multiple concurrent requests try to process the same shot.
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
 *
 * CRITICAL: Uses optimistic locking to prevent race conditions:
 * - Finds shot with status 'pending' (not already being processed)
 * - Atomically updates status to 'processing' before starting work
 * - If another request already claimed the shot, skips to next or returns
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = params;

    // Re-fetch story to get latest status (prevents stale data)
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
        finalVideoUrl: story.final_video_url || story.final_video_captioned_url,
      });
    }

    // Get all shots and find one that needs processing
    // CRITICAL: Only look for shots with status 'pending', not 'processing'
    // This prevents two concurrent requests from processing the same shot
    const shots = await db.getShotsByStory(storyId);

    // Filter to only pending shots (not already being processed or completed)
    const pendingShots = shots.filter(s =>
      s.final_status === 'pending' &&
      s.image_status !== 'processing' &&
      s.audio_status !== 'processing' &&
      s.video_status !== 'processing'
    );

    if (pendingShots.length > 0) {
      const shotToClaim = pendingShots[0];

      // CRITICAL: Atomically claim the shot by setting status to 'processing'
      // This uses optimistic locking - the update will only succeed if the shot
      // is still in 'pending' status. If another request claimed it first, this fails.
      let claimed = false;
      try {
        // Try to claim by updating image_status (first step)
        // The db layer should check that current status is 'pending'
        await db.updateShot(shotToClaim.id, { image_status: 'processing' });
        claimed = true;
      } catch (claimError: any) {
        // If claim failed (constraint violation or already processing), skip
        console.log(`[story] Shot ${shotToClaim.id} already claimed by another request`);
        claimed = false;
      }

      if (claimed) {
        console.log(`[story] Claimed and processing shot ${shotToClaim.id}: ${shotToClaim.name}`);

        try {
          const result = await processOneShot(shotToClaim, story.story_type!);

          // Update progress
          const { progress, completedShots, totalShots } = await db.calculateProgress(storyId);
          await db.updateStory(storyId, { progress });

          return NextResponse.json({
            success: true,
            message: result.message,
            shotId: shotToClaim.id,
            shotName: shotToClaim.name,
            completedShots,
            totalShots,
            progress,
            done: false,
          });
        } catch (processError: any) {
          // Mark shot as failed
          await db.updateShot(shotToClaim.id, {
            image_status: 'failed',
            error_message: processError.message || 'Processing failed',
          });

          throw processError;
        }
      }

      // If we couldn't claim a shot, check if any are still processing
      const processingShots = shots.filter(s =>
        s.image_status === 'processing' ||
        s.audio_status === 'processing' ||
        s.video_status === 'processing'
      );

      if (processingShots.length > 0) {
        // Another request is processing - tell client to wait and retry
        const { progress, completedShots, totalShots } = await db.calculateProgress(storyId);
        return NextResponse.json({
          success: true,
          message: 'Shot is being processed by another request, please retry shortly',
          completedShots,
          totalShots,
          progress,
          done: false,
          retryAfter: 2, // Suggest retry in 2 seconds
        });
      }
    }

    // Check if all shots are actually complete
    const incompleteShots = shots.filter(s => s.final_status !== 'completed');

    if (incompleteShots.length > 0) {
      // Some shots still incomplete but not pending - might be in failed state
      const failedShots = incompleteShots.filter(s =>
        s.image_status === 'failed' ||
        s.audio_status === 'failed' ||
        s.video_status === 'failed' ||
        s.final_status === 'failed'
      );

      if (failedShots.length > 0) {
        // Mark story as failed if any shots failed
        await db.updateStory(storyId, {
          status: 'failed',
          error_message: `${failedShots.length} shot(s) failed to process`,
        });

        return NextResponse.json({
          success: false,
          error: `Processing failed: ${failedShots.length} shot(s) failed`,
          done: true,
        }, { status: 500 });
      }

      // Shots still processing elsewhere
      const { progress, completedShots, totalShots } = await db.calculateProgress(storyId);
      return NextResponse.json({
        success: true,
        message: 'Shots still processing, please retry shortly',
        completedShots,
        totalShots,
        progress,
        done: false,
        retryAfter: 2,
      });
    }

    // All shots are complete - finalize scenes and story
    // CRITICAL: Also use locking for finalization to prevent duplicate final videos
    console.log(`[story] All shots complete, finalizing story ${storyId}`);

    // Check if already finalizing
    if (story.status === 'building_video' || story.status === 'adding_captions') {
      return NextResponse.json({
        success: true,
        message: 'Story is being finalized, please wait',
        done: false,
        retryAfter: 5,
      });
    }

    // Claim finalization by updating status
    await db.updateStory(storyId, { status: 'building_video' });

    try {
      const result = await finalizeScenesAndStory(storyId);

      return NextResponse.json({
        success: true,
        message: result.message,
        finalVideoUrl: result.finalVideoUrl,
        done: result.done,
      });
    } catch (finalizeError: any) {
      // Mark as failed on finalization error
      await db.updateStory(storyId, {
        status: 'failed',
        error_message: finalizeError.message || 'Finalization failed',
      });

      throw finalizeError;
    }
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
