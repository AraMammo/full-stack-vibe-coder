-- Faceless Video Generator Schema
-- Run this in Supabase SQL Editor or via migration

-- Note: Supabase uses gen_random_uuid() by default

-- Story status enum
CREATE TYPE story_status AS ENUM (
  'pending',
  'generating_story',
  'generating_scenes',
  'generating_media',
  'building_video',
  'adding_captions',
  'completed',
  'failed'
);

-- Shot/Scene media status
CREATE TYPE media_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

-- Story Types (configuration)
CREATE TABLE IF NOT EXISTS story_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  width INTEGER NOT NULL DEFAULT 1080,
  height INTEGER NOT NULL DEFAULT 1920,
  aspect_ratio VARCHAR(10) GENERATED ALWAYS AS (width || ':' || height) STORED,

  -- Prompts for AI generation
  story_system_prompt TEXT DEFAULT 'You''re an expert storyteller and script writer.',
  story_user_prompt TEXT DEFAULT 'Rewrite the story above into a captivating 200 word narrative.',
  scene_prompt TEXT,
  shot_system_prompt TEXT,
  shot_user_prompt TEXT,
  image_prompt_template TEXT,

  -- Caption settings
  captions_enabled BOOLEAN DEFAULT true,
  caption_font VARCHAR(100) DEFAULT 'Arial',
  caption_size INTEGER DEFAULT 32,
  caption_color VARCHAR(20) DEFAULT 'white',
  caption_position VARCHAR(20) DEFAULT 'bottom',

  -- Voice settings
  voice_id VARCHAR(100) DEFAULT 'EXAVITQu4vr4xnSDxMaL', -- ElevenLabs Sarah

  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255), -- NextAuth user ID

  name VARCHAR(255) NOT NULL,
  story_type_id UUID REFERENCES story_types(id),

  -- Source content
  source_content TEXT NOT NULL,
  source_type VARCHAR(20) DEFAULT 'text', -- text, url, audio

  -- Generated content
  generated_story TEXT,

  -- Status tracking
  status story_status DEFAULT 'pending',
  error_message TEXT,
  progress INTEGER DEFAULT 0, -- 0-100

  -- Final outputs
  final_video_url TEXT,
  final_video_captioned_url TEXT,
  srt_content TEXT,

  -- Metadata
  total_scenes INTEGER DEFAULT 0,
  total_shots INTEGER DEFAULT 0,
  duration_seconds DECIMAL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Scenes
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,

  name VARCHAR(255),
  script TEXT NOT NULL,
  sort_order INTEGER NOT NULL,

  -- Media outputs
  video_url TEXT,

  -- Status
  status media_status DEFAULT 'pending',
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shots
CREATE TABLE IF NOT EXISTS shots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,

  name VARCHAR(255),
  script TEXT NOT NULL,
  sort_order INTEGER NOT NULL,

  -- Generated prompts
  image_prompt TEXT,

  -- Media URLs
  image_url TEXT,
  audio_url TEXT,
  video_url TEXT,        -- Ken Burns video from image
  final_video_url TEXT,  -- Video with audio mixed

  -- Metadata
  audio_duration DECIMAL,

  -- Status tracking for each media type
  image_status media_status DEFAULT 'pending',
  audio_status media_status DEFAULT 'pending',
  video_status media_status DEFAULT 'pending',
  final_status media_status DEFAULT 'pending',

  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_scenes_story_id ON scenes(story_id);
CREATE INDEX idx_shots_scene_id ON shots(scene_id);
CREATE INDEX idx_shots_story_id ON shots(story_id);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER scenes_updated_at
  BEFORE UPDATE ON scenes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shots_updated_at
  BEFORE UPDATE ON shots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default story types
INSERT INTO story_types (name, description, width, height, story_system_prompt, story_user_prompt, scene_prompt, shot_system_prompt, shot_user_prompt, image_prompt_template) VALUES
(
  'Comic Book News',
  'Dynamic comic book style illustrations for news stories',
  1080,
  1920,
  'You''re a news journalist who writes engaging, dramatic stories.',
  'Rewrite the story above into a captivating 200 word news narrative that would work well as a short video script.',
  'Review the story text provided above and break it down into 3-5 logical scenes. Each scene should be a direct excerpt from the original text. Use JSON format: {"scenes": [{"scene": {"script": "...", "name": "..."}}]}',
  'You''re an expert story teller responsible for breaking up scenes into shots for a video.',
  'Break this scene into 3-6 shots of 6-8 words each. Use JSON format: {"shots": [{"shot": {"script": "...", "name": "..."}}]}',
  'Create a vivid, dynamic comic book illustration of the following scene. Use bold colors, dramatic lighting, and comic book style rendering: '
),
(
  'Classic Dramatic Movie',
  'Cinematic dramatic movie style for storytelling',
  1920,
  1080,
  'You''re a Hollywood screenwriter known for dramatic, emotional narratives.',
  'Rewrite this into a 200 word dramatic movie-style narrative with vivid descriptions and emotional depth.',
  'Break this story into 3-5 cinematic scenes. Each scene should capture a key moment. Use JSON format: {"scenes": [{"scene": {"script": "...", "name": "..."}}]}',
  'You''re a film director breaking scenes into compelling shots.',
  'Break this scene into 3-6 cinematic shots of 6-8 words each. Use JSON format: {"shots": [{"shot": {"script": "...", "name": "..."}}]}',
  'Create a cinematic, photorealistic movie still of: '
),
(
  'Faceless YouTube Video',
  'Engaging style for faceless YouTube content',
  1920,
  1080,
  'You''re a YouTube content creator who makes engaging educational videos.',
  'Rewrite this into a 200 word engaging YouTube video script that hooks viewers and explains the topic clearly.',
  'Break this into 3-5 segments suitable for a YouTube video. Use JSON format: {"scenes": [{"scene": {"script": "...", "name": "..."}}]}',
  'You''re creating shots for an engaging YouTube video.',
  'Break this segment into 3-6 shots of 6-8 words each for text overlays. Use JSON format: {"shots": [{"shot": {"script": "...", "name": "..."}}]}',
  'Create a clean, professional illustration suitable for a YouTube video about: '
);

-- Row Level Security (RLS) - enable for multi-tenant security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shots ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users to see their own data
CREATE POLICY "Users can view their own stories" ON stories
  FOR SELECT USING (user_id = auth.uid()::text OR user_id IS NULL);

CREATE POLICY "Users can insert their own stories" ON stories
  FOR INSERT WITH CHECK (user_id = auth.uid()::text OR user_id IS NULL);

CREATE POLICY "Users can update their own stories" ON stories
  FOR UPDATE USING (user_id = auth.uid()::text OR user_id IS NULL);

-- Service role can do everything (for our API)
CREATE POLICY "Service role full access to stories" ON stories
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to scenes" ON scenes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to shots" ON shots
  FOR ALL USING (auth.role() = 'service_role');
