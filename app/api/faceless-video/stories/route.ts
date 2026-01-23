/**
 * GET /api/faceless-video/stories
 * Returns user's stories from Airtable
 *
 * POST /api/faceless-video/stories
 * Creates a new story in Airtable
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { facelessVideoAirtable } from '@/lib/services/faceless-video-airtable';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const stories = await facelessVideoAirtable.getStories({
      activeOnly,
      limit,
    });

    return NextResponse.json({
      success: true,
      stories,
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { storyName, storyTypeId, source } = body;

    // Validation
    if (!storyName || typeof storyName !== 'string' || storyName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Story name is required' },
        { status: 400 }
      );
    }

    if (!storyTypeId || typeof storyTypeId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Story type is required' },
        { status: 400 }
      );
    }

    if (!source || typeof source !== 'string' || source.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Source content is required' },
        { status: 400 }
      );
    }

    // Create story in Airtable
    const result = await facelessVideoAirtable.createStory({
      storyName: storyName.trim(),
      storyTypeId,
      source: source.trim(),
      userEmail: session.user.email,
    });

    return NextResponse.json({
      success: true,
      storyId: result.storyId,
      message: 'Story created and processing started',
    });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create story' },
      { status: 500 }
    );
  }
}
