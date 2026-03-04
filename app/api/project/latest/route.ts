/**
 * Latest Project API
 *
 * GET /api/project/latest
 * Returns the user's most recent project. Used by DashboardEmptyState
 * to detect when a webhook has created a project after payment.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      projectName: true,
      status: true,
      createdAt: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'No projects found' }, { status: 404 });
  }

  return NextResponse.json(project);
}
