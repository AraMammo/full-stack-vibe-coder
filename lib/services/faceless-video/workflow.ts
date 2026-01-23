/**
 * Faceless Video Generator - Workflow Orchestrator
 *
 * Processes stories through all generation steps:
 * 1. Generate Story (OpenAI)
 * 2. Generate Scenes & Shots (OpenAI)
 * 3. Generate Images (DALL-E) - parallel for all shots
 * 4. Generate Voiceovers (ElevenLabs) - parallel for all shots
 * 5. Generate Videos (FFMPEG Ken Burns) - parallel for all shots
 * 6. Mix Audio/Video (FFMPEG) - parallel for all shots
 * 7. Combine Shots into Scenes (FFMPEG) - per scene
 * 8. Combine Scenes into Final Video (FFMPEG)
 * 9. Add Captions (FFMPEG)
 */

import OpenAI from 'openai';
import { db } from './supabase-client';
import { Story, Scene, Shot, StoryType } from './types';

const FFMPEG_WORKER_URL = process.env.FFMPEG_WORKER_URL || 'http://localhost:3001';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==================== Helper Functions ====================

async function callFFMPEGWorker(endpoint: string, body: Record<string, unknown>): Promise<any> {
  const response = await fetch(`${FFMPEG_WORKER_URL}/api/video/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `FFMPEG Worker error: ${response.status}`);
  }

  return response.json();
}

function log(storyId: string, message: string) {
  console.log(`[Workflow ${storyId.slice(0, 8)}] ${message}`);
}

// ==================== Step 1: Generate Story ====================

async function generateStoryText(story: Story, storyType: StoryType): Promise<string> {
  log(story.id, 'Generating story text...');

  const systemPrompt = storyType.story_system_prompt || "You're an expert storyteller.";
  const userPrompt = storyType.story_user_prompt || "Rewrite the story into a captivating 200 word narrative.";

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${story.source_content}\n\n${userPrompt}` },
    ],
    max_tokens: 2000,
  });

  const generatedStory = completion.choices[0]?.message?.content;
  if (!generatedStory) throw new Error('Failed to generate story');

  log(story.id, `Story generated (${generatedStory.length} chars)`);
  return generatedStory;
}

// ==================== Step 2: Generate Scenes & Shots ====================

interface SceneData {
  scene: { script: string; name: string };
}

interface ShotData {
  shot: { script: string; name: string };
}

async function generateScenesAndShots(
  story: Story,
  storyType: StoryType,
  generatedStory: string
): Promise<void> {
  log(story.id, 'Generating scenes...');

  const scenePrompt = storyType.scene_prompt ||
    'Break this story into 3-5 scenes. Use JSON: {"scenes": [{"scene": {"script": "...", "name": "..."}}]}';

  const sceneCompletion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: storyType.shot_system_prompt || "You're an expert storyteller." },
      { role: 'user', content: `${generatedStory}\n\n${scenePrompt}` },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4000,
  });

  const sceneResponse = sceneCompletion.choices[0]?.message?.content;
  if (!sceneResponse) throw new Error('Failed to generate scenes');

  const scenesData: { scenes: SceneData[] } = JSON.parse(sceneResponse);
  if (!scenesData.scenes?.length) throw new Error('No scenes generated');

  log(story.id, `Generated ${scenesData.scenes.length} scenes`);

  // Create scenes and their shots
  for (let sceneIndex = 0; sceneIndex < scenesData.scenes.length; sceneIndex++) {
    const sceneData = scenesData.scenes[sceneIndex];

    // Create scene record
    const scene = await db.createScene({
      story_id: story.id,
      name: sceneData.scene.name,
      script: sceneData.scene.script,
      sort_order: sceneIndex + 1,
      status: 'pending',
    });

    log(story.id, `Created scene ${sceneIndex + 1}: ${sceneData.scene.name}`);

    // Generate shots for this scene
    const shotPrompt = storyType.shot_user_prompt ||
      'Break this scene into 3-6 shots. Use JSON: {"shots": [{"shot": {"script": "...", "name": "..."}}]}';

    const shotCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: storyType.shot_system_prompt || "You're an expert storyteller." },
        { role: 'user', content: `${sceneData.scene.script}\n\n${shotPrompt}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    });

    const shotResponse = shotCompletion.choices[0]?.message?.content;
    if (!shotResponse) continue;

    const shotsData: { shots: ShotData[] } = JSON.parse(shotResponse);
    if (!shotsData.shots?.length) continue;

    // Create shot records
    const shotsToCreate = shotsData.shots.map((shotData, shotIndex) => ({
      scene_id: scene.id,
      story_id: story.id,
      name: shotData.shot.name,
      script: shotData.shot.script,
      sort_order: shotIndex + 1,
      image_status: 'pending' as const,
      audio_status: 'pending' as const,
      video_status: 'pending' as const,
      final_status: 'pending' as const,
    }));

    await db.createShots(shotsToCreate);
    log(story.id, `Created ${shotsToCreate.length} shots for scene ${sceneIndex + 1}`);
  }
}

// ==================== Step 3: Generate Images ====================

async function generateImage(shot: Shot, storyType: StoryType): Promise<string> {
  await db.updateShotMediaStatus(shot.id, 'image', 'processing');

  // Generate image prompt
  let imagePrompt = shot.script;
  if (storyType.image_prompt_template) {
    const promptCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You create AI image generation prompts.' },
        { role: 'user', content: `${shot.script}\n\n${storyType.image_prompt_template}` },
      ],
      max_tokens: 500,
    });
    imagePrompt = promptCompletion.choices[0]?.message?.content || shot.script;
  }

  // Update the prompt
  await db.updateShot(shot.id, { image_prompt: imagePrompt });

  // Determine size based on dimensions
  let size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024';
  if (storyType.width > storyType.height) {
    size = '1792x1024';
  } else if (storyType.height > storyType.width) {
    size = '1024x1792';
  }

  // Generate with DALL-E 3
  const imageResponse = await openai.images.generate({
    model: 'dall-e-3',
    prompt: imagePrompt,
    n: 1,
    size,
    quality: 'hd',
  });

  const dalleUrl = imageResponse.data?.[0]?.url;
  if (!dalleUrl) throw new Error('No image URL returned');

  // Download and upload to Supabase storage (DALL-E URLs are temporary)
  const imageData = await fetch(dalleUrl);
  const imageBuffer = await imageData.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  // Upload via FFMPEG worker (which has storage configured)
  const uploadResult = await callFFMPEGWorker('upload-image', {
    imageBase64: base64Image,
    filename: `shot-${shot.id}.png`,
    contentType: 'image/png',
  });

  const imageUrl = uploadResult.imageUrl || dalleUrl;

  await db.updateShotMediaStatus(shot.id, 'image', 'completed', imageUrl);
  return imageUrl;
}

// ==================== Step 4: Generate Voiceovers ====================

async function generateVoiceover(shot: Shot, storyType: StoryType): Promise<{ url: string; duration: number }> {
  if (!ELEVENLABS_API_KEY) throw new Error('ElevenLabs API key not configured');

  await db.updateShotMediaStatus(shot.id, 'audio', 'processing');

  const voiceId = storyType.voice_id || 'EXAVITQu4vr4xnSDxMaL';

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: shot.script,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.5 },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs error: ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString('base64');

  // Upload to FFMPEG worker storage
  const uploadResult = await callFFMPEGWorker('upload-audio', {
    audioBase64: base64Audio,
    filename: `shot-${shot.id}.mp3`,
    contentType: 'audio/mpeg',
  });

  if (!uploadResult.audioUrl) throw new Error('Failed to upload audio');

  // Estimate duration (rough: ~2.5 words per second)
  const wordCount = shot.script.split(/\s+/).length;
  const duration = Math.max(2, wordCount / 2.5);

  await db.updateShot(shot.id, {
    audio_url: uploadResult.audioUrl,
    audio_duration: duration,
    audio_status: 'completed',
  });

  return { url: uploadResult.audioUrl, duration };
}

// ==================== Step 5: Generate Videos (Ken Burns) ====================

async function generateVideo(shot: Shot, storyType: StoryType): Promise<string> {
  if (!shot.image_url) throw new Error('No image URL for video generation');

  await db.updateShotMediaStatus(shot.id, 'video', 'processing');

  const effects = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right'] as const;
  const effect = effects[Math.floor(Math.random() * effects.length)];

  const result = await callFFMPEGWorker('ken-burns', {
    imageUrl: shot.image_url,
    duration: shot.audio_duration || 5,
    effect,
    width: storyType.width,
    height: storyType.height,
  });

  if (!result.videoUrl) throw new Error('No video URL returned');

  await db.updateShotMediaStatus(shot.id, 'video', 'completed', result.videoUrl);
  return result.videoUrl;
}

// ==================== Step 6: Mix Audio + Video ====================

async function mixAudioVideo(shot: Shot): Promise<string> {
  if (!shot.video_url || !shot.audio_url) {
    throw new Error('Missing video or audio URL');
  }

  await db.updateShotMediaStatus(shot.id, 'final', 'processing');

  const result = await callFFMPEGWorker('mix-audio', {
    videoUrl: shot.video_url,
    audioUrl: shot.audio_url,
    volume: 1,
  });

  if (!result.videoUrl) throw new Error('No mixed video URL returned');

  await db.updateShotMediaStatus(shot.id, 'final', 'completed', result.videoUrl);
  return result.videoUrl;
}

// ==================== Step 7: Combine Shots into Scene ====================

async function combineShots(scene: Scene): Promise<string> {
  const shots = await db.getShotsByScene(scene.id);

  if (shots.length === 0) throw new Error('No shots in scene');

  const videoUrls = shots
    .filter(s => s.final_video_url)
    .map(s => s.final_video_url!);

  if (videoUrls.length === 0) throw new Error('No final videos for shots');

  await db.updateScene(scene.id, { status: 'processing' });

  const result = await callFFMPEGWorker('concatenate', {
    videoUrls,
    transition: 'none',
  });

  if (!result.videoUrl) throw new Error('No combined video URL returned');

  await db.updateScene(scene.id, { video_url: result.videoUrl, status: 'completed' });
  return result.videoUrl;
}

// ==================== Step 8: Combine Scenes into Final ====================

async function combineScenes(story: Story): Promise<string> {
  const scenes = await db.getScenesByStory(story.id);

  if (scenes.length === 0) throw new Error('No scenes in story');

  const videoUrls = scenes
    .filter(s => s.video_url)
    .map(s => s.video_url!);

  if (videoUrls.length === 0) throw new Error('No scene videos');

  const result = await callFFMPEGWorker('concatenate', {
    videoUrls,
    transition: 'fade',
  });

  if (!result.videoUrl) throw new Error('No final video URL returned');

  await db.updateStory(story.id, { final_video_url: result.videoUrl });
  return result.videoUrl;
}

// ==================== Step 9: Add Captions ====================

async function addCaptions(story: Story, storyType: StoryType): Promise<string> {
  if (!story.final_video_url) throw new Error('No final video');
  if (!storyType.captions_enabled) return story.final_video_url;

  // Generate SRT from shots
  const scenes = await db.getScenesByStory(story.id);
  const srtEntries: string[] = [];
  let entryIndex = 1;
  let currentTime = 0;

  for (const scene of scenes) {
    const shots = await db.getShotsByScene(scene.id);
    for (const shot of shots) {
      const duration = shot.audio_duration || 5;
      const startTime = formatSRTTime(currentTime);
      const endTime = formatSRTTime(currentTime + duration);

      srtEntries.push(`${entryIndex}\n${startTime} --> ${endTime}\n${shot.script}\n`);
      entryIndex++;
      currentTime += duration;
    }
  }

  const srtContent = srtEntries.join('\n');

  const result = await callFFMPEGWorker('captions', {
    videoUrl: story.final_video_url,
    srtContent,
    style: {
      fontName: storyType.caption_font || 'Arial',
      fontSize: storyType.caption_size || 32,
      fontColor: storyType.caption_color || 'white',
      position: storyType.caption_position || 'bottom',
    },
  });

  if (!result.videoUrl) throw new Error('No captioned video URL returned');

  await db.updateStory(story.id, {
    final_video_captioned_url: result.videoUrl,
    srt_content: srtContent,
  });

  return result.videoUrl;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// ==================== Main Workflow ====================

export async function processStory(storyId: string): Promise<void> {
  log(storyId, 'Starting workflow...');

  try {
    // Get story with story type
    const story = await db.getStory(storyId);
    if (!story) throw new Error('Story not found');

    const storyType = story.story_type;
    if (!storyType) throw new Error('Story type not found');

    // Step 1: Generate Story
    await db.updateStoryStatus(storyId, 'generating_story', 5);
    const generatedStory = await generateStoryText(story, storyType);
    await db.updateStory(storyId, { generated_story: generatedStory });

    // Step 2: Generate Scenes & Shots
    await db.updateStoryStatus(storyId, 'generating_scenes', 15);
    await generateScenesAndShots(story, storyType, generatedStory);

    // Update story counts
    const scenes = await db.getScenesByStory(storyId);
    const shots = await db.getShotsByStory(storyId);
    await db.updateStory(storyId, {
      total_scenes: scenes.length,
      total_shots: shots.length,
    });

    // Step 3-6: Process all shots (images, audio, video, mix)
    await db.updateStoryStatus(storyId, 'generating_media', 20);

    for (const shot of shots) {
      try {
        log(storyId, `Processing shot ${shot.sort_order}: ${shot.name}`);

        // Generate image
        await generateImage(shot, storyType);

        // Generate voiceover
        await generateVoiceover(shot, storyType);

        // Generate Ken Burns video
        const updatedShot = await db.updateShot(shot.id, {});
        await generateVideo({ ...shot, ...updatedShot }, storyType);

        // Mix audio + video
        const finalShot = await db.updateShot(shot.id, {});
        await mixAudioVideo({ ...shot, ...finalShot });

        // Update progress
        const { progress } = await db.calculateProgress(storyId);
        await db.updateStory(storyId, { progress });

      } catch (error) {
        log(storyId, `Error processing shot ${shot.id}: ${error}`);
        await db.updateShot(shot.id, {
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue with other shots
      }
    }

    // Step 7: Combine shots into scenes
    await db.updateStoryStatus(storyId, 'building_video', 85);

    for (const scene of scenes) {
      try {
        await combineShots(scene);
      } catch (error) {
        log(storyId, `Error combining shots for scene ${scene.id}: ${error}`);
      }
    }

    // Step 8: Combine scenes into final video
    await combineScenes(story);

    // Step 9: Add captions
    await db.updateStoryStatus(storyId, 'adding_captions', 95);
    await addCaptions(story, storyType);

    // Complete!
    await db.updateStoryStatus(storyId, 'completed', 100);
    log(storyId, 'Workflow completed successfully!');

  } catch (error) {
    log(storyId, `Workflow failed: ${error}`);
    await db.updateStoryStatus(
      storyId,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}

// ==================== Incremental Processing Functions ====================

/**
 * Process a single shot incrementally (one step at a time)
 * Returns the step that was completed
 */
export async function processOneShot(
  shot: Shot,
  storyType: StoryType
): Promise<{ message: string }> {
  // Step 1: Generate image if not done
  if (shot.image_status !== 'completed') {
    log(shot.story_id, `Generating image for shot: ${shot.name}`);
    await generateImage(shot, storyType);
    return { message: 'Image generated' };
  }

  // Refresh shot data
  const updatedShot = await db.getShot(shot.id);
  if (!updatedShot) throw new Error('Shot not found');

  // Step 2: Generate audio if not done
  if (updatedShot.audio_status !== 'completed') {
    log(shot.story_id, `Generating audio for shot: ${shot.name}`);
    await generateVoiceover(updatedShot, storyType);
    return { message: 'Audio generated' };
  }

  // Refresh again
  const shotWithAudio = await db.getShot(shot.id);
  if (!shotWithAudio) throw new Error('Shot not found');

  // Step 3: Generate video if not done
  if (shotWithAudio.video_status !== 'completed') {
    log(shot.story_id, `Generating video for shot: ${shot.name}`);
    await generateVideo(shotWithAudio, storyType);
    return { message: 'Video generated' };
  }

  // Refresh again
  const shotWithVideo = await db.getShot(shot.id);
  if (!shotWithVideo) throw new Error('Shot not found');

  // Step 4: Mix audio/video if not done
  if (shotWithVideo.final_status !== 'completed') {
    log(shot.story_id, `Mixing audio/video for shot: ${shot.name}`);
    await mixAudioVideo(shotWithVideo);
    return { message: 'Audio/video mixed' };
  }

  return { message: 'Shot already complete' };
}

/**
 * Finalize scenes and combine into final video
 */
export async function finalizeScenesAndStory(
  storyId: string
): Promise<{ message: string; finalVideoUrl?: string; done: boolean }> {
  const story = await db.getStory(storyId);
  if (!story) throw new Error('Story not found');

  const scenes = await db.getScenesByStory(storyId);

  // Check if all scenes are combined
  const incompletScene = scenes.find(s => s.status !== 'completed');

  if (incompletScene) {
    // Combine shots for this scene
    log(storyId, `Combining shots for scene: ${incompletScene.name}`);
    await db.updateStoryStatus(storyId, 'building_video', 85);
    await combineShots(incompletScene);
    return { message: `Scene "${incompletScene.name}" combined`, done: false };
  }

  // All scenes combined - check if final video exists
  if (!story.final_video_url) {
    log(storyId, 'Combining all scenes into final video');
    await combineScenes(story);

    const updated = await db.getStory(storyId);
    return { message: 'Scenes combined into final video', finalVideoUrl: updated?.final_video_url, done: false };
  }

  // Add captions if enabled and not done
  if (!story.final_video_captioned_url && story.story_type?.captions_enabled) {
    log(storyId, 'Adding captions');
    await db.updateStoryStatus(storyId, 'adding_captions', 95);
    await addCaptions(story, story.story_type);

    const updated = await db.getStory(storyId);
    return { message: 'Captions added', finalVideoUrl: updated?.final_video_captioned_url || updated?.final_video_url, done: false };
  }

  // Mark as complete
  await db.updateStoryStatus(storyId, 'completed', 100);
  log(storyId, 'Story completed!');

  const final = await db.getStory(storyId);
  return {
    message: 'Story completed',
    finalVideoUrl: final?.final_video_captioned_url || final?.final_video_url,
    done: true,
  };
}

// Export for use in API routes
export { db };
