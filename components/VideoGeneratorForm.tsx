'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Scene {
  id: string;
  imageFile: File | null;
  audioFile: File | null;
}

interface CaptionSettings {
  fontFamily: string;
  fontSize: number;
  lineColor: string;
  wordColor: string;
  maxWordsPerLine: number;
  position: string;
  style: string;
}

const DEFAULT_CAPTION_SETTINGS: CaptionSettings = {
  fontFamily: 'The Bold Font',
  fontSize: 60,
  lineColor: '#FFFFFF',
  wordColor: '#66ff74',
  maxWordsPerLine: 3,
  position: 'bottom_center',
  style: 'highlight',
};

export default function VideoGeneratorForm() {
  const router = useRouter();
  const [scenes, setScenes] = useState<Scene[]>([
    { id: '1', imageFile: null, audioFile: null },
  ]);
  const [captionSettings, setCaptionSettings] = useState<CaptionSettings>(
    DEFAULT_CAPTION_SETTINGS
  );
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const addScene = () => {
    if (scenes.length >= 10) {
      setError('Maximum 10 scenes allowed');
      return;
    }
    setScenes([
      ...scenes,
      { id: Date.now().toString(), imageFile: null, audioFile: null },
    ]);
  };

  const removeScene = (id: string) => {
    if (scenes.length === 1) {
      setError('At least one scene is required');
      return;
    }
    setScenes(scenes.filter((scene) => scene.id !== id));
  };

  const updateSceneFile = (
    id: string,
    type: 'image' | 'audio',
    file: File | null
  ) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === id
          ? {
              ...scene,
              [type === 'image' ? 'imageFile' : 'audioFile']: file,
            }
          : scene
      )
    );
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be under 10MB');
        return;
      }
      updateSceneFile(id, 'image', file);
      setError('');
    }
  };

  const handleAudioUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError('Please upload a valid audio file (MP3, WAV)');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('Audio must be under 50MB');
        return;
      }
      updateSceneFile(id, 'audio', file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    setUploadProgress(0);

    try {
      // Validate all scenes have both files
      const invalidScenes = scenes.filter(
        (scene) => !scene.imageFile || !scene.audioFile
      );
      if (invalidScenes.length > 0) {
        throw new Error('All scenes must have both an image and audio file');
      }

      // Create form data
      const formData = new FormData();
      formData.append('sceneCount', scenes.length.toString());

      // Add caption settings
      Object.entries(captionSettings).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      // Add scene files
      scenes.forEach((scene, index) => {
        if (scene.imageFile) {
          formData.append(`scene_${index}_image`, scene.imageFile);
        }
        if (scene.audioFile) {
          formData.append(`scene_${index}_audio`, scene.audioFile);
        }
      });

      setUploadProgress(30);

      // Submit to API
      const response = await fetch('/api/faceless-video/create', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(70);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create video generation job');
      }

      setUploadProgress(100);

      // Redirect to dashboard with success message
      router.push(`/dashboard?jobId=${data.jobId}&success=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUploadProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '2px solid rgba(102, 255, 116, 0.3)',
      }}
    >
      <h2
        style={{
          fontSize: '1.8rem',
          fontWeight: '700',
          marginBottom: '1.5rem',
          color: '#66ff74',
          textAlign: 'center',
        }}
      >
        Create Faceless Video
      </h2>

      {/* Scenes Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3
          style={{
            fontSize: '1.3rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#fff',
          }}
        >
          Scenes ({scenes.length}/10)
        </h3>

        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem',
              marginBottom: '1rem',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h4 style={{ color: '#66ff74', fontWeight: '600' }}>
                Scene {index + 1}
              </h4>
              {scenes.length > 1 && (
                <button
                  onClick={() => removeScene(scene.id)}
                  style={{
                    background: 'rgba(255, 0, 128, 0.2)',
                    border: '1px solid #ff0080',
                    color: '#ff0080',
                    padding: '0.3rem 0.8rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
              {/* Image Upload */}
              <div>
                <label
                  style={{
                    display: 'block',
                    color: '#ccc',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  Image (PNG/JPG) *
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => handleImageUpload(scene.id, e)}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(102, 255, 116, 0.3)',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
                {scene.imageFile && (
                  <p style={{ color: '#66ff74', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                    ✓ {scene.imageFile.name} ({(scene.imageFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Audio Upload */}
              <div>
                <label
                  style={{
                    display: 'block',
                    color: '#ccc',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  Audio (MP3/WAV) *
                </label>
                <input
                  type="file"
                  accept="audio/mp3,audio/mpeg,audio/wav"
                  onChange={(e) => handleAudioUpload(scene.id, e)}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(102, 255, 116, 0.3)',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
                {scene.audioFile && (
                  <p style={{ color: '#66ff74', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                    ✓ {scene.audioFile.name} ({(scene.audioFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addScene}
          disabled={scenes.length >= 10}
          style={{
            width: '100%',
            padding: '0.8rem',
            background: scenes.length >= 10 ? '#555' : 'linear-gradient(135deg, #66ff74, #06b6d4)',
            border: 'none',
            color: scenes.length >= 10 ? '#999' : '#000',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: scenes.length >= 10 ? 'not-allowed' : 'pointer',
          }}
        >
          + Add Another Scene
        </button>
      </div>

      {/* Caption Settings Section */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(102, 255, 116, 0.3)',
            color: '#66ff74',
            padding: '0.8rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
            marginBottom: '1rem',
          }}
        >
          {showAdvancedSettings ? '▼' : '▶'} Caption Settings (Optional)
        </button>

        {showAdvancedSettings && (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
              {/* Font Family */}
              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Font Family
                </label>
                <select
                  value={captionSettings.fontFamily}
                  onChange={(e) =>
                    setCaptionSettings({ ...captionSettings, fontFamily: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(102, 255, 116, 0.3)',
                    color: '#fff',
                  }}
                >
                  <option value="The Bold Font">The Bold Font</option>
                  <option value="Arial">Arial</option>
                  <option value="Impact">Impact</option>
                  <option value="Helvetica">Helvetica</option>
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Font Size: {captionSettings.fontSize}px
                </label>
                <input
                  type="range"
                  min="30"
                  max="120"
                  value={captionSettings.fontSize}
                  onChange={(e) =>
                    setCaptionSettings({ ...captionSettings, fontSize: parseInt(e.target.value) })
                  }
                  style={{ width: '100%' }}
                />
              </div>

              {/* Line Color */}
              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Line Color
                </label>
                <input
                  type="color"
                  value={captionSettings.lineColor}
                  onChange={(e) =>
                    setCaptionSettings({ ...captionSettings, lineColor: e.target.value })
                  }
                  style={{ width: '100%', height: '45px' }}
                />
              </div>

              {/* Word Highlight Color */}
              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Highlight Color
                </label>
                <input
                  type="color"
                  value={captionSettings.wordColor}
                  onChange={(e) =>
                    setCaptionSettings({ ...captionSettings, wordColor: e.target.value })
                  }
                  style={{ width: '100%', height: '45px' }}
                />
              </div>

              {/* Max Words Per Line */}
              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Max Words Per Line
                </label>
                <select
                  value={captionSettings.maxWordsPerLine}
                  onChange={(e) =>
                    setCaptionSettings({ ...captionSettings, maxWordsPerLine: parseInt(e.target.value) })
                  }
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(102, 255, 116, 0.3)',
                    color: '#fff',
                  }}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              {/* Position */}
              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Caption Position
                </label>
                <select
                  value={captionSettings.position}
                  onChange={(e) =>
                    setCaptionSettings({ ...captionSettings, position: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(102, 255, 116, 0.3)',
                    color: '#fff',
                  }}
                >
                  <option value="top_center">Top Center</option>
                  <option value="center">Center</option>
                  <option value="bottom_center">Bottom Center</option>
                </select>
              </div>

              {/* Style */}
              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Caption Style
                </label>
                <select
                  value={captionSettings.style}
                  onChange={(e) =>
                    setCaptionSettings({ ...captionSettings, style: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(102, 255, 116, 0.3)',
                    color: '#fff',
                  }}
                >
                  <option value="highlight">Highlight</option>
                  <option value="outline">Outline</option>
                  <option value="shadow">Shadow</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: 'rgba(255, 0, 128, 0.1)',
            border: '2px solid rgba(255, 0, 128, 0.5)',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
            color: '#ff0080',
          }}
        >
          {error}
        </div>
      )}

      {/* Upload Progress */}
      {submitting && uploadProgress > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              height: '30px',
              position: 'relative',
              border: '1px solid rgba(102, 255, 116, 0.3)',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #66ff74, #06b6d4)',
                height: '100%',
                width: `${uploadProgress}%`,
                transition: 'width 0.3s ease',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#fff',
                fontWeight: '700',
                fontSize: '0.9rem',
              }}
            >
              {uploadProgress}%
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          width: '100%',
          padding: '1.2rem 2rem',
          background: submitting
            ? '#555'
            : 'linear-gradient(135deg, #66ff74, #06b6d4)',
          border: 'none',
          color: submitting ? '#999' : '#000',
          fontSize: '1.2rem',
          fontWeight: '700',
          cursor: submitting ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
        }}
      >
        {submitting ? 'Generating Video...' : 'Generate Video'}
      </button>

      <p
        style={{
          textAlign: 'center',
          color: '#888',
          fontSize: '0.85rem',
          marginTop: '1rem',
        }}
      >
        Processing time: ~2-5 minutes per scene. You'll be redirected to your dashboard to track progress.
      </p>
    </div>
  );
}
