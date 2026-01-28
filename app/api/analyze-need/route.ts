import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/server/db';
import { chatSubmissions } from '@/shared/schema';
import { checkRateLimit, getClientIP, rateLimiters } from '@/lib/rate-limit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Max text length to prevent abuse
const MAX_TEXT_LENGTH = 5000;

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request.headers);
    const rateLimitResult = checkRateLimit(clientIP, rateLimiters.aiOperation);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const body = await request.json();
    const { text, inputType = 'text' } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Validate text length
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (inputType !== 'text' && inputType !== 'voice') {
      return NextResponse.json(
        { error: 'Invalid input type' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a business idea analyzer for Business in a Box. Generate a quick taste of what we can create. Based on the user's business idea:

1. Identify the core business concept
2. Suggest a catchy business name (1-2 options)
3. Create a compelling one-sentence value proposition
4. Identify the target audience
5. List 2-3 key features/offerings

Keep it punchy, exciting, and actionable. Show them what's possible in under 30 minutes with our full system.

Respond in this EXACT JSON format:
{
  "businessName": "Suggested business name",
  "valueProposition": "One powerful sentence describing what the business does and for whom",
  "targetAudience": "Who this serves",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
  "message": "An enthusiastic 2-3 sentence message showing them what you just created and inviting them to get the full package"
}`
        },
        {
          role: 'user',
          content: text
        }
      ],
      response_format: { type: 'json_object' }
    });

    // Safely access OpenAI response with null checks
    const messageContent = completion.choices?.[0]?.message?.content;
    if (!messageContent) {
      console.error('OpenAI returned empty response');
      return NextResponse.json(
        { error: 'Failed to generate analysis - empty response from AI' },
        { status: 500 }
      );
    }

    let response: Record<string, unknown>;
    try {
      response = JSON.parse(messageContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Validate required fields exist
    const businessName = typeof response.businessName === 'string' ? response.businessName : 'Your Business';
    const valueProposition = typeof response.valueProposition === 'string' ? response.valueProposition : '';
    const targetAudience = typeof response.targetAudience === 'string' ? response.targetAudience : '';
    const keyFeatures = Array.isArray(response.keyFeatures) ? response.keyFeatures : [];
    const message = typeof response.message === 'string' ? response.message : 'Check out what we created for you!';

    return NextResponse.json({
      recommendation: message,
      recommendedProduct: "biab",
      businessName,
      valueProposition,
      targetAudience,
      keyFeatures,
    });

  } catch (error) {
    console.error('Error processing chat submission:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}
