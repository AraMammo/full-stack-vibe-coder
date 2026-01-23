/**
 * Faceless Video Generator - Supabase Client
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Story, Scene, Shot, StoryType, CreateStoryInput, StoryStatus, MediaStatus } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for server-side operations
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

export class FacelessVideoDB {
  // ==================== Story Types ====================

  async getStoryTypes(): Promise<StoryType[]> {
    const { data, error } = await supabase
      .from('story_types')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getStoryType(id: string): Promise<StoryType | null> {
    const { data, error } = await supabase
      .from('story_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ==================== Stories ====================

  async createStory(input: CreateStoryInput): Promise<Story> {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        name: input.name,
        story_type_id: input.story_type_id,
        source_content: input.source_content,
        source_type: input.source_type || 'text',
        user_id: input.user_id,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getStory(id: string): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        story_type:story_types(*),
        scenes(
          *,
          shots(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Sort scenes and shots by sort_order
    if (data?.scenes) {
      data.scenes.sort((a: Scene, b: Scene) => a.sort_order - b.sort_order);
      data.scenes.forEach((scene: Scene) => {
        if (scene.shots) {
          scene.shots.sort((a: Shot, b: Shot) => a.sort_order - b.sort_order);
        }
      });
    }

    return data;
  }

  async getStoriesByUser(userId: string, limit = 20): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*, story_type:story_types(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<Story> {
    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStoryStatus(
    id: string,
    status: StoryStatus,
    progress?: number,
    errorMessage?: string
  ): Promise<void> {
    const updates: Partial<Story> = { status };
    if (progress !== undefined) updates.progress = progress;
    if (errorMessage) updates.error_message = errorMessage;
    if (status === 'completed') updates.completed_at = new Date().toISOString();

    await this.updateStory(id, updates);
  }

  async deleteStory(id: string): Promise<void> {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== Scenes ====================

  async createScene(scene: Omit<Scene, 'id' | 'created_at' | 'updated_at'>): Promise<Scene> {
    const { data, error } = await supabase
      .from('scenes')
      .insert(scene)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createScenes(scenes: Omit<Scene, 'id' | 'created_at' | 'updated_at'>[]): Promise<Scene[]> {
    const { data, error } = await supabase
      .from('scenes')
      .insert(scenes)
      .select();

    if (error) throw error;
    return data || [];
  }

  async getScenesByStory(storyId: string): Promise<Scene[]> {
    const { data, error } = await supabase
      .from('scenes')
      .select('*, shots(*)')
      .eq('story_id', storyId)
      .order('sort_order');

    if (error) throw error;

    // Sort shots
    data?.forEach((scene: Scene) => {
      if (scene.shots) {
        scene.shots.sort((a: Shot, b: Shot) => a.sort_order - b.sort_order);
      }
    });

    return data || [];
  }

  async updateScene(id: string, updates: Partial<Scene>): Promise<Scene> {
    const { data, error } = await supabase
      .from('scenes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== Shots ====================

  async createShot(shot: Omit<Shot, 'id' | 'created_at' | 'updated_at'>): Promise<Shot> {
    const { data, error } = await supabase
      .from('shots')
      .insert(shot)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createShots(shots: Omit<Shot, 'id' | 'created_at' | 'updated_at'>[]): Promise<Shot[]> {
    const { data, error } = await supabase
      .from('shots')
      .insert(shots)
      .select();

    if (error) throw error;
    return data || [];
  }

  async getShot(id: string): Promise<Shot | null> {
    const { data, error } = await supabase
      .from('shots')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getShotsByScene(sceneId: string): Promise<Shot[]> {
    const { data, error } = await supabase
      .from('shots')
      .select('*')
      .eq('scene_id', sceneId)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  }

  async getShotsByStory(storyId: string): Promise<Shot[]> {
    const { data, error } = await supabase
      .from('shots')
      .select('*')
      .eq('story_id', storyId)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  }

  async updateShot(id: string, updates: Partial<Shot>): Promise<Shot> {
    const { data, error } = await supabase
      .from('shots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateShotMediaStatus(
    id: string,
    mediaType: 'image' | 'audio' | 'video' | 'final',
    status: MediaStatus,
    url?: string,
    errorMessage?: string
  ): Promise<void> {
    const updates: Partial<Shot> = {
      [`${mediaType}_status`]: status,
    };
    if (url) updates[`${mediaType === 'final' ? 'final_video' : mediaType}_url`] = url;
    if (errorMessage) updates.error_message = errorMessage;

    await this.updateShot(id, updates);
  }

  // ==================== Progress Calculation ====================

  async calculateProgress(storyId: string): Promise<{
    progress: number;
    totalShots: number;
    completedShots: number;
  }> {
    const shots = await this.getShotsByStory(storyId);
    const totalShots = shots.length;

    if (totalShots === 0) return { progress: 0, totalShots: 0, completedShots: 0 };

    // Each shot has 4 stages: image, audio, video, final
    // Total steps = totalShots * 4 + 2 (story gen + scene gen) + 2 (combine + captions)
    const totalSteps = totalShots * 4 + 4;

    let completedSteps = 2; // Story and scene generation
    let completedShots = 0;

    for (const shot of shots) {
      if (shot.image_status === 'completed') completedSteps++;
      if (shot.audio_status === 'completed') completedSteps++;
      if (shot.video_status === 'completed') completedSteps++;
      if (shot.final_status === 'completed') {
        completedSteps++;
        completedShots++;
      }
    }

    const progress = Math.round((completedSteps / totalSteps) * 100);

    return { progress: Math.min(progress, 100), totalShots, completedShots };
  }
}

// Export singleton instance
export const db = new FacelessVideoDB();
