'use client';

import { useState, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  onComplete?: () => void;
}

export default function ChatInterface({ onComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hey! Tell me what you're working on or what you need help with. I'll point you in the right direction." 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        setIsTranscribing(true);
        
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob);

          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) throw new Error('Transcription failed');

          const data = await res.json();
          setInputText(data.text);
          setInputType('voice');
        } catch (error) {
          console.error('Error transcribing:', error);
          alert('Could not transcribe audio. Please try again or type your message.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;

    setIsSubmitting(true);

    try {
      setMessages(prev => [...prev, { 
        role: 'user', 
        content: inputText
      }]);

      const userInputCopy = inputText;
      setInputText('');
      setInputType('text');

      const res = await fetch('/api/analyze-need', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: userInputCopy,
          inputType,
        }),
      });

      if (!res.ok) throw new Error('Failed to process request');

      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.recommendation 
      }]);
      
      setRecommendation(data.recommendedProduct);
      
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductClick = (product: string) => {
    setShowContactModal(true);
  };

  const handleContactSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      alert('Please provide both name and email');
      return;
    }

    try {
      await fetch('/api/save-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          recommendedProduct: recommendation,
        }),
      });

      if (recommendation === 'branding') {
        window.location.href = '/branding';
      } else if (recommendation === 'tools') {
        window.location.href = '/tools';
      } else if (recommendation === 'automation') {
        window.location.href = '/automate';
      }
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
        
        {recommendation && (
          <div className="recommendation-cta">
            <button 
              onClick={() => handleProductClick(recommendation)}
              className="cta-button"
            >
              {recommendation === 'branding' && 'Get Your Branding Package →'}
              {recommendation === 'tools' && 'Browse Automation Tools →'}
              {recommendation === 'automation' && 'See Case Studies →'}
            </button>
          </div>
        )}
      </div>

      <div className="chat-input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
            placeholder={isTranscribing ? "Transcribing..." : "Type your message or use the mic..."}
            className="chat-input"
            disabled={isRecording || isTranscribing}
          />
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`mic-button ${isRecording ? 'recording' : ''}`}
            disabled={isTranscribing}
          >
            {isRecording ? '⏹' : '🎤'}
          </button>
          <button
            onClick={handleTextSubmit}
            disabled={!inputText.trim() || isRecording || isTranscribing}
            className="send-button"
          >
            Send
          </button>
        </div>
      </div>

      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Let's get you started</h3>
            <p>Just need your contact info to continue</p>
            
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="modal-input"
            />
            
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="modal-input"
            />
            
            <div className="modal-buttons">
              <button 
                onClick={() => setShowContactModal(false)}
                className="modal-button cancel"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleContactSubmit}
                className="modal-button submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .chat-container {
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid #ff0080;
          border-radius: 12px;
          padding: 24px;
          margin: 40px 0;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .chat-messages {
          min-height: 200px;
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 20px;
        }

        .message {
          margin-bottom: 16px;
          display: flex;
        }

        .message.user {
          justify-content: flex-end;
        }

        .message.assistant {
          justify-content: flex-start;
        }

        .message-content {
          padding: 12px 16px;
          border-radius: 8px;
          max-width: 70%;
        }

        .message.user .message-content {
          background: #ff0080;
          color: white;
        }

        .message.assistant .message-content {
          background: rgba(0, 255, 136, 0.2);
          border: 1px solid #00ff88;
          color: #00ff88;
        }

        .recommendation-cta {
          margin-top: 20px;
          text-align: center;
        }

        .cta-button {
          background: linear-gradient(135deg, #ff0080, #00ff88);
          color: white;
          border: none;
          padding: 14px 28px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 0, 128, 0.4);
        }

        .chat-input-container {
          border-top: 1px solid rgba(255, 0, 128, 0.3);
          padding-top: 16px;
        }

        .input-wrapper {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .chat-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid #00ff88;
          border-radius: 8px;
          padding: 12px 16px;
          color: white;
          font-size: 14px;
        }

        .chat-input:focus {
          outline: none;
          border-color: #ff0080;
        }

        .mic-button {
          background: rgba(0, 170, 255, 0.2);
          border: 2px solid #00aaff;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .mic-button:hover:not(:disabled) {
          background: rgba(0, 170, 255, 0.4);
        }

        .mic-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mic-button.recording {
          background: rgba(255, 0, 0, 0.3);
          border-color: #ff0000;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .send-button {
          background: #ff0080;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }

        .send-button:hover:not(:disabled) {
          background: #cc0066;
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #1a1a1a;
          border: 2px solid #ff0080;
          border-radius: 12px;
          padding: 32px;
          max-width: 400px;
          width: 90%;
        }

        .modal-content h3 {
          color: #ff0080;
          margin: 0 0 8px 0;
        }

        .modal-content p {
          color: #00ff88;
          margin: 0 0 24px 0;
        }

        .modal-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid #00ff88;
          border-radius: 8px;
          padding: 12px;
          color: white;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .modal-input:focus {
          outline: none;
          border-color: #ff0080;
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-button {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .modal-button.cancel {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .modal-button.submit {
          background: #ff0080;
          color: white;
        }

        .modal-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .modal-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
