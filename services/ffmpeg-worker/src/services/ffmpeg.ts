import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

interface KenBurnsOptions {
  duration: number;
  effect: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'pan-up' | 'pan-down';
  width: number;
  height: number;
}

interface CaptionStyle {
  fontName?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  position?: 'bottom' | 'top';
}

/**
 * Create a Ken Burns effect video from a static image
 * This applies zoom/pan animation to make static images dynamic
 */
export function createKenBurnsVideo(
  imagePath: string,
  outputPath: string,
  options: KenBurnsOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    const { duration, effect, width, height } = options;
    const fps = 30;

    // Calculate zoom/pan parameters based on effect
    // We use scale + crop with changing parameters over time
    let filterComplex: string;

    // Start with image scaled larger than output to allow for movement
    const scaleFactor = 1.3; // 30% larger to allow zoom/pan room
    const scaleW = Math.round(width * scaleFactor);
    const scaleH = Math.round(height * scaleFactor);

    switch (effect) {
      case 'zoom-in':
        // Start zoomed out, end zoomed in (crop gets smaller over time)
        filterComplex = `[0:v]scale=${scaleW}:${scaleH},` +
          `zoompan=z='min(zoom+0.001,1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
          `d=${duration * fps}:s=${width}x${height}:fps=${fps}[v]`;
        break;

      case 'zoom-out':
        // Start zoomed in, end zoomed out
        filterComplex = `[0:v]scale=${scaleW}:${scaleH},` +
          `zoompan=z='if(lte(zoom,1.0),1.3,max(1.0,zoom-0.001))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
          `d=${duration * fps}:s=${width}x${height}:fps=${fps}[v]`;
        break;

      case 'pan-left':
        // Pan from right to left
        filterComplex = `[0:v]scale=${scaleW}:${scaleH},` +
          `zoompan=z='1.1':x='if(lte(on,1),${scaleW - width},max(0,x-${(scaleW - width) / (duration * fps)}))':y='(ih-oh)/2':` +
          `d=${duration * fps}:s=${width}x${height}:fps=${fps}[v]`;
        break;

      case 'pan-right':
        // Pan from left to right
        filterComplex = `[0:v]scale=${scaleW}:${scaleH},` +
          `zoompan=z='1.1':x='if(lte(on,1),0,min(${scaleW - width},x+${(scaleW - width) / (duration * fps)}))':y='(ih-oh)/2':` +
          `d=${duration * fps}:s=${width}x${height}:fps=${fps}[v]`;
        break;

      case 'pan-up':
        // Pan from bottom to top
        filterComplex = `[0:v]scale=${scaleW}:${scaleH},` +
          `zoompan=z='1.1':x='(iw-ow)/2':y='if(lte(on,1),${scaleH - height},max(0,y-${(scaleH - height) / (duration * fps)}))':` +
          `d=${duration * fps}:s=${width}x${height}:fps=${fps}[v]`;
        break;

      case 'pan-down':
        // Pan from top to bottom
        filterComplex = `[0:v]scale=${scaleW}:${scaleH},` +
          `zoompan=z='1.1':x='(iw-ow)/2':y='if(lte(on,1),0,min(${scaleH - height},y+${(scaleH - height) / (duration * fps)}))':` +
          `d=${duration * fps}:s=${width}x${height}:fps=${fps}[v]`;
        break;

      default:
        // Default to gentle zoom-in
        filterComplex = `[0:v]scale=${scaleW}:${scaleH},` +
          `zoompan=z='min(zoom+0.0005,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
          `d=${duration * fps}:s=${width}x${height}:fps=${fps}[v]`;
    }

    ffmpeg(imagePath)
      .inputOptions(['-loop', '1']) // Loop the image
      .complexFilter(filterComplex)
      .outputOptions([
        '-map', '[v]',
        '-t', duration.toString(),
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('FFMPEG Ken Burns command:', cmd);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Ken Burns progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('Ken Burns video created successfully');
        resolve();
      })
      .on('error', (err) => {
        console.error('Ken Burns error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Mix an audio track with a video
 * If video is shorter than audio, it will be looped
 * If audio is shorter than video, video will be trimmed
 */
export function mixAudioVideo(
  videoPath: string,
  audioPath: string,
  outputPath: string,
  volume: number = 1
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .complexFilter([
        // Adjust audio volume
        `[1:a]volume=${volume}[a]`,
      ])
      .outputOptions([
        '-map', '0:v', // Video from first input
        '-map', '[a]', // Audio from filter
        '-c:v', 'copy', // Copy video codec (no re-encode)
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest', // End when shortest input ends
        '-movflags', '+faststart',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('FFMPEG Mix command:', cmd);
      })
      .on('end', () => {
        console.log('Audio mixed successfully');
        resolve();
      })
      .on('error', (err) => {
        console.error('Mix audio error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Concatenate multiple videos into one
 * All videos should have the same dimensions and codec for best results
 */
export function concatenateVideos(
  videoPaths: string[],
  outputPath: string,
  transition: 'none' | 'fade' = 'none'
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (transition === 'fade') {
      // With fade transitions (more complex)
      concatenateWithFade(videoPaths, outputPath)
        .then(resolve)
        .catch(reject);
    } else {
      // Simple concatenation using concat demuxer
      const listPath = outputPath + '.txt';

      // Create concat list file
      const listContent = videoPaths
        .map((p) => `file '${p}'`)
        .join('\n');
      fs.writeFileSync(listPath, listContent);

      ffmpeg()
        .input(listPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-c', 'copy', // Copy without re-encoding (fast)
          '-movflags', '+faststart',
        ])
        .output(outputPath)
        .on('start', (cmd) => {
          console.log('FFMPEG Concat command:', cmd);
        })
        .on('end', () => {
          // Cleanup list file
          fs.unlinkSync(listPath);
          console.log('Videos concatenated successfully');
          resolve();
        })
        .on('error', (err) => {
          // Cleanup list file
          if (fs.existsSync(listPath)) fs.unlinkSync(listPath);
          console.error('Concatenate error:', err);
          reject(err);
        })
        .run();
    }
  });
}

/**
 * Concatenate videos with crossfade transitions
 */
async function concatenateWithFade(
  videoPaths: string[],
  outputPath: string,
  fadeDuration: number = 0.5
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();

    // Add all inputs
    videoPaths.forEach((p) => command.input(p));

    // Build the complex filter for xfade
    const filterParts: string[] = [];
    let lastOutput = '[0:v]';

    for (let i = 1; i < videoPaths.length; i++) {
      const output = i === videoPaths.length - 1 ? '[outv]' : `[v${i}]`;
      filterParts.push(
        `${lastOutput}[${i}:v]xfade=transition=fade:duration=${fadeDuration}:offset=0${output}`
      );
      lastOutput = output;
    }

    // Audio concat
    const audioInputs = videoPaths.map((_, i) => `[${i}:a]`).join('');
    filterParts.push(`${audioInputs}concat=n=${videoPaths.length}:v=0:a=1[outa]`);

    command
      .complexFilter(filterParts)
      .outputOptions([
        '-map', '[outv]',
        '-map', '[outa]',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('FFMPEG Concat with fade command:', cmd);
      })
      .on('end', () => {
        console.log('Videos concatenated with fade successfully');
        resolve();
      })
      .on('error', (err) => {
        console.error('Concatenate with fade error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Add captions (subtitles) to a video
 * Burns the captions into the video (hardcoded subtitles)
 */
export function addCaptions(
  videoPath: string,
  srtPath: string,
  outputPath: string,
  style: CaptionStyle = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const {
      fontName = 'Arial',
      fontSize = 24,
      fontColor = 'white',
      backgroundColor = 'black@0.5',
      position = 'bottom',
    } = style;

    // Build subtitle filter with styling
    // Note: SRT path needs to be escaped for ffmpeg filter
    const escapedSrtPath = srtPath.replace(/:/g, '\\:').replace(/\\/g, '/');

    const marginV = position === 'bottom' ? 50 : 20;
    const alignment = position === 'bottom' ? 2 : 6; // SSA alignment: 2=bottom-center, 6=top-center

    const subtitleFilter =
      `subtitles='${escapedSrtPath}':force_style='` +
      `FontName=${fontName},` +
      `FontSize=${fontSize},` +
      `PrimaryColour=&H00${colorToHex(fontColor)}&,` +
      `BackColour=&H80000000&,` +
      `BorderStyle=4,` +
      `Outline=0,` +
      `Shadow=0,` +
      `MarginV=${marginV},` +
      `Alignment=${alignment}'`;

    ffmpeg(videoPath)
      .videoFilters(subtitleFilter)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'copy', // Keep original audio
        '-movflags', '+faststart',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('FFMPEG Captions command:', cmd);
      })
      .on('end', () => {
        console.log('Captions added successfully');
        resolve();
      })
      .on('error', (err) => {
        console.error('Add captions error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Get duration of a video file
 */
export function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
}

/**
 * Convert color name to hex for ASS styling
 */
function colorToHex(color: string): string {
  const colors: Record<string, string> = {
    white: 'FFFFFF',
    black: '000000',
    red: '0000FF', // BGR format for ASS
    green: '00FF00',
    blue: 'FF0000',
    yellow: '00FFFF',
    cyan: 'FFFF00',
    magenta: 'FF00FF',
  };
  return colors[color.toLowerCase()] || 'FFFFFF';
}
