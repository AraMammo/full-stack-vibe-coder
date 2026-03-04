-- CreateEnum
CREATE TYPE "HostingPlan" AS ENUM ('STARTER', 'GROWTH', 'SCALE');

-- AlterTable
ALTER TABLE "hosting_subscriptions" ADD COLUMN "plan" "HostingPlan" NOT NULL DEFAULT 'STARTER';
