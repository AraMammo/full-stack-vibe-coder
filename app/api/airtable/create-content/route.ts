import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/server/db';
import { toolSubmissions } from '@/shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const contentType = formData.get('contentType') as 'text' | 'link' | 'audio';
    const content = formData.get('content') as string;
    const audioFile = formData.get('audio') as File | null;
    const transformationActionsStr = formData.get('transformationActions') as string;
    
    if (!email || !contentType || !transformationActionsStr) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let transformationActions: string[];
    try {
      const parsed = JSON.parse(transformationActionsStr);
      if (!Array.isArray(parsed)) {
        return NextResponse.json(
          { error: 'transformationActions must be an array' },
          { status: 400 }
        );
      }
      transformationActions = parsed;
    } catch {
      return NextResponse.json(
        { error: 'Invalid transformationActions JSON format' },
        { status: 400 }
      );
    }

    if (!Array.isArray(transformationActions) || transformationActions.length === 0) {
      return NextResponse.json(
        { error: 'At least one transformation action must be selected' },
        { status: 400 }
      );
    }

    let ideaText = '';
    let sourceType = '';

    if (contentType === 'audio') {
      if (!audioFile) {
        return NextResponse.json(
          { error: 'Audio file is required for audio content type' },
          { status: 400 }
        );
      }

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
      });

      ideaText = transcription.text;
      sourceType = 'Audio';
    } else if (contentType === 'link') {
      if (!content) {
        return NextResponse.json(
          { error: 'Link is required for link content type' },
          { status: 400 }
        );
      }

      ideaText = content;
      
      if (content.includes('youtube.com') || content.includes('youtu.be')) {
        sourceType = 'YouTube';
      } else if (content.includes('tiktok.com')) {
        sourceType = 'TikTok';
      } else {
        sourceType = 'YouTube';
      }
    } else if (contentType === 'text') {
      if (!content) {
        return NextResponse.json(
          { error: 'Text content is required for text content type' },
          { status: 400 }
        );
      }

      ideaText = content;
      sourceType = 'Text';
    }

    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_CONTENT_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'Idea': ideaText,
            'Source Type': sourceType,
            'Transformation Actions': transformationActions,
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

    // Validate Airtable response has expected structure
    if (!airtableData || typeof airtableData.id !== 'string') {
      console.error('Invalid Airtable response structure:', airtableData);
      return NextResponse.json(
        { error: 'Invalid response from Airtable - missing record ID' },
        { status: 500 }
      );
    }

    const airtableRecordId = airtableData.id;

    const [submission] = await db.insert(toolSubmissions).values({
      email,
      toolName: 'substack-engine',
      formData: JSON.stringify({
        contentType,
        content: ideaText,
        sourceType,
        transformationActions,
        airtableRecordId,
      }),
      makeWebhookTriggered: false,
    }).returning();

    // Validate submission was created
    if (!submission?.id) {
      console.error('Failed to create submission record');
      return NextResponse.json(
        { error: 'Failed to save submission to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      airtableRecordId,
    });

  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { error: 'Failed to process content submission' },
      { status: 500 }
    );
  }
}
