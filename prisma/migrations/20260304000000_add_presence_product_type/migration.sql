-- AlterEnum
ALTER TYPE "BIABTier" ADD VALUE 'PRESENCE';

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('BUILDER', 'PRESENCE');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "productType" "ProductType" NOT NULL DEFAULT 'BUILDER';
