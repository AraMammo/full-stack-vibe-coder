/**
 * Faceless Video Generator - Airtable Service
 *
 * Integrates with the Faceless Video Airtable base to create stories
 * and track progress through the automation pipeline.
 */

const BASE_ID = process.env.FACELESS_VIDEO_AIRTABLE_BASE_ID;
const PAT = process.env.FACELESS_VIDEO_AIRTABLE_PAT;
const STORIES_TABLE = process.env.FACELESS_VIDEO_STORIES_TABLE || 'tblnjMCq6sCjWVWaP';
const SCENES_TABLE = process.env.FACELESS_VIDEO_SCENES_TABLE || 'tblE5VV3HYdNSVkjv';
const SHOTS_TABLE = process.env.FACELESS_VIDEO_SHOTS_TABLE || 'tblEX1h61Zxas1oaY';
const STORY_TYPES_TABLE = process.env.FACELESS_VIDEO_STORY_TYPES_TABLE || 'tblhUWZoPufYsvu9G';

const AIRTABLE_API = 'https://api.airtable.com/v0';

// Types
export interface StoryType {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  active: boolean;
  hasCaptions: boolean;
}

export interface Story {
  id: string;
  storyName: string;
  source: string;
  story: string | null;
  storyStatus: string;
  approved: boolean;
  ready: boolean;
  numScenes: number;
  numShots: number;
  finalVideo: string | null;
  finalCut: string | null;
  srt: string | null;
  created: string;
  lastModified: string;
}

export interface Scene {
  id: string;
  sceneName: string;
  storyId: string;
  sort: number;
  shotsReady: boolean;
  finalScene: string | null;
  numShots: number;
}

export interface Shot {
  id: string;
  shotName: string;
  sceneId: string;
  sort: number;
  imagePrompt: string;
  image: string | null;
  audio: string | null;
  video: string | null;
  finalShot: string | null;
  ready: boolean;
}

export interface StoryProgress {
  storyId: string;
  storyName: string;
  status: 'queued' | 'generating_story' | 'generating_scenes' | 'generating_media' | 'building_video' | 'adding_captions' | 'complete' | 'error';
  storyGenerated: boolean;
  storyApproved: boolean;
  totalScenes: number;
  totalShots: number;
  scenesComplete: number;
  shotsWithImages: number;
  shotsWithAudio: number;
  shotsWithVideo: number;
  shotsComplete: number;
  finalVideo: string | null;
  finalCut: string | null;
  srt: string | null;
  error: string | null;
  created: string;
  lastModified: string;
}

class FacelessVideoAirtableClient {
  private async fetch(endpoint: string, options: RequestInit = {}) {
    if (!PAT) {
      throw new Error('FACELESS_VIDEO_AIRTABLE_PAT is not configured');
    }
    if (!BASE_ID) {
      throw new Error('FACELESS_VIDEO_AIRTABLE_BASE_ID is not configured');
    }

    const url = `${AIRTABLE_API}/${BASE_ID}/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Airtable API error (${response.status}):`, errorText);
      throw new Error(`Airtable API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all active story types
   */
  async getStoryTypes(): Promise<StoryType[]> {
    const params = new URLSearchParams({
      'filterByFormula': '{Active}=TRUE()',
      'fields[]': 'Story Type',
    });
    // Add additional fields
    ['Width', 'Height', 'Aspect Ratio', 'Captions', 'Active'].forEach(f => {
      params.append('fields[]', f);
    });

    const data = await this.fetch(`${STORY_TYPES_TABLE}?${params.toString()}`);

    return data.records.map((record: any) => ({
      id: record.id,
      name: record.fields['Story Type'] || 'Unnamed',
      width: record.fields['Width'] || 1080,
      height: record.fields['Height'] || 1920,
      aspectRatio: record.fields['Aspect Ratio'] || '9:16',
      active: record.fields['Active'] || false,
      hasCaptions: record.fields['Captions'] || false,
    }));
  }

  /**
   * Create a new story
   */
  async createStory(params: {
    storyName: string;
    storyTypeId: string;
    source: string;
    userEmail: string;
  }): Promise<{ storyId: string }> {
    const data = await this.fetch(STORIES_TABLE, {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          'Story Name': params.storyName,
          'Story Type': [params.storyTypeId],
          'Source': params.source,
          'Active Story': true,
          'Approve Source': true, // Trigger the automation
        },
      }),
    });

    return { storyId: data.id };
  }

  /**
   * Get a story by ID
   */
  async getStory(storyId: string): Promise<Story | null> {
    try {
      const data = await this.fetch(`${STORIES_TABLE}/${storyId}`);

      return {
        id: data.id,
        storyName: data.fields['Story Name'] || '',
        source: data.fields['Source'] || '',
        story: data.fields['Story'] || null,
        storyStatus: data.fields['Story Status'] || 'Unknown',
        approved: data.fields['Approved'] || false,
        ready: data.fields['Ready?'] || false,
        numScenes: data.fields['# Scenes'] || 0,
        numShots: data.fields['# Shots'] || 0,
        finalVideo: this.extractFirstAttachment(data.fields['Final Story']),
        finalCut: this.extractFirstAttachment(data.fields['Final Cut']),
        srt: data.fields['SRT'] || null,
        created: data.fields['Created'] || '',
        lastModified: data.fields['Last Modified'] || '',
      };
    } catch (error) {
      console.error('Error fetching story:', error);
      return null;
    }
  }

  /**
   * Get detailed progress for a story
   */
  async getStoryProgress(storyId: string): Promise<StoryProgress | null> {
    try {
      // Get story
      const story = await this.getStory(storyId);
      if (!story) return null;

      // Get scenes for this story
      const scenesParams = new URLSearchParams({
        'filterByFormula': `FIND("${storyId}", {Record ID (from Story)})`,
      });
      const scenesData = await this.fetch(`${SCENES_TABLE}?${scenesParams.toString()}`);
      const scenes = scenesData.records || [];

      // Get shots for this story
      const shotsParams = new URLSearchParams({
        'filterByFormula': `FIND("${storyId}", {Record ID (from Story)})`,
      });
      const shotsData = await this.fetch(`${SHOTS_TABLE}?${shotsParams.toString()}`);
      const shots = shotsData.records || [];

      // Calculate progress
      const shotsWithImages = shots.filter((s: any) =>
        s.fields['Image'] && s.fields['Image'].length > 0
      ).length;
      const shotsWithAudio = shots.filter((s: any) =>
        s.fields['Audio'] && s.fields['Audio'].length > 0
      ).length;
      const shotsWithVideo = shots.filter((s: any) =>
        s.fields['Video'] && s.fields['Video'].length > 0
      ).length;
      const shotsComplete = shots.filter((s: any) =>
        s.fields['Final Shot'] && s.fields['Final Shot'].length > 0
      ).length;
      const scenesComplete = scenes.filter((s: any) =>
        s.fields['Final Scene'] && s.fields['Final Scene'].length > 0
      ).length;

      // Determine status
      let status: StoryProgress['status'] = 'queued';
      if (story.finalCut || story.finalVideo) {
        status = 'complete';
      } else if (scenesComplete > 0 && scenesComplete === scenes.length) {
        status = 'adding_captions';
      } else if (shotsComplete > 0) {
        status = 'building_video';
      } else if (shotsWithImages > 0 || shotsWithAudio > 0) {
        status = 'generating_media';
      } else if (shots.length > 0) {
        status = 'generating_scenes';
      } else if (story.story) {
        status = 'generating_scenes';
      } else if (story.source) {
        status = 'generating_story';
      }

      return {
        storyId: story.id,
        storyName: story.storyName,
        status,
        storyGenerated: !!story.story,
        storyApproved: story.approved,
        totalScenes: scenes.length,
        totalShots: shots.length,
        scenesComplete,
        shotsWithImages,
        shotsWithAudio,
        shotsWithVideo,
        shotsComplete,
        finalVideo: story.finalVideo,
        finalCut: story.finalCut,
        srt: story.srt,
        error: null,
        created: story.created,
        lastModified: story.lastModified,
      };
    } catch (error) {
      console.error('Error fetching story progress:', error);
      return null;
    }
  }

  /**
   * Get all stories for display (optionally filtered)
   */
  async getStories(options: {
    activeOnly?: boolean;
    limit?: number;
  } = {}): Promise<Story[]> {
    const params = new URLSearchParams();

    if (options.activeOnly) {
      params.set('filterByFormula', '{Active Story}=TRUE()');
    }
    if (options.limit) {
      params.set('maxRecords', options.limit.toString());
    }
    params.set('sort[0][field]', 'Created');
    params.set('sort[0][direction]', 'desc');

    const data = await this.fetch(`${STORIES_TABLE}?${params.toString()}`);

    return data.records.map((record: any) => ({
      id: record.id,
      storyName: record.fields['Story Name'] || '',
      source: record.fields['Source'] || '',
      story: record.fields['Story'] || null,
      storyStatus: record.fields['Story Status'] || 'Unknown',
      approved: record.fields['Approved'] || false,
      ready: record.fields['Ready?'] || false,
      numScenes: record.fields['# Scenes'] || 0,
      numShots: record.fields['# Shots'] || 0,
      finalVideo: this.extractFirstAttachment(record.fields['Final Story']),
      finalCut: this.extractFirstAttachment(record.fields['Final Cut']),
      srt: record.fields['SRT'] || null,
      created: record.fields['Created'] || '',
      lastModified: record.fields['Last Modified'] || '',
    }));
  }

  /**
   * Approve story to continue processing
   */
  async approveStory(storyId: string): Promise<void> {
    await this.fetch(`${STORIES_TABLE}/${storyId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: {
          'Approve Story': true,
        },
      }),
    });
  }

  /**
   * Archive/delete a story
   */
  async archiveStory(storyId: string): Promise<void> {
    await this.fetch(`${STORIES_TABLE}/${storyId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: {
          'Archived': true,
          'Active Story': false,
        },
      }),
    });
  }

  private extractFirstAttachment(field: any): string | null {
    if (!field || !Array.isArray(field) || field.length === 0) {
      return null;
    }
    // Could be lookup value (array of objects with url) or direct attachment
    const first = field[0];
    if (typeof first === 'string') {
      return first;
    }
    if (first && first.url) {
      return first.url;
    }
    return null;
  }
}

// Export singleton
export const facelessVideoAirtable = new FacelessVideoAirtableClient();
