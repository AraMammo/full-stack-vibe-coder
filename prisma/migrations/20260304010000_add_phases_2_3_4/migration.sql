-- Phase 2: Visual DNA fields on Project
ALTER TABLE "projects" ADD COLUMN "referenceScreenshotUrl" TEXT;
ALTER TABLE "projects" ADD COLUMN "visualDna" JSONB;

-- Phase 3: Change Requests
CREATE TABLE "change_requests" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userMessage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "affectedFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "diffSummary" TEXT,
    "deployUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "change_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "change_requests_projectId_idx" ON "change_requests"("projectId");
CREATE INDEX "change_requests_status_idx" ON "change_requests"("status");
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Phase 4: OpenClaw Sessions
CREATE TABLE "openclaw_sessions" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'AWAITING_SCREENSHOTS',
    "projectId" TEXT,
    "userId" TEXT,
    "screenshots" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openclaw_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "openclaw_sessions_chatId_key" ON "openclaw_sessions"("chatId");
CREATE INDEX "openclaw_sessions_chatId_idx" ON "openclaw_sessions"("chatId");
CREATE INDEX "openclaw_sessions_state_idx" ON "openclaw_sessions"("state");
