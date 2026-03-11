/**
 * POST /api/conversations/message
 *
 * Main conversation endpoint. Handles:
 * 1. Creating new conversations (no sessionId provided)
 * 2. Continuing existing conversations (sessionId provided)
 * 3. Industry classification (first message)
 * 4. Profile extraction (subsequent messages)
 * 5. Marking conversation complete when profile is fully extracted
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@/app/generated/prisma";
import { classifyIndustry } from "@/lib/intake/classifier";
import {
  extractProfile,
  ConversationTurn,
} from "@/lib/intake/profile-extractor";
import { randomUUID } from "crypto";

/** Cast a value to Prisma-compatible JSON */
function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, message } = body as {
      sessionId?: string;
      message: string;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();

    // ── Find or create conversation ─────────────────────────────
    let conversation;
    if (sessionId) {
      conversation = await prisma.conversation.findUnique({
        where: { sessionId },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      if (conversation.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ── New conversation ────────────────────────────────────────
    if (!conversation) {
      const newSessionId = sessionId || randomUUID();

      // Classify the industry from the first message
      const classification = await classifyIndustry(trimmedMessage);

      conversation = await prisma.conversation.create({
        data: {
          sessionId: newSessionId,
          userId: session.user.id,
          status: "ACTIVE",
          industryClassification: classification.industry,
          extractedProfile: toJson({ classification }),
        },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      // Store the user's first message
      await prisma.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          role: "USER",
          content: trimmedMessage,
          metadata: toJson({ classification }),
        },
      });

      // Generate first assistant response
      const extraction = await extractProfile(
        [{ role: "user", content: trimmedMessage }],
        classification.templateSlug
      );

      // Store assistant response
      await prisma.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          role: "ASSISTANT",
          content: extraction.nextQuestion,
          metadata: toJson({
            fieldsCollected: extraction.fieldsCollected,
            fieldsMissing: extraction.fieldsMissing,
            complete: extraction.complete,
          }),
        },
      });

      // If somehow complete on first message (unlikely but handle it)
      if (extraction.complete && extraction.profile) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            status: "COMPLETED",
            extractedProfile: toJson(extraction.profile),
          },
        });
      }

      return NextResponse.json({
        sessionId: newSessionId,
        conversationId: conversation.id,
        message: extraction.nextQuestion,
        classification,
        complete: extraction.complete,
        profile: extraction.complete ? extraction.profile : null,
      });
    }

    // ── Continue existing conversation ──────────────────────────
    if (conversation.status === "COMPLETED") {
      return NextResponse.json(
        {
          error: "Conversation is already completed",
          sessionId: conversation.sessionId,
        },
        { status: 400 }
      );
    }

    // Store user message
    await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: trimmedMessage,
      },
    });

    // Build conversation history for Claude
    const history: ConversationTurn[] = conversation.messages.map((msg) => ({
      role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));
    history.push({ role: "user", content: trimmedMessage });

    // Extract profile from full conversation
    const extraction = await extractProfile(
      history,
      conversation.industryClassification
    );

    // Store assistant response
    await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: extraction.nextQuestion,
        metadata: toJson({
          fieldsCollected: extraction.fieldsCollected,
          fieldsMissing: extraction.fieldsMissing,
          complete: extraction.complete,
        }),
      },
    });

    // If extraction is complete, update conversation and create project
    if (extraction.complete && extraction.profile) {
      const project = await prisma.project.create({
        data: {
          userId: session.user.id,
          name: extraction.profile.businessName || "My Project",
          status: "CUSTOMIZING",
          industryProfile: toJson(extraction.profile),
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: "COMPLETED",
          projectId: project.id,
          extractedProfile: toJson(extraction.profile),
        },
      });

      return NextResponse.json({
        sessionId: conversation.sessionId,
        conversationId: conversation.id,
        message: extraction.nextQuestion,
        complete: true,
        profile: extraction.profile,
        projectId: project.id,
      });
    }

    return NextResponse.json({
      sessionId: conversation.sessionId,
      conversationId: conversation.id,
      message: extraction.nextQuestion,
      complete: false,
      fieldsCollected: extraction.fieldsCollected,
      fieldsMissing: extraction.fieldsMissing,
    });
  } catch (error) {
    console.error("[conversations/message] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
