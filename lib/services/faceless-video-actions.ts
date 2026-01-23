/**
 * Faceless Video Generator - Action Handlers
 *
 * Replaces Make.com scenarios with our own API handlers.
 * Each action is triggered by Airtable automations via webhook.
 */

import OpenAI from 'openai';

const AIRTABLE_BASE_ID = process.env.FACELESS_VIDEO_AIRTABLE_BASE_ID!;
const AIRTABLE_PAT = process.env.FACELESS_VIDEO_AIRTABLE_PAT!;
const AIRTABLE_API = 'https://api.airtable.com/v0';

// Table IDs
const TABLES = {
  STORIES: process.env.FACELESS_VIDEO_STORIES_TABLE || 'tblnjMCq6sCjWVWaP',
  SCENES: process.env.FACELESS_VIDEO_SCENES_TABLE || 'tblE5VV3HYdNSVkjv',
  SHOTS: process.env.FACELESS_VIDEO_SHOTS_TABLE || 'tblEX1h61Zxas1oaY',
  FILES: 'tblwnaoDiahBVJEzd',
  LOG: 'tbl4i2bLKhLsLEm7t',
};

// Action IDs (from Airtable Actions table)
export const ACTION_IDS = {
  MANUAL: '1',
  GENERATE_STORY: '18',
  ADD_SCENES_SHOTS: '16',
  GENERATE_IMAGE_OPENAI: '17',
  GENERATE_IMAGE_LEONARDO: '20',
  GENERATE_IMAGE_FLUX: '7',
  GENERATE_IMAGE_MJ: '6',
  UPSCALE_IMAGE_MJ: '2',
  GENERATE_VOICEOVER_11LABS: '4',
  GENERATE_VIDEO_NCA: '24',
  GENERATE_VIDEO_LUMA: '14',
  GENERATE_VIDEO_LUMA_GOAPI: '3',
  GENERATE_VIDEO_KLING: '8',
  GENERATE_VIDEO_LEONARDO: '22',
  SHOTS_MIX_AUDIO_VIDEO: '9',
  COMBINE_SHOTS: '10',
  COMBINE_SCENES: '11',
  SCENE_MIX_AUDIO_VIDEO: '12',
  STORY_MIX_AUDIO_VIDEO: '13',
  GET_TRANSCRIPTION: '23',
  ADD_CAPTIONS: '19',
};

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// Airtable Helpers
// ============================================

async function airtableFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${AIRTABLE_API}/${AIRTABLE_BASE_ID}/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_PAT}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Airtable error (${response.status}):`, error);
    throw new Error(`Airtable API error: ${response.status}`);
  }

  return response.json();
}

async function getRecord(tableId: string, recordId: string) {
  return airtableFetch(`${tableId}/${recordId}`);
}

async function updateRecord(tableId: string, recordId: string, fields: Record<string, any>) {
  return airtableFetch(`${tableId}/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
}

async function createRecord(tableId: string, fields: Record<string, any>) {
  return airtableFetch(tableId, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
}

async function createRecords(tableId: string, records: Array<{ fields: Record<string, any> }>) {
  return airtableFetch(tableId, {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}

// ============================================
// FFMPEG Worker Service Integration
// ============================================

const FFMPEG_WORKER_URL = process.env.FFMPEG_WORKER_URL || 'http://localhost:3001';

async function callFFMPEGWorker(endpoint: string, body: Record<string, any>): Promise<any> {
  const response = await fetch(`${FFMPEG_WORKER_URL}/api/video/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `FFMPEG Worker error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// Action: Generate Story (aid=18)
// ============================================

export async function generateStory(recordId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[generateStory] Starting for record ${recordId}`);

  try {
    // Get the story record
    const record = await getRecord(TABLES.STORIES, recordId);
    const fields = record.fields;

    const source = fields['Source'];
    const systemPrompt = fields['Story Prompt (System Prompt)']?.[0] ||
      "You're an expert storyteller and script writer.";
    const userPrompt = fields['Story Prompt (User Prompt)']?.[0] ||
      "Rewrite the story above into a captivating 200 word narrative.";

    if (!source) {
      throw new Error('No source content found');
    }

    console.log(`[generateStory] Calling OpenAI with source length: ${source.length}`);

    // Call OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${source}\n\n${userPrompt}` },
      ],
      max_tokens: 2000,
    });

    const story = completion.choices[0]?.message?.content;

    if (!story) {
      throw new Error('No story generated');
    }

    console.log(`[generateStory] Generated story length: ${story.length}`);

    // Update the record with the generated story
    await updateRecord(TABLES.STORIES, recordId, {
      'Story': story,
    });

    console.log(`[generateStory] Updated record ${recordId}`);

    return { success: true };
  } catch (error) {
    console.error('[generateStory] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================
// Action: Add Scenes/Shots (aid=16)
// ============================================

interface SceneData {
  scene: {
    script: string;
    name: string;
  };
}

interface ShotData {
  shot: {
    script: string;
    name: string;
  };
}

export async function addScenesShots(recordId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[addScenesShots] Starting for record ${recordId}`);

  try {
    // Get the story record
    const record = await getRecord(TABLES.STORIES, recordId);
    const fields = record.fields;

    const story = fields['Story'];
    const scenePrompt = fields['Scene Generation (User Prompt)']?.[0];
    const shotSystemPrompt = fields['Shot Generation (System Prompt)']?.[0] ||
      "You're an expert storyteller responsible for breaking up a larger story into various scenes and shots.";
    const shotUserPrompt = fields['Shot Generation (User Prompt)']?.[0];

    if (!story) {
      throw new Error('No story found - generate story first');
    }

    // Step 1: Generate scenes from the story
    console.log(`[addScenesShots] Generating scenes...`);

    const sceneCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: shotSystemPrompt },
        { role: 'user', content: `${story}\n\n${scenePrompt}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    });

    const sceneResponse = sceneCompletion.choices[0]?.message?.content;
    if (!sceneResponse) {
      throw new Error('No scenes generated');
    }

    let scenesData: { scenes: SceneData[] };
    try {
      scenesData = JSON.parse(sceneResponse);
    } catch (e) {
      console.error('[addScenesShots] Failed to parse scenes JSON:', sceneResponse);
      throw new Error('Failed to parse scenes JSON');
    }

    console.log(`[addScenesShots] Generated ${scenesData.scenes?.length || 0} scenes`);

    if (!scenesData.scenes || scenesData.scenes.length === 0) {
      throw new Error('No scenes in response');
    }

    // Step 2: Create scene records and generate shots for each
    for (let sceneIndex = 0; sceneIndex < scenesData.scenes.length; sceneIndex++) {
      const sceneData = scenesData.scenes[sceneIndex];
      const sceneScript = sceneData.scene.script;
      const sceneName = sceneData.scene.name;

      console.log(`[addScenesShots] Creating scene ${sceneIndex + 1}: ${sceneName}`);

      // Create scene record
      const sceneRecord = await createRecord(TABLES.SCENES, {
        'Scene Name': sceneName,
        'Scene Script': sceneScript,
        'Story': [recordId],
        'Sort': sceneIndex + 1,
      });

      const sceneId = sceneRecord.id;

      // Generate shots for this scene
      console.log(`[addScenesShots] Generating shots for scene ${sceneIndex + 1}...`);

      const shotCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: shotSystemPrompt },
          { role: 'user', content: `${sceneScript}\n\n${shotUserPrompt}` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4000,
      });

      const shotResponse = shotCompletion.choices[0]?.message?.content;
      if (!shotResponse) {
        console.warn(`[addScenesShots] No shots generated for scene ${sceneIndex + 1}`);
        continue;
      }

      let shotsData: { shots: ShotData[] };
      try {
        shotsData = JSON.parse(shotResponse);
      } catch (e) {
        console.error('[addScenesShots] Failed to parse shots JSON:', shotResponse);
        continue;
      }

      if (!shotsData.shots || shotsData.shots.length === 0) {
        console.warn(`[addScenesShots] No shots in response for scene ${sceneIndex + 1}`);
        continue;
      }

      console.log(`[addScenesShots] Creating ${shotsData.shots.length} shots for scene ${sceneIndex + 1}`);

      // Create shot records in batch
      const shotRecords = shotsData.shots.map((shotData, shotIndex) => ({
        fields: {
          'Shot Name': shotData.shot.name,
          'Shot Script': shotData.shot.script,
          'Scene': [sceneId],
          'Sort': shotIndex + 1,
        },
      }));

      // Airtable allows max 10 records per request
      for (let i = 0; i < shotRecords.length; i += 10) {
        const batch = shotRecords.slice(i, i + 10);
        await createRecords(TABLES.SHOTS, batch);
      }
    }

    console.log(`[addScenesShots] Completed for record ${recordId}`);

    return { success: true };
  } catch (error) {
    console.error('[addScenesShots] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================
// Action: Generate Image with OpenAI DALL-E (aid=17)
// ============================================

export async function generateImageOpenAI(recordId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[generateImageOpenAI] Starting for record ${recordId}`);

  try {
    // Get the shot record
    const record = await getRecord(TABLES.SHOTS, recordId);
    const fields = record.fields;

    const shotScript = fields['Shot Script'];
    const imagePromptTemplate = fields['Image Prompt Generation (User Prompt)']?.[0];
    const width = fields['Width']?.[0] || 1024;
    const height = fields['Height']?.[0] || 1024;

    if (!shotScript) {
      throw new Error('No shot script found');
    }

    // Generate image prompt using GPT-4
    console.log(`[generateImageOpenAI] Generating image prompt...`);

    let imagePrompt = shotScript;

    if (imagePromptTemplate) {
      const promptCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert at creating AI image generation prompts.' },
          { role: 'user', content: `${shotScript}\n\n${imagePromptTemplate}` },
        ],
        max_tokens: 500,
      });

      imagePrompt = promptCompletion.choices[0]?.message?.content || shotScript;
    }

    // Update the image prompt field
    await updateRecord(TABLES.SHOTS, recordId, {
      'Image Prompt': imagePrompt,
    });

    // Determine DALL-E size
    let size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024';
    if (width > height) {
      size = '1792x1024'; // Landscape
    } else if (height > width) {
      size = '1024x1792'; // Portrait
    }

    console.log(`[generateImageOpenAI] Generating image with DALL-E 3 (${size})...`);

    // Generate image with DALL-E 3
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: size,
      quality: 'hd',
    });

    const imageUrl = imageResponse.data[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log(`[generateImageOpenAI] Image generated, uploading to Airtable...`);

    // Update the shot record with the image
    // Airtable accepts URL for attachment fields
    await updateRecord(TABLES.SHOTS, recordId, {
      'Image Upload': [{ url: imageUrl }],
    });

    console.log(`[generateImageOpenAI] Completed for record ${recordId}`);

    return { success: true };
  } catch (error) {
    console.error('[generateImageOpenAI] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================
// Action: Generate Voiceover with ElevenLabs (aid=4)
// ============================================

export async function generateVoiceover(recordId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[generateVoiceover] Starting for record ${recordId}`);

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

  if (!elevenLabsKey) {
    console.warn('[generateVoiceover] ELEVENLABS_API_KEY not configured');
    return { success: false, error: 'ElevenLabs API key not configured' };
  }

  try {
    // Get the shot record
    const record = await getRecord(TABLES.SHOTS, recordId);
    const fields = record.fields;

    const script = fields['Shot Script'] || fields['Final Audio Prompt'];
    const voiceId = fields['Voice']?.[0] || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah

    if (!script) {
      throw new Error('No script found for voiceover');
    }

    console.log(`[generateVoiceover] Generating audio for: ${script.substring(0, 50)}...`);

    // Call ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsKey,
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${error}`);
    }

    // Get the audio as a buffer
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    console.log(`[generateVoiceover] Audio generated (${audioBuffer.byteLength} bytes), uploading...`);

    // Upload audio to FFMPEG Worker storage
    const uploadResult = await callFFMPEGWorker('upload-audio', {
      audioBase64: base64Audio,
      filename: `shot-${recordId}.mp3`,
      contentType: 'audio/mpeg',
    });

    if (!uploadResult.audioUrl) {
      throw new Error('No audio URL returned from upload');
    }

    console.log(`[generateVoiceover] Audio uploaded: ${uploadResult.audioUrl}`);

    // Estimate audio duration based on script length (rough approximation)
    // Average speaking rate is ~150 words per minute = 2.5 words per second
    const wordCount = script.split(/\s+/).length;
    const estimatedDuration = Math.max(2, wordCount / 2.5); // Minimum 2 seconds

    // Update the shot record with the audio URL and duration
    await updateRecord(TABLES.SHOTS, recordId, {
      'Audio Upload': [{ url: uploadResult.audioUrl }],
      'Audio Duration': estimatedDuration,
    });

    console.log(`[generateVoiceover] Completed for shot ${recordId}`);

    return { success: true };
  } catch (error) {
    console.error('[generateVoiceover] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================
// Action: Generate Video from Image (aid=24)
// Creates Ken Burns effect video from static image
// ============================================

export async function generateVideoNCA(recordId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[generateVideoNCA] Starting for shot ${recordId}`);

  try {
    // Get the shot record
    const record = await getRecord(TABLES.SHOTS, recordId);
    const fields = record.fields;

    // Get the image URL from the attachment
    const imageAttachment = fields['Image Upload']?.[0];
    if (!imageAttachment?.url) {
      throw new Error('No image found for this shot');
    }

    const imageUrl = imageAttachment.url;

    // Get duration from audio if available, otherwise default
    const audioDuration = fields['Audio Duration'] || 5;

    // Get dimensions from story type
    const width = fields['Width']?.[0] || 1920;
    const height = fields['Height']?.[0] || 1080;

    // Randomly select a Ken Burns effect for variety
    const effects = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right'] as const;
    const effect = effects[Math.floor(Math.random() * effects.length)];

    console.log(`[generateVideoNCA] Creating ${effect} video, ${audioDuration}s, ${width}x${height}`);

    // Call FFMPEG Worker
    const result = await callFFMPEGWorker('ken-burns', {
      imageUrl,
      duration: audioDuration,
      effect,
      width,
      height,
    });

    if (!result.videoUrl) {
      throw new Error('No video URL returned from FFMPEG worker');
    }

    console.log(`[generateVideoNCA] Video created: ${result.videoUrl}`);

    // Update the shot record with the video
    await updateRecord(TABLES.SHOTS, recordId, {
      'Video Upload': [{ url: result.videoUrl }],
    });

    console.log(`[generateVideoNCA] Completed for shot ${recordId}`);

    return { success: true };
  } catch (error) {
    console.error('[generateVideoNCA] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Action: Mix Shot Audio + Video (aid=9)
// Combines the voiceover audio with the Ken Burns video
// ============================================

export async function mixShotAudioVideo(recordId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[mixShotAudioVideo] Starting for shot ${recordId}`);

  try {
    // Get the shot record
    const record = await getRecord(TABLES.SHOTS, recordId);
    const fields = record.fields;

    // Get video and audio URLs
    const videoAttachment = fields['Video Upload']?.[0];
    const audioAttachment = fields['Audio Upload']?.[0];

    if (!videoAttachment?.url) {
      throw new Error('No video found for this shot');
    }
    if (!audioAttachment?.url) {
      throw new Error('No audio found for this shot');
    }

    console.log(`[mixShotAudioVideo] Mixing audio with video`);

    // Call FFMPEG Worker
    const result = await callFFMPEGWorker('mix-audio', {
      videoUrl: videoAttachment.url,
      audioUrl: audioAttachment.url,
      volume: 1,
    });

    if (!result.videoUrl) {
      throw new Error('No video URL returned from FFMPEG worker');
    }

    console.log(`[mixShotAudioVideo] Mixed video created: ${result.videoUrl}`);

    // Update the shot record with the final shot video
    await updateRecord(TABLES.SHOTS, recordId, {
      'Final Shot': [{ url: result.videoUrl }],
    });

    console.log(`[mixShotAudioVideo] Completed for shot ${recordId}`);

    return { success: true };
  } catch (error) {
    console.error('[mixShotAudioVideo] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Action: Combine Shots into Scene (aid=10)
// Concatenates all shots in a scene into one video
// ============================================

export async function combineShots(recordId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[combineShots] Starting for scene ${recordId}`);

  try {
    // Get the scene record
    const sceneRecord = await getRecord(TABLES.SCENES, recordId);
    const sceneFields = sceneRecord.fields;

    // Get all shots for this scene, sorted by Sort field
    const shotsResponse = await airtableFetch(
      `${TABLES.SHOTS}?filterByFormula={Scene}="${recordId}"&sort[0][field]=Sort&sort[0][direction]=asc`
    );

    const shots = shotsResponse.records;

    if (!shots || shots.length === 0) {
      throw new Error('No shots found for this scene');
    }

    // Collect all final shot video URLs
    const videoUrls: string[] = [];
    for (const shot of shots) {
      const finalShot = shot.fields['Final Shot']?.[0];
      if (!finalShot?.url) {
        throw new Error(`Shot ${shot.id} is missing final video`);
      }
      videoUrls.push(finalShot.url);
    }

    console.log(`[combineShots] Combining ${videoUrls.length} shots`);

    // Call FFMPEG Worker
    const result = await callFFMPEGWorker('concatenate', {
      videoUrls,
      transition: 'none', // Can add 'fade' for smoother transitions
    });

    if (!result.videoUrl) {
      throw new Error('No video URL returned from FFMPEG worker');
    }

    console.log(`[combineShots] Scene video created: ${result.videoUrl}`);

    // Update the scene record with the combined video
    await updateRecord(TABLES.SCENES, recordId, {
      'Scene Video': [{ url: result.videoUrl }],
    });

    console.log(`[combineShots] Completed for scene ${recordId}`);

    return { success: true };
  } catch (error) {
    console.error('[combineShots] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Action: Combine Scenes into Final Video (aid=11)
// Concatenates all scenes into the final story video
// ============================================

export async function combineScenes(recordId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[combineScenes] Starting for story ${recordId}`);

  try {
    // Get all scenes for this story, sorted by Sort field
    const scenesResponse = await airtableFetch(
      `${TABLES.SCENES}?filterByFormula={Story}="${recordId}"&sort[0][field]=Sort&sort[0][direction]=asc`
    );

    const scenes = scenesResponse.records;

    if (!scenes || scenes.length === 0) {
      throw new Error('No scenes found for this story');
    }

    // Collect all scene video URLs
    const videoUrls: string[] = [];
    for (const scene of scenes) {
      const sceneVideo = scene.fields['Scene Video']?.[0];
      if (!sceneVideo?.url) {
        throw new Error(`Scene ${scene.id} is missing scene video`);
      }
      videoUrls.push(sceneVideo.url);
    }

    console.log(`[combineScenes] Combining ${videoUrls.length} scenes`);

    // Call FFMPEG Worker
    const result = await callFFMPEGWorker('concatenate', {
      videoUrls,
      transition: 'fade', // Add fade transitions between scenes
    });

    if (!result.videoUrl) {
      throw new Error('No video URL returned from FFMPEG worker');
    }

    console.log(`[combineScenes] Final video created: ${result.videoUrl}`);

    // Update the story record with the final video
    await updateRecord(TABLES.STORIES, recordId, {
      'Final Video': [{ url: result.videoUrl }],
    });

    console.log(`[combineScenes] Completed for story ${recordId}`);

    return { success: true };
  } catch (error) {
    console.error('[combineScenes] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Action: Add Captions to Final Video (aid=19)
// Burns SRT captions into the final video
// ============================================

export async function addCaptions(recordId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[addCaptions] Starting for story ${recordId}`);

  try {
    // Get the story record
    const record = await getRecord(TABLES.STORIES, recordId);
    const fields = record.fields;

    // Get the final video URL
    const finalVideo = fields['Final Video']?.[0];
    if (!finalVideo?.url) {
      throw new Error('No final video found');
    }

    // Get or generate SRT content
    let srtContent = fields['SRT Content'];

    if (!srtContent) {
      // If no SRT provided, we need to generate it from the transcription
      // For now, we'll generate a basic SRT from the story segments
      console.log(`[addCaptions] Generating SRT from story content`);
      srtContent = await generateSRTFromStory(recordId);
    }

    if (!srtContent) {
      throw new Error('No caption content available');
    }

    // Get caption style preferences
    const captionStyle = {
      fontName: fields['Caption Font'] || 'Arial',
      fontSize: fields['Caption Size'] || 32,
      fontColor: fields['Caption Color'] || 'white',
      position: (fields['Caption Position'] || 'bottom') as 'bottom' | 'top',
    };

    console.log(`[addCaptions] Adding captions with style:`, captionStyle);

    // Call FFMPEG Worker
    const result = await callFFMPEGWorker('captions', {
      videoUrl: finalVideo.url,
      srtContent,
      style: captionStyle,
    });

    if (!result.videoUrl) {
      throw new Error('No video URL returned from FFMPEG worker');
    }

    console.log(`[addCaptions] Captioned video created: ${result.videoUrl}`);

    // Update the story record with the captioned video
    await updateRecord(TABLES.STORIES, recordId, {
      'Final Video (Captioned)': [{ url: result.videoUrl }],
      'SRT Content': srtContent,
    });

    console.log(`[addCaptions] Completed for story ${recordId}`);

    return { success: true };
  } catch (error) {
    console.error('[addCaptions] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Helper: Generate SRT from Story Shots
// ============================================

async function generateSRTFromStory(storyId: string): Promise<string> {
  // Get all scenes for this story
  const scenesResponse = await airtableFetch(
    `${TABLES.SCENES}?filterByFormula={Story}="${storyId}"&sort[0][field]=Sort&sort[0][direction]=asc`
  );

  const scenes = scenesResponse.records;
  const srtEntries: string[] = [];
  let entryIndex = 1;
  let currentTime = 0;

  for (const scene of scenes) {
    // Get all shots for this scene
    const shotsResponse = await airtableFetch(
      `${TABLES.SHOTS}?filterByFormula={Scene}="${scene.id}"&sort[0][field]=Sort&sort[0][direction]=asc`
    );

    const shots = shotsResponse.records;

    for (const shot of shots) {
      const script = shot.fields['Shot Script'] || '';
      const duration = shot.fields['Audio Duration'] || 5;

      if (script) {
        const startTime = formatSRTTime(currentTime);
        const endTime = formatSRTTime(currentTime + duration);

        srtEntries.push(`${entryIndex}\n${startTime} --> ${endTime}\n${script}\n`);
        entryIndex++;
      }

      currentTime += duration;
    }
  }

  return srtEntries.join('\n');
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// ============================================
// Main Router
// ============================================

export async function handleAction(
  actionId: string,
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`[handleAction] Routing action ${actionId} for record ${recordId}`);

  switch (actionId) {
    case ACTION_IDS.GENERATE_STORY:
      return generateStory(recordId);

    case ACTION_IDS.ADD_SCENES_SHOTS:
      return addScenesShots(recordId);

    case ACTION_IDS.GENERATE_IMAGE_OPENAI:
      return generateImageOpenAI(recordId);

    case ACTION_IDS.GENERATE_VOICEOVER_11LABS:
      return generateVoiceover(recordId);

    case ACTION_IDS.GENERATE_VIDEO_NCA:
      return generateVideoNCA(recordId);

    case ACTION_IDS.SHOTS_MIX_AUDIO_VIDEO:
      return mixShotAudioVideo(recordId);

    case ACTION_IDS.COMBINE_SHOTS:
      return combineShots(recordId);

    case ACTION_IDS.COMBINE_SCENES:
      return combineScenes(recordId);

    case ACTION_IDS.ADD_CAPTIONS:
      return addCaptions(recordId);

    default:
      console.warn(`[handleAction] Unknown action ID: ${actionId}`);
      return { success: false, error: `Unknown action ID: ${actionId}` };
  }
}
