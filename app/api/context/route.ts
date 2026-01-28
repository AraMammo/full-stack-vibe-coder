/**
 * Context Management API
 *
 * GET /api/context - List user's contexts
 * Retrieves all uploaded contexts for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserContexts, getContextStats } from '@/lib/services/rag-service';

// ============================================
// GET - List contexts
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeStats = searchParams.get('stats') === 'true';

    // Get user's contexts
    const contexts = await getUserContexts(userId);

    // Optionally include statistics
    let stats = undefined;
    if (includeStats) {
      stats = await getContextStats(userId);
    }

    return NextResponse.json({
      success: true,
      data: {
        contexts,
        stats,
      },
    });

  } catch (error: any) {
    console.error('[Context API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
