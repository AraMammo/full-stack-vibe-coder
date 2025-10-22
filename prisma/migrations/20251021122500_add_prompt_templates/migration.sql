-- CreateTable
CREATE TABLE IF NOT EXISTS "prompt_templates" (
    "id" SERIAL NOT NULL,
    "promptId" TEXT NOT NULL,
    "promptName" TEXT NOT NULL,
    "promptSection" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL,
    "estimatedTokens" INTEGER NOT NULL,
    "dependencies" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "prompt_templates_promptId_key" ON "prompt_templates"("promptId");
