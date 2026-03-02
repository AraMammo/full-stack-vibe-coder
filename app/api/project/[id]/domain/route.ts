/**
 * Custom Domain Management API
 *
 * POST /api/project/[id]/domain — Add custom domain via Vercel API
 * GET  /api/project/[id]/domain — Check domain verification status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import * as vercel from '@/lib/services/vercel-provisioning';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { deployedApp: true },
    });

    if (!project?.deployedApp?.vercelProjectId) {
      return NextResponse.json({ error: 'No deployed app found' }, { status: 404 });
    }

    // Add domain via Vercel
    const result = await vercel.addCustomDomain(
      project.deployedApp.vercelProjectId,
      domain
    );

    // Update deployed app record
    await prisma.deployedApp.update({
      where: { id: project.deployedApp.id },
      data: {
        customDomain: domain,
        domainVerified: result.configured,
      },
    });

    return NextResponse.json({
      domain,
      configured: result.configured,
      verification: result.verification,
    });
  } catch (error: any) {
    console.error('[Domain API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add domain' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { deployedApp: true },
    });

    if (!project?.deployedApp?.vercelProjectId || !project.deployedApp.customDomain) {
      return NextResponse.json({ error: 'No domain configured' }, { status: 404 });
    }

    const status = await vercel.checkDomainStatus(
      project.deployedApp.vercelProjectId,
      project.deployedApp.customDomain
    );

    // Update verification status
    if (status.verified !== project.deployedApp.domainVerified) {
      await prisma.deployedApp.update({
        where: { id: project.deployedApp.id },
        data: { domainVerified: status.verified },
      });
    }

    return NextResponse.json({
      domain: project.deployedApp.customDomain,
      verified: status.verified,
      dnsRecords: status.dnsRecords,
    });
  } catch (error: any) {
    console.error('[Domain API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check domain' },
      { status: 500 }
    );
  }
}
