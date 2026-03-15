"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import type { AnalysisData } from "./AnalysisCanvas";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface({
  onAnalysis,
  selectedName = 0,
}: {
  onAnalysis?: (analysis: AnalysisData, sessionId: string) => void;
  selectedName?: number;
}) {
  const { data: session, status: authStatus } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Tell me about your business — what do you offer, who are your customers, and how do they pay you? Even a sentence or two is enough to get started.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [inputType, setInputType] = useState<"text" | "voice">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [hostingAgreed, setHostingAgreed] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (hasInteracted && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
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
        body: JSON.stringify({
          text: userInputCopy,
          inputType,
          screenshotUrl,
          // If we already have an analysis, this is a refinement request
          ...(analysis ? { previousAnalysis: analysis, refinementMessage: userInputCopy } : {}),
        }),
      });

      if (!res.ok) throw new Error("Failed to analyze");
      const data = await res.json();

      setSessionId(data.sessionId);
      setAnalysis(data.analysis);

      // Notify parent to open canvas
      if (onAnalysis) {
        onAnalysis(data.analysis, data.sessionId);
      }

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

  const handleCheckout = async (tier: string = "TURNKEY_SYSTEM") => {
    if (!session) {
      signIn("google");
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          userEmail: session.user?.email,
          ...(sessionId ? { sessionId } : {}),
          ...(tier === "TURNKEY_SYSTEM" ? { hostingAgreed } : {}),
          ...(analysis ? { analysis, selectedNameIndex: selectedName } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout failed");
      if (data.free) {
        sessionStorage.setItem("selectedTier", data.tier);
        window.location.href = data.redirectUrl;
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Something went wrong");
      setCheckoutLoading(false);
    }
  };

  const examplePrompts = [
    "A pet sitting app for busy professionals in Austin",
    "Online booking system for a barbershop chain",
    "Subscription meal prep service for fitness enthusiasts",
    "A marketplace connecting local tutors with parents",
  ];

  return (
    <div className="w-full">
      {/* Chat Messages */}
      <div ref={chatContainerRef} className="rounded-xl bg-raised p-3 mb-3 min-h-[80px] max-h-[400px] overflow-y-auto" role="log" aria-label="Conversation" aria-live="polite">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[80%] text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-base"
                  : "bg-surface border border-border text-fsvc-text-secondary"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isSubmitting && (
          <div className="flex justify-start mb-2">
            <div className="bg-surface border border-border px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2 text-fsvc-text-disabled text-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-accent-2 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                {analysis ? "Refining your preview..." : "Analyzing your business idea..."}
              </div>
            </div>
          </div>
        )}

        {/* Compact analysis summary (details in canvas) */}
        {analysis && !isSubmitting && (
          <div className="mt-3 space-y-3">
            {/* Selected name badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
              <span className="text-xs text-accent font-semibold uppercase tracking-wide">Selected:</span>
              <span className="text-sm font-bold text-fsvc-text">{analysis.businessNames[selectedName]?.name}</span>
              <span className="text-xs text-fsvc-text-disabled">— {analysis.businessNames[selectedName]?.tagline}</span>
            </div>

            {/* Quick feature pills */}
            {analysis.features && analysis.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {analysis.features.slice(0, 6).map((f, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface border border-border text-xs text-fsvc-text-secondary"
                  >
                    {f.icon && <span>{f.icon}</span>}
                    {f.name}
                  </span>
                ))}
              </div>
            )}

            {/* Checkout Panel */}
            <div className="p-4 rounded-lg bg-surface border border-accent/30 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-fsvc-text-disabled uppercase tracking-wide font-semibold">
                  Ready to build?
                </p>
                {analysis.monetization && (
                  <span className="text-xs text-success font-medium">
                    {analysis.monetization.model} — {analysis.monetization.suggestedPricing}
                  </span>
                )}
              </div>
              <p className="text-sm text-fsvc-text-secondary leading-relaxed">
                We&apos;ll build the full app — your customers can sign up, log in, and pay you. Live on your own website in about 30 minutes.
              </p>

              {checkoutError && (
                <p className="text-xs text-error bg-error/10 border border-error/20 rounded p-2">
                  {checkoutError}
                </p>
              )}

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hostingAgreed}
                  onChange={(e) => setHostingAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-border"
                />
                <span className="text-xs text-fsvc-text-disabled">
                  I agree to $49/mo hosting after 30-day free trial. Cancel anytime.
                </span>
              </label>

              {authStatus !== "loading" && !session ? (
                <button
                  type="button"
                  onClick={() => signIn("google")}
                  className="w-full py-3 px-4 rounded-lg bg-raised border border-border text-fsvc-text font-semibold text-sm hover:bg-border transition-colors"
                >
                  Sign in with Google to continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCheckout("TURNKEY_SYSTEM")}
                  disabled={!hostingAgreed || checkoutLoading}
                  className="w-full py-3 px-4 rounded-lg gradient-bg text-white font-semibold text-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? "Processing..." : "Build & Deploy My App — $497"}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleCheckout("VALIDATION_PACK")}
                disabled={checkoutLoading}
                className="w-full text-center text-xs text-fsvc-text-disabled hover:text-fsvc-text-secondary transition-colors py-1"
              >
                Or try a free preview first
              </button>
            </div>
          </div>
        )}

        {/* end of scrollable content */}
      </div>

      {/* Example prompts — only shown before first interaction */}
      {!hasInteracted && !analysis && (
        <div className="mb-2 px-1">
          <p className="text-xs text-fsvc-text-disabled mb-1.5">Try an example:</p>
          <div className="flex flex-wrap gap-1.5">
            {examplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(prompt);
                  setHasInteracted(true);
                }}
                className="px-2.5 py-1 rounded-md bg-surface border border-border text-xs text-fsvc-text-secondary hover:border-accent/40 hover:text-fsvc-text transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Screenshot Preview */}
      {screenshotPreview && (
        <div className="mb-2 flex items-center gap-2 px-2">
          <img
            src={screenshotPreview}
            alt="Screenshot preview"
            className="h-12 w-12 rounded object-cover border border-border"
          />
          <span className="text-xs text-fsvc-text-disabled flex-1 truncate">
            {screenshotFile?.name}
          </span>
          <button
            type="button"
            onClick={() => {
              setScreenshotFile(null);
              setScreenshotPreview(null);
            }}
            className="text-xs text-error hover:text-error/80"
          >
            Remove
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-center" role="form" aria-label="Describe your business idea">
        {/* Hidden file input */}
        <input
          ref={screenshotInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          aria-hidden="true"
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
          className="w-11 h-11 flex items-center justify-center rounded-lg border border-border bg-surface hover:bg-raised transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Upload a screenshot of a site you like"
          title="Upload a screenshot of a site you like (optional)"
        >
          <svg className="w-5 h-5 text-fsvc-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <label htmlFor="business-idea-input" className="sr-only">Describe your business idea</label>
        <input
          id="business-idea-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleTextSubmit()}
          placeholder={
            isTranscribing
              ? "Transcribing..."
              : analysis
              ? "Request changes — \"make it darker\", \"add testimonials\", \"more modern\"..."
              : "What do you sell, who do you serve, and how do they pay?"
          }
          aria-describedby="input-help"
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-fsvc-text text-base placeholder-fsvc-text-disabled focus:outline-none focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(255,92,53,0.12)] transition-colors"
          disabled={isRecording || isTranscribing || isSubmitting}
        />
        <span id="input-help" className="sr-only">
          {analysis
            ? "Describe what you'd like to change about the preview"
            : "Tell us about your business in a sentence or two"}
        </span>
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing || isSubmitting}
          className={`w-11 h-11 flex items-center justify-center rounded-lg border transition-all text-lg ${
            isRecording
              ? "border-error/50 bg-error/20 animate-pulse"
              : "border-border bg-surface hover:bg-raised"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={isRecording ? "Stop recording voice note" : "Record a voice note"}
        >
          {isRecording ? "⏹" : "🎤"}
        </button>
        <button
          type="button"
          onClick={handleTextSubmit}
          disabled={!inputText.trim() || isRecording || isTranscribing || isSubmitting}
          className="px-6 py-3 rounded-lg gradient-bg text-white font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isSubmitting ? "Sending..." : "Send message"}
        >
          {isSubmitting ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
