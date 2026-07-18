-- AlterTable
ALTER TABLE "public"."Repository" ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "webhookId" TEXT;
