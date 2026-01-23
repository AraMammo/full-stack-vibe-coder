import { Router, Request, Response } from 'express';
import {
  createKenBurnsVideo,
  mixAudioVideo,
  concatenateVideos,
  addCaptions
} from '../services/ffmpeg';
import { uploadToStorage, downloadFile, cleanupFiles } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

export const router = Router();

// Ensure temp directory exists
const TEMP_DIR = '/tmp/ffmpeg-worker';
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * POST /api/video/ken-burns
 * Create a video from a static image with Ken Burns (zoom/pan) effect
 *
 * Body: {
 *   imageUrl: string,      // URL of the source image
 *   duration: number,      // Duration in seconds
 *   effect: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right',
 *   width?: number,        // Output width (default: 1920)
 *   height?: number        // Output height (default: 1080)
 * }
 */
router.post('/ken-burns', async (req: Request, res: Response) => {
  const jobId = uuidv4();
  const files: string[] = [];

  try {
    const { imageUrl, duration = 5, effect = 'zoom-in', width = 1920, height = 1080 } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    console.log(`[${jobId}] Ken Burns: Starting - ${effect} for ${duration}s`);

    // Download the image
    const imagePath = path.join(TEMP_DIR, `${jobId}-input.jpg`);
    await downloadFile(imageUrl, imagePath);
    files.push(imagePath);

    // Create the video
    const outputPath = path.join(TEMP_DIR, `${jobId}-output.mp4`);
    await createKenBurnsVideo(imagePath, outputPath, {
      duration,
      effect,
      width,
      height,
    });
    files.push(outputPath);

    // Upload to storage
    const videoUrl = await uploadToStorage(outputPath, `videos/${jobId}.mp4`);

    console.log(`[${jobId}] Ken Burns: Complete - ${videoUrl}`);

    // Cleanup
    await cleanupFiles(files);

    res.json({ success: true, videoUrl });
  } catch (error) {
    console.error(`[${jobId}] Ken Burns Error:`, error);
    await cleanupFiles(files);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create Ken Burns video'
    });
  }
});

/**
 * POST /api/video/mix-audio
 * Overlay audio track onto video
 *
 * Body: {
 *   videoUrl: string,    // URL of the source video
 *   audioUrl: string,    // URL of the audio track
 *   volume?: number      // Audio volume (0-1, default: 1)
 * }
 */
router.post('/mix-audio', async (req: Request, res: Response) => {
  const jobId = uuidv4();
  const files: string[] = [];

  try {
    const { videoUrl, audioUrl, volume = 1 } = req.body;

    if (!videoUrl || !audioUrl) {
      return res.status(400).json({ error: 'videoUrl and audioUrl are required' });
    }

    console.log(`[${jobId}] Mix Audio: Starting`);

    // Download files
    const videoPath = path.join(TEMP_DIR, `${jobId}-video.mp4`);
    const audioPath = path.join(TEMP_DIR, `${jobId}-audio.mp3`);

    await Promise.all([
      downloadFile(videoUrl, videoPath),
      downloadFile(audioUrl, audioPath),
    ]);
    files.push(videoPath, audioPath);

    // Mix audio
    const outputPath = path.join(TEMP_DIR, `${jobId}-mixed.mp4`);
    await mixAudioVideo(videoPath, audioPath, outputPath, volume);
    files.push(outputPath);

    // Upload
    const mixedUrl = await uploadToStorage(outputPath, `videos/${jobId}-mixed.mp4`);

    console.log(`[${jobId}] Mix Audio: Complete - ${mixedUrl}`);

    await cleanupFiles(files);

    res.json({ success: true, videoUrl: mixedUrl });
  } catch (error) {
    console.error(`[${jobId}] Mix Audio Error:`, error);
    await cleanupFiles(files);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to mix audio'
    });
  }
});

/**
 * POST /api/video/concatenate
 * Combine multiple videos into one
 *
 * Body: {
 *   videoUrls: string[],  // Array of video URLs in order
 *   transition?: 'none' | 'fade'  // Transition between clips
 * }
 */
router.post('/concatenate', async (req: Request, res: Response) => {
  const jobId = uuidv4();
  const files: string[] = [];

  try {
    const { videoUrls, transition = 'none' } = req.body;

    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length < 2) {
      return res.status(400).json({ error: 'videoUrls must be an array with at least 2 URLs' });
    }

    console.log(`[${jobId}] Concatenate: Starting with ${videoUrls.length} videos`);

    // Download all videos
    const videoPaths: string[] = [];
    for (let i = 0; i < videoUrls.length; i++) {
      const videoPath = path.join(TEMP_DIR, `${jobId}-part${i}.mp4`);
      await downloadFile(videoUrls[i], videoPath);
      videoPaths.push(videoPath);
      files.push(videoPath);
    }

    // Concatenate
    const outputPath = path.join(TEMP_DIR, `${jobId}-combined.mp4`);
    await concatenateVideos(videoPaths, outputPath, transition);
    files.push(outputPath);

    // Upload
    const combinedUrl = await uploadToStorage(outputPath, `videos/${jobId}-combined.mp4`);

    console.log(`[${jobId}] Concatenate: Complete - ${combinedUrl}`);

    await cleanupFiles(files);

    res.json({ success: true, videoUrl: combinedUrl });
  } catch (error) {
    console.error(`[${jobId}] Concatenate Error:`, error);
    await cleanupFiles(files);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to concatenate videos'
    });
  }
});

/**
 * POST /api/video/captions
 * Add SRT captions to video
 *
 * Body: {
 *   videoUrl: string,     // URL of the source video
 *   srtContent: string,   // SRT file content as string
 *   style?: {
 *     fontName?: string,
 *     fontSize?: number,
 *     fontColor?: string,
 *     backgroundColor?: string,
 *     position?: 'bottom' | 'top'
 *   }
 * }
 */
router.post('/captions', async (req: Request, res: Response) => {
  const jobId = uuidv4();
  const files: string[] = [];

  try {
    const { videoUrl, srtContent, style = {} } = req.body;

    if (!videoUrl || !srtContent) {
      return res.status(400).json({ error: 'videoUrl and srtContent are required' });
    }

    console.log(`[${jobId}] Add Captions: Starting`);

    // Download video
    const videoPath = path.join(TEMP_DIR, `${jobId}-video.mp4`);
    await downloadFile(videoUrl, videoPath);
    files.push(videoPath);

    // Write SRT file
    const srtPath = path.join(TEMP_DIR, `${jobId}-captions.srt`);
    fs.writeFileSync(srtPath, srtContent);
    files.push(srtPath);

    // Add captions
    const outputPath = path.join(TEMP_DIR, `${jobId}-captioned.mp4`);
    await addCaptions(videoPath, srtPath, outputPath, style);
    files.push(outputPath);

    // Upload
    const captionedUrl = await uploadToStorage(outputPath, `videos/${jobId}-captioned.mp4`);

    console.log(`[${jobId}] Add Captions: Complete - ${captionedUrl}`);

    await cleanupFiles(files);

    res.json({ success: true, videoUrl: captionedUrl });
  } catch (error) {
    console.error(`[${jobId}] Add Captions Error:`, error);
    await cleanupFiles(files);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to add captions'
    });
  }
});

/**
 * POST /api/video/generate-srt
 * Generate SRT from audio using transcription
 * This is a placeholder - actual transcription would use Whisper or similar
 */
router.post('/generate-srt', async (req: Request, res: Response) => {
  // This would integrate with Whisper or similar transcription service
  // For now, return an error indicating external service needed
  res.status(501).json({
    error: 'SRT generation requires external transcription service (Whisper/AssemblyAI)'
  });
});

/**
 * POST /api/video/upload-audio
 * Upload audio data to storage and return a public URL
 * Used for ElevenLabs voiceover audio that needs to be stored
 *
 * Body: {
 *   audioBase64: string,  // Base64 encoded audio data
 *   filename?: string,    // Optional filename (default: random UUID)
 *   contentType?: string  // MIME type (default: audio/mpeg)
 * }
 */
router.post('/upload-audio', async (req: Request, res: Response) => {
  const jobId = uuidv4();

  try {
    const { audioBase64, filename, contentType = 'audio/mpeg' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    console.log(`[${jobId}] Upload Audio: Starting`);

    // Decode base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Determine file extension from content type
    const ext = contentType === 'audio/wav' ? 'wav' : 'mp3';
    const audioFilename = filename || `${jobId}.${ext}`;

    // Write to temp file
    const tempPath = path.join(TEMP_DIR, audioFilename);
    fs.writeFileSync(tempPath, audioBuffer);

    // Upload to storage
    const audioUrl = await uploadToStorage(tempPath, `audio/${audioFilename}`);

    console.log(`[${jobId}] Upload Audio: Complete - ${audioUrl}`);

    // Cleanup temp file
    await cleanupFiles([tempPath]);

    res.json({ success: true, audioUrl });
  } catch (error) {
    console.error(`[${jobId}] Upload Audio Error:`, error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to upload audio'
    });
  }
});
