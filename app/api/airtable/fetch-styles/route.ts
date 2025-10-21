import { NextRequest, NextResponse } from 'next/server';

const REACTION_VIDEO_BASE_ID = 'appiai3ZRE5nMRrjx';

export async function GET(request: NextRequest) {
  try {
    const metadataResponse = await fetch(
      `https://api.airtable.com/v0/meta/bases/${REACTION_VIDEO_BASE_ID}/tables`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
        },
      }
    );

    if (!metadataResponse.ok) {
      console.error('Failed to fetch base metadata');
      return NextResponse.json(
        { error: 'Failed to fetch styles metadata' },
        { status: 500 }
      );
    }

    const metadata = await metadataResponse.json();
    const stylesTable = metadata.tables.find(
      (table: any) => table.name === 'Styles'
    );

    if (!stylesTable) {
      console.error('Styles table not found in base');
      return NextResponse.json(
        { error: 'Styles table not found' },
        { status: 404 }
      );
    }

    const stylesResponse = await fetch(
      `https://api.airtable.com/v0/${REACTION_VIDEO_BASE_ID}/${stylesTable.id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
        },
      }
    );

    if (!stylesResponse.ok) {
      console.error('Failed to fetch styles from Airtable');
      return NextResponse.json(
        { error: 'Failed to fetch styles' },
        { status: 500 }
      );
    }

    const stylesData = await stylesResponse.json();

    const styles = stylesData.records.map((record: any) => ({
      id: record.id,
      name: record.fields.Name || record.fields.Style || 'Unnamed Style',
    }));

    return NextResponse.json({ styles });
  } catch (error) {
    console.error('Error fetching styles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch styles' },
      { status: 500 }
    );
  }
}
