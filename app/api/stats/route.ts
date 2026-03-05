/**
 * Public stats endpoint
 * Returns aggregate counts for social proof
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const projectsDeployed = await prisma.project.count({
      where: { status: 'COMPLETED' },
    });

    return NextResponse.json({ projectsDeployed });
  } catch {
    return NextResponse.json({ projectsDeployed: 0 });
  }
}
