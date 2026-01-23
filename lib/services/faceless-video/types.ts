/**
 * Faceless Video Generator - Type Definitions
 */

export type StoryStatus =
  | 'pending'
  | 'generating_story'
  | 'generating_scenes'
  | 'generating_media'
  | 'building_video'
  | 'adding_captions'
  | 'completed'
  | 'failed';

export type MediaStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface StoryType {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  aspect_ratio: string;
  story_system_prompt?: string;
  story_user_prompt?: string;
  scene_prompt?: string;
  shot_system_prompt?: string;
  shot_user_prompt?: string;
  image_prompt_template?: string;
  captions_enabled: boolean;
  caption_font?: string;
  caption_size?: number;
  caption_color?: string;
  caption_position?: string;
  voice_id?: string;
  active: boolean;
}

export interface Story {
  id: string;
  user_id?: string;
  name: string;
  story_type_id?: string;
  source_content: string;
  source_type: 'text' | 'url' | 'audio';
  generated_story?: string;
  status: StoryStatus;
  error_message?: string;
  progress: number;
  final_video_url?: string;
  final_video_captioned_url?: string;
  srt_content?: string;
  total_scenes: number;
  total_shots: number;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;

  // Joined data
  story_type?: StoryType;
  scenes?: Scene[];
}

export interface Scene {
  id: string;
  story_id: string;
  name?: string;
  script: string;
  sort_order: number;
  video_url?: string;
  status: MediaStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  shots?: Shot[];
}

export interface Shot {
  id: string;
  scene_id: string;
  story_id: string;
  name?: string;
  script: string;
  sort_order: number;
  image_prompt?: string;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
  final_video_url?: string;
  audio_duration?: number;
  image_status: MediaStatus;
  audio_status: MediaStatus;
  video_status: MediaStatus;
  final_status: MediaStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStoryInput {
  name: string;
  story_type_id: string;
  source_content: string;
  source_type?: 'text' | 'url' | 'audio';
  user_id?: string;
}

export interface StoryProgress {
  status: StoryStatus;
  progress: number;
  current_step: string;
  total_scenes: number;
  total_shots: number;
  completed_shots: number;
  error_message?: string;
}
