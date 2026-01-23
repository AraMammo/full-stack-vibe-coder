/**
 * GET /api/v2/faceless-video/story-types
 * Returns available story types
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/services/faceless-video';

export async function GET() {
  try {
    const storyTypes = await db.getStoryTypes();

    return NextResponse.json({
      success: true,
      storyTypes: storyTypes.map(st => ({
        id: st.id,
        name: st.name,
        description: st.description,
        width: st.width,
        height: st.height,
        aspectRatio: st.aspect_ratio,
        captionsEnabled: st.captions_enabled,
      })),
    });
  } catch (error) {
    console.error('[story-types] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch story types' },
      { status: 500 }
    );
  }
}
