"use client";

import { useState, useRef, useEffect } from "react";

interface BusinessName {
  name: string;
  tagline: string;
}

interface AudienceSegment {
  segment: string;
  description: string;
}

interface ShipKitAnalysis {
  businessNames: BusinessName[];
  valueProposition: string;
  targetAudience: AudienceSegment[];
  competitivePositioning: string;
  sitePreviewHtml: string;
  message: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Tell me your business idea — type it out or hit the mic. In 60 seconds, you'll have business names, a target audience, competitive positioning, and a site mockup. Free, no signup.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [inputType, setInputType] = useState<"text" | "voice">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<ShipKitAnalysis | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<number | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (hasInteracted) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, analysis, hasInteracted]);

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
          alert("Could not transcribe audio. Please try again or type your message.");
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
      setMessages((prev) => [...prev, { role: "user", content: inputText }]);

      const userInputCopy = inputText;
      setInputText("");
      setInputType("text");

      // Upload screenshot if present
      let screenshotUrl: string | undefined;
      if (screenshotFile) {
        try {
          const formData = new FormData();
          formData.append("file", screenshotFile);
          const uploadRes = await fetch("/api/upload-screenshot", {
            method: "POST",
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            screenshotUrl = uploadData.url;
          }
        } catch (uploadErr) {
          console.error("Screenshot upload failed:", uploadErr);
        }
        setScreenshotFile(null);
        setScreenshotPreview(null);
      }

      const res = await fetch("/api/shipkit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userInputCopy, inputType, screenshotUrl }),
      });

      if (!res.ok) throw new Error("Failed to analyze");
      const data = await res.json();

      setSessionId(data.sessionId);
      setAnalysis(data.analysis);
      setSelectedName(0);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.analysis.message },
      ]);
    } catch (error) {
      console.error("Error submitting:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetFullShipKit = () => {
    const params = new URLSearchParams();
    if (sessionId) params.set("sessionId", sessionId);
    window.location.href = `/get-started?${params.toString()}`;
  };

  return (
    <div className="w-full">
      {/* Chat Messages */}
      <div className="rounded-xl bg-white/5 p-3 mb-3 min-h-[80px] max-h-[400px] overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[80%] text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white"
                  : "bg-white/5 border border-white/10 text-gray-300"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isSubmitting && (
          <div className="flex justify-start mb-2">
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                Analyzing your business idea...
              </div>
            </div>
          </div>
        )}

        {/* Interactive Business Brief */}
        {analysis && (
          <div className="mt-4 space-y-4">
            {/* Business Name Options */}
            <div>
              <p className="text-xs font-semibold text-pink-400 uppercase tracking-wide mb-2">
                Business Name Options
              </p>
              <div className="grid gap-2">
                {analysis.businessNames.map((bn, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedName(idx)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      selectedName === idx
                        ? "border-pink-500/50 bg-pink-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <p className="font-semibold text-white text-sm">{bn.name}</p>
                    <p className="text-xs text-gray-400">{bn.tagline}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Value Proposition */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-pink-500/5 to-cyan-500/5 border border-white/10">
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-1">
                Value Proposition
              </p>
              <p className="text-white text-sm leading-relaxed">
                {analysis.valueProposition}
              </p>
            </div>

            {/* Target Audience */}
            <div>
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">
                Target Audience
              </p>
              <div className="grid gap-2">
                {analysis.targetAudience.map((seg, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-white/5 border border-white/10"
                  >
                    <p className="font-medium text-white text-sm">{seg.segment}</p>
                    <p className="text-xs text-gray-400">{seg.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitive Positioning */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-1">
                Competitive Edge
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                {analysis.competitivePositioning}
              </p>
            </div>

            {/* Site Preview */}
            <div>
              <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2">
                Site Preview
              </p>
              <div
                className="rounded-lg overflow-hidden border border-white/10"
                dangerouslySetInnerHTML={{ __html: analysis.sitePreviewHtml }}
              />
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleGetFullShipKit}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Get Your Full ShipKit →
            </button>
            <p className="text-center text-xs text-gray-500">
              Full-stack app — $497, deployed and live
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Screenshot Preview */}
      {screenshotPreview && (
        <div className="mb-2 flex items-center gap-2 px-2">
          <img
            src={screenshotPreview}
            alt="Screenshot preview"
            className="h-12 w-12 rounded object-cover border border-white/20"
          />
          <span className="text-xs text-gray-400 flex-1 truncate">
            {screenshotFile?.name}
          </span>
          <button
            type="button"
            onClick={() => {
              setScreenshotFile(null);
              setScreenshotPreview(null);
            }}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-center">
        {/* Hidden file input */}
        <input
          ref={screenshotInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.size > 5 * 1024 * 1024) {
                alert("Screenshot must be under 5MB");
                return;
              }
              setScreenshotFile(file);
              setScreenshotPreview(URL.createObjectURL(file));
            }
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => screenshotInputRef.current?.click()}
          disabled={isRecording || isTranscribing || isSubmitting}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Upload screenshot"
          title="Upload a screenshot of a site you like (optional)"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleTextSubmit()}
          placeholder={
            isTranscribing
              ? "Transcribing..."
              : "Describe your business idea..."
          }
          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-base placeholder-gray-400 focus:outline-none focus:border-pink-500/50 focus:bg-white/15 transition-colors"
          disabled={isRecording || isTranscribing || isSubmitting}
        />
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing || isSubmitting}
          className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all text-lg ${
            isRecording
              ? "border-red-500/50 bg-red-500/20 animate-pulse"
              : "border-white/10 bg-white/5 hover:bg-white/10"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? "⏹" : "🎤"}
        </button>
        <button
          type="button"
          onClick={handleTextSubmit}
          disabled={!inputText.trim() || isRecording || isTranscribing || isSubmitting}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white text-base font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
