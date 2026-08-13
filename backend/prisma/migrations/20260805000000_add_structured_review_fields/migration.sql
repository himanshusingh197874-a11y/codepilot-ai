-- Persist the complete repository-level Gemini review, rather than only its score.
CREATE TYPE "public"."ReviewVerdict" AS ENUM ('approve', 'request_changes');

ALTER TABLE "public"."Review"
  ADD COLUMN "positives" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "issues" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "suggestions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "verdict" "public"."ReviewVerdict" NOT NULL DEFAULT 'approve';
