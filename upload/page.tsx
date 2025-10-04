'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function UploadPage() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied. Please enable microphone access and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob || !sessionId) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-note.webm');
    formData.append('sessionId', sessionId);

    try {
      const response = await fetch('/api/upload-voice', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        router.push('/success');
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1 className="upload-title" data-text="VOICE NOTE">VOICE NOTE</h1>

        <p className="upload-instructions">
          Tell us about your business idea. Speak for 1-5 minutes. Include:
        </p>

        <ul className="upload-checklist">
          <li>• What problem does your business solve?</li>
          <li>• Who is your target customer?</li>
          <li>• What makes your approach unique?</li>
          <li>• Any specific branding ideas you have?</li>
        </ul>

        <div className="recorder-container">
          {!recording && !audioBlob && (
            <button className="record-btn" onClick={startRecording}>
              🎤 Start Recording
            </button>
          )}

          {recording && (
            <div className="recording-active">
              <div className="pulse"></div>
              <p>Recording...</p>
              <button className="stop-btn" onClick={stopRecording}>
                ⏹ Stop Recording
              </button>
            </div>
          )}

          {audioBlob && !recording && (
            <div className="recording-complete">
              <p>✓ Recording Complete!</p>
              <audio controls src={URL.createObjectURL(audioBlob)} />
              <div className="upload-actions">
                <button 
                  className="upload-btn"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Submit & Build My Business →'}
                </button>
                <button 
                  className="rerecord-btn"
                  onClick={() => setAudioBlob(null)}
                >
                  Re-record
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
