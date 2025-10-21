import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/server/db';
import { chatSubmissions } from '@/shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, inputType = 'text' } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
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
          content: `You are a helpful assistant for Full Stack Vibe Coders agency. Based on user input, recommend ONE of these products:

1. "branding" - Complete Branding Package ($567, 67-hour delivery OR $1,134 24-hour rush)
   - Use for: New businesses, side hustlers, anyone needing professional brand identity
   - Includes: Logo, colors, fonts, brand guidelines, social media assets
   - Perfect for: "I need a logo", "starting a business", "need to look professional"

2. "tools" - Pre-built Content Automation Tools (Substack Engine $297/mo, Reaction Video Generator $197/mo)
   - Use for: Content creators, marketers, anyone doing repetitive content work
   - Perfect for: "automate social media", "content creation", "posting content"

3. "automation" - Custom Automation Solutions (Case studies available)
   - Use for: Existing businesses with manual processes, data entry, workflow bottlenecks
   - Perfect for: "too much manual work", "drowning in spreadsheets", "data entry"

Respond in this EXACT JSON format:
{
  "product": "branding" | "tools" | "automation",
  "message": "A friendly 1-2 sentence recommendation explaining why this fits their need"
}`
        },
        {
          role: 'user',
          content: text
        }
      ],
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    const recommendedProduct = response.product;
    const recommendationMessage = response.message;

    return NextResponse.json({
      recommendation: recommendationMessage,
      recommendedProduct,
    });

  } catch (error) {
    console.error('Error processing chat submission:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}
