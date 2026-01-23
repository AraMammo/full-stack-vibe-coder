/**
 * POST /api/v2/faceless-video/stories - Create a new story and start processing
 * GET /api/v2/faceless-video/stories - List user's stories
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, processStory } from '@/lib/services/faceless-video';

export async function POST(request: NextRequest) {
  try {
    // Get user session (optional - can work without auth for testing)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const body = await request.json();
    const { name, storyTypeId, sourceContent, sourceType = 'text' } = body;

    // Validate required fields
    if (!name || !storyTypeId || !sourceContent) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, storyTypeId, sourceContent' },
        { status: 400 }
      );
    }

    // Create the story
    const story = await db.createStory({
      name,
      story_type_id: storyTypeId,
      source_content: sourceContent,
      source_type: sourceType,
      user_id: userId,
    });

    console.log(`[stories] Created story ${story.id}: ${name}`);

    // Start processing in background (don't await)
    processStory(story.id).catch(error => {
      console.error(`[stories] Background processing failed for ${story.id}:`, error);
    });

    return NextResponse.json({
      success: true,
      story: {
        id: story.id,
        name: story.name,
        status: story.status,
        progress: story.progress,
        createdAt: story.created_at,
      },
    });
  } catch (error) {
    console.error('[stories] Create error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create story' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const stories = await db.getStoriesByUser(userId);

    return NextResponse.json({
      success: true,
      stories: stories.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        progress: s.progress,
        totalScenes: s.total_scenes,
        totalShots: s.total_shots,
        finalVideoUrl: s.final_video_url,
        finalVideoCaptionedUrl: s.final_video_captioned_url,
        createdAt: s.created_at,
        completedAt: s.completed_at,
        storyType: s.story_type ? { name: s.story_type.name } : null,
      })),
    });
  } catch (error) {
    console.error('[stories] List error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}
