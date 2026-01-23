/**
 * GET /api/faceless-video/story-types
 * Returns available story types from Airtable
 */

import { NextResponse } from 'next/server';
import { facelessVideoAirtable } from '@/lib/services/faceless-video-airtable';

export async function GET() {
  try {
    const storyTypes = await facelessVideoAirtable.getStoryTypes();

    return NextResponse.json({
      success: true,
      storyTypes,
    });
  } catch (error) {
    console.error('Error fetching story types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch story types' },
      { status: 500 }
    );
  }
}
