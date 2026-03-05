-- AlterEnum: Add TRANSFERRED to HostingStatus
ALTER TYPE "HostingStatus" ADD VALUE 'TRANSFERRED';

-- CreateEnum: TransferStatus
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterTable: Add Neon fields to deployed_apps
ALTER TABLE "deployed_apps" ADD COLUMN "neonProjectId" TEXT;
ALTER TABLE "deployed_apps" ADD COLUMN "neonBranchId" TEXT;
ALTER TABLE "deployed_apps" ADD COLUMN "neonDatabaseUrl" TEXT;
ALTER TABLE "deployed_apps" ADD COLUMN "neonPooledUrl" TEXT;
ALTER TABLE "deployed_apps" ADD COLUMN "stripeConnectAccountType" TEXT DEFAULT 'standard';

-- Set existing Express accounts
UPDATE "deployed_apps"
SET "stripeConnectAccountType" = 'express'
WHERE "stripeConnectAccountId" IS NOT NULL;

-- CreateTable: transfer_requests
CREATE TABLE "transfer_requests" (
    "id" TEXT NOT NULL,
    "deployedAppId" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "githubTransferred" BOOLEAN NOT NULL DEFAULT false,
    "vercelTransferred" BOOLEAN NOT NULL DEFAULT false,
    "neonTransferred" BOOLEAN NOT NULL DEFAULT false,
    "stripeDisconnected" BOOLEAN NOT NULL DEFAULT false,
    "neonClaimUrl" TEXT,
    "githubTransferUrl" TEXT,
    "vercelReimportUrl" TEXT,
    "customerGithubUsername" TEXT,
    "customerEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transfer_requests_deployedAppId_idx" ON "transfer_requests"("deployedAppId");
CREATE INDEX "transfer_requests_status_idx" ON "transfer_requests"("status");

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_deployedAppId_fkey" FOREIGN KEY ("deployedAppId") REFERENCES "deployed_apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
