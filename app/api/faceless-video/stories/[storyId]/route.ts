/**
 * GET /api/faceless-video/stories/[storyId]
 * Returns story details and progress
 *
 * PATCH /api/faceless-video/stories/[storyId]
 * Updates story (approve, archive, etc.)
 *
 * DELETE /api/faceless-video/stories/[storyId]
 * Archives a story
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { facelessVideoAirtable } from '@/lib/services/faceless-video-airtable';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { storyId } = await params;

    const progress = await facelessVideoAirtable.getStoryProgress(storyId);

    if (!progress) {
      return NextResponse.json(
        { success: false, error: 'Story not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...progress,
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch story' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { storyId } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'approve') {
      await facelessVideoAirtable.approveStory(storyId);
      return NextResponse.json({
        success: true,
        message: 'Story approved',
      });
    }

    if (action === 'archive') {
      await facelessVideoAirtable.archiveStory(storyId);
      return NextResponse.json({
        success: true,
        message: 'Story archived',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update story' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { storyId } = await params;

    await facelessVideoAirtable.archiveStory(storyId);

    return NextResponse.json({
      success: true,
      message: 'Story archived',
    });
  } catch (error) {
    console.error('Error archiving story:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive story' },
      { status: 500 }
    );
  }
}
