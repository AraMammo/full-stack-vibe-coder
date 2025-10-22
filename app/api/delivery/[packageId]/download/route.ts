/**
 * API Route: Download Delivery Package
 *
 * GET /api/delivery/[packageId]/download
 * Serves the ZIP file for a delivery package
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDeliveryPackage, regeneratePackageURL } from '@/lib/delivery/package-biab-deliverables';

// ============================================
// GET HANDLER
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: { packageId: string } }
) {
  try {
    const packageId = params.packageId;

    console.log(`[API] Download request for package: ${packageId}`);

    // Get package from database
    const pkg = await getDeliveryPackage(packageId);

    if (!pkg) {
      return NextResponse.json(
        {
          success: false,
          error: 'Package not found',
        },
        { status: 404 }
      );
    }

    // Check if package has expired
    const now = new Date();
    if (pkg.expiresAt < now) {
      console.log(`[API] Package expired, regenerating URL...`);

      // Regenerate signed URL
      const newUrl = await regeneratePackageURL(packageId);

      if (!newUrl) {
        return NextResponse.json(
          {
            success: false,
            error: 'Package has expired and could not be regenerated',
          },
          { status: 410 }
        );
      }

      // Redirect to new signed URL
      return NextResponse.redirect(newUrl);
    }

    // Redirect to signed URL
    console.log(`[API] Redirecting to download URL`);
    return NextResponse.redirect(pkg.downloadUrl);

  } catch (error) {
    console.error('[API] Download error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// HEAD HANDLER (Check package status)
// ============================================

export async function HEAD(
  request: NextRequest,
  { params }: { params: { packageId: string } }
) {
  try {
    const packageId = params.packageId;

    // Get package from database
    const pkg = await getDeliveryPackage(packageId);

    if (!pkg) {
      return new NextResponse(null, { status: 404 });
    }

    // Check if expired
    const now = new Date();
    if (pkg.expiresAt < now) {
      return new NextResponse(null, { status: 410 }); // Gone
    }

    // Return headers with package info
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': pkg.fileSize.toString(),
        'X-Expires-At': pkg.expiresAt.toISOString(),
        'X-Created-At': pkg.createdAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('[API] HEAD error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
