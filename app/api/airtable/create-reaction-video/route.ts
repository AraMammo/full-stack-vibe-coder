import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { toolPurchases, toolSubmissions } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';

const REACTION_VIDEO_BASE_ID = 'appiai3ZRE5nMRrjx';
const REACTION_VIDEO_TABLE_ID = 'tbll7M3V5FVVgakz7';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const tiktokUrl = formData.get('tiktokUrl') as string;
    const styleId = formData.get('styleId') as string;
    const reactionVideoFile = formData.get('reactionVideo') as File | null;

    if (!email || !tiktokUrl || !styleId || !reactionVideoFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const purchases = await db
      .select()
      .from(toolPurchases)
      .where(
        and(
          eq(toolPurchases.email, email),
          eq(toolPurchases.toolName, 'reaction-video-generator'),
          eq(toolPurchases.status, 'active')
        )
      )
      .limit(1);

    if (purchases.length === 0) {
      return NextResponse.json(
        { error: 'No active access found. Please purchase access first.' },
        { status: 403 }
      );
    }

    const purchase = purchases[0];
    if (purchase.expiresAt) {
      const now = new Date();
      if (now > purchase.expiresAt) {
        return NextResponse.json(
          { error: 'Your access has expired. Please renew your subscription.' },
          { status: 403 }
        );
      }
    }

    const fileSize = reactionVideoFile.size;
    const maxSize = 500 * 1024 * 1024;
    
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 500MB limit' },
        { status: 400 }
      );
    }

    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${REACTION_VIDEO_BASE_ID}/${REACTION_VIDEO_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'TikTok Video URL': tiktokUrl,
            'Style': [styleId],
          },
        }),
      }
    );

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error('Airtable API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create Airtable record' },
        { status: 500 }
      );
    }

    const airtableData = await airtableResponse.json();
    const airtableRecordId = airtableData.id;

    const arrayBuffer = await reactionVideoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64File = buffer.toString('base64');

    const uploadResponse = await fetch(
      `https://content.airtable.com/v0/${REACTION_VIDEO_BASE_ID}/${airtableRecordId}/My%20Reaction%20Video/uploadAttachment`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: reactionVideoFile.type || 'video/mp4',
          file: base64File,
          filename: reactionVideoFile.name,
        }),
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Airtable upload error:', errorText);
      
      await fetch(
        `https://api.airtable.com/v0/${REACTION_VIDEO_BASE_ID}/${REACTION_VIDEO_TABLE_ID}/${airtableRecordId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
          },
        }
      );

      return NextResponse.json(
        { error: 'Failed to upload video. Please try with a smaller file (max 5MB).' },
        { status: 500 }
      );
    }

    const [submission] = await db.insert(toolSubmissions).values({
      email,
      toolName: 'reaction-video-generator',
      formData: JSON.stringify({
        tiktokUrl,
        styleId,
        fileName: reactionVideoFile.name,
        fileSize,
        airtableRecordId,
      }),
      makeWebhookTriggered: false,
    }).returning();

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      airtableRecordId,
    });

  } catch (error) {
    console.error('Error creating reaction video:', error);
    return NextResponse.json(
      { error: 'Failed to process video submission' },
      { status: 500 }
    );
  }
}
