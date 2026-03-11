/**
 * Get Started Page — Conversation-first intake
 *
 * Users describe their business in a chat interface.
 * After profile extraction completes, they proceed to checkout.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationResponse {
  sessionId: string;
  conversationId: string;
  message: string;
  complete: boolean;
  projectId?: string;
  classification?: {
    industry: string;
    templateSlug: string | null;
    confidence: string;
  };
  fieldsCollected?: string[];
  fieldsMissing?: string[];
}

export default function GetStartedPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (started) inputRef.current?.focus();
  }, [started]);

  // Redirect to sign in if not authenticated
  if (status === "loading") return null;
  if (status === "unauthenticated") {
    router.push("/auth/signin?callbackUrl=/get-started");
    return null;
  }

  const handleStart = () => {
    setStarted(true);
    setMessages([
      {
        role: "assistant",
        content:
          "Hey! I'm going to help you get a professional website up and running. Tell me about your business — what do you do, and who do you serve?",
      },
    ]);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/conversations/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId || undefined,
          message: trimmed,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to send message");
      }

      const data: ConversationResponse = await res.json();

      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      if (data.complete && data.projectId) {
        setComplete(true);
        setProjectId(data.projectId);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I hit an error: ${errorMessage}. Try sending your message again.`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleProceedToCheckout = () => {
    if (projectId) {
      router.push(`/checkout?projectId=${projectId}`);
    }
  };

  const handleBuildPreview = async () => {
    if (!projectId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewOnly: true }),
      });
      if (res.ok) {
        router.push(`/dashboard/project/${projectId}`);
      }
    } catch {
      // fall through
    } finally {
      setSending(false);
    }
  };

  // ── Pre-start state ─────────────────────────────────────────
  if (!started) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Tell us about your business
          </h1>
          <p className="text-fsvc-text-secondary mb-8 text-lg">
            Answer a few quick questions and we&apos;ll build you a professional
            website in minutes.
          </p>
          <button
            onClick={handleStart}
            className="px-8 py-4 rounded-xl bg-accent hover:bg-accent-hover text-base text-lg font-bold transition-colors"
          >
            Get Started
          </button>
          <p className="text-sm text-fsvc-text-disabled mt-4">
            No credit card required to start
          </p>
        </div>
      </main>
    );
  }

  // ── Chat interface ──────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-base/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-sm font-semibold text-white">
            Website Builder
          </h1>
          {sessionId && (
            <span className="text-xs text-fsvc-text-disabled">
              Session active
            </span>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-accent text-base"
                    : "bg-white/10 text-gray-200 border border-border"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-fsvc-text-secondary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-fsvc-text-secondary rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-fsvc-text-secondary rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Completion CTA */}
      {complete && (
        <div className="border-t border-border bg-accent-2/5 px-4 py-6">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-green-400 font-medium mb-4">
              We have everything we need to build your site!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleBuildPreview}
                disabled={sending}
                className="px-6 py-3 rounded-lg bg-white/10 border border-border text-white font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Preview for Free
              </button>
              <button
                onClick={handleProceedToCheckout}
                className="px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-base font-bold transition-colors"
              >
                Build &amp; Deploy — $497
              </button>
            </div>
            <p className="text-xs text-fsvc-text-disabled mt-3">
              Preview is free. Full deploy includes hosting, domain, and payments.
            </p>
          </div>
        </div>
      )}

      {/* Input */}
      {!complete && (
        <div className="border-t border-border bg-base/80 backdrop-blur-sm px-4 py-4">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              disabled={sending}
              className="flex-1 rounded-xl border border-border bg-white/10 px-4 py-3 text-sm text-white placeholder-fsvc-text-disabled focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-base text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
