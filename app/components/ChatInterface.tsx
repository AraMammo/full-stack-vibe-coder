"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  onComplete?: () => void;
}

export default function ChatInterface({ onComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Got a business idea? Test it here! Describe your idea in a few sentences (or use the mic 🎤) and I'll give you a taste of what Business in a Box can create for you.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [inputType, setInputType] = useState<"text" | "voice">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessSample, setBusinessSample] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change (but not on initial load)
  const [hasInteracted, setHasInteracted] = useState(false);
  
  useEffect(() => {
    if (hasInteracted) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, businessSample, hasInteracted]);

  const startRecording = async () => {
    setHasInteracted(true);
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
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        stream.getTracks().forEach((track) => track.stop());

        setIsTranscribing(true);

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob);

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) throw new Error("Transcription failed");

          const data = await res.json();
          setInputText(data.text);
          setInputType("voice");
        } catch (error) {
          console.error("Error transcribing:", error);
          alert(
            "Could not transcribe audio. Please try again or type your message.",
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
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
    setHasInteracted(true);

    try {
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: inputText,
        },
      ]);

      const userInputCopy = inputText;
      setInputText("");
      setInputType("text");

      const res = await fetch("/api/analyze-need", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: userInputCopy,
          inputType,
        }),
      });

      if (!res.ok) throw new Error("Failed to process request");

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.recommendation,
        },
      ]);

      setBusinessSample({
        businessName: data.businessName,
        valueProposition: data.valueProposition,
        targetAudience: data.targetAudience,
        keyFeatures: data.keyFeatures,
      });
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetFullPackage = () => {
    window.location.href = "/get-started";
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}

        {businessSample && (
          <div className="business-sample-card">
            <h3 className="sample-title">✨ Here's a Taste of What We Create:</h3>

            <div className="sample-section">
              <div className="sample-label">Business Name:</div>
              <div className="sample-value">{businessSample.businessName}</div>
            </div>

            <div className="sample-section">
              <div className="sample-label">Value Proposition:</div>
              <div className="sample-value">{businessSample.valueProposition}</div>
            </div>

            <div className="sample-section">
              <div className="sample-label">Target Audience:</div>
              <div className="sample-value">{businessSample.targetAudience}</div>
            </div>

            <div className="sample-section">
              <div className="sample-label">Key Features:</div>
              <ul className="sample-features">
                {businessSample.keyFeatures?.map((feature: string, idx: number) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleGetFullPackage}
              className="cta-button"
            >
              Get Your Complete Business Package (30 min delivery) →
            </button>
          </div>
        )}

        {/* Scroll anchor for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleTextSubmit()}
            placeholder={
              isTranscribing
                ? "Transcribing..."
                : "Type your message or use the mic..."
            }
            className="chat-input"
            disabled={isRecording || isTranscribing}
          />
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`mic-button ${isRecording ? "recording" : ""}`}
            disabled={isTranscribing}
          >
            {isRecording ? "⏹" : "🎤"}
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

      <style jsx>{`
        .chat-container {
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid #ff0080;
          border-radius: 12px;
          padding: 12px;
          margin: 15px 0;
          max-width: 1000px;
          margin-left: auto;
          margin-right: auto;
        }

        .chat-messages {
          min-height: 80px;
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 12px;
          scroll-behavior: smooth;
        }

        .message {
          margin-bottom: 8px;
          display: flex;
        }

        .message.user {
          justify-content: flex-end;
        }

        .message.assistant {
          justify-content: flex-start;
        }

        .message-content {
          padding: 6px 12px;
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

        .business-sample-card {
          margin-top: 20px;
          padding: 24px;
          background: rgba(0, 255, 136, 0.05);
          border: 2px solid #00ff88;
          border-radius: 12px;
        }

        .sample-title {
          color: #00ff88;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 20px;
          text-align: center;
        }

        .sample-section {
          margin-bottom: 16px;
        }

        .sample-label {
          color: #ff0080;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .sample-value {
          color: white;
          font-size: 16px;
          line-height: 1.5;
        }

        .sample-features {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sample-features li {
          color: white;
          font-size: 15px;
          padding: 6px 0;
          padding-left: 20px;
          position: relative;
        }

        .sample-features li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #00ff88;
          font-weight: bold;
        }

        .cta-button {
          width: 100%;
          margin-top: 20px;
          background: linear-gradient(135deg, #ff0080, #00ff88);
          color: white;
          border: none;
          padding: 16px 28px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition:
            transform 0.2s,
            box-shadow 0.2s;
          text-align: center;
        }

        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(255, 0, 128, 0.5);
        }

        .chat-input-container {
          border-top: 1px solid rgba(255, 0, 128, 0.3);
          padding-top: 10px;
        }

        .input-wrapper {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .chat-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid #00ff88;
          border-radius: 8px;
          padding: 8px 12px;
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
          width: 36px;
          height: 36px;
          font-size: 18px;
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
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
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
      `}</style>
    </div>
  );
}
