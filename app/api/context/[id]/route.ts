/**
 * Context Detail API
 *
 * DELETE /api/context/[id] - Delete a specific context
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteUserContext } from '@/lib/services/rag-service';

// ============================================
// DELETE - Delete context
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const contextId = params.id;

    // Delete the context
    const result = await deleteUserContext(contextId, userId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to delete context',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Context deleted successfully',
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
