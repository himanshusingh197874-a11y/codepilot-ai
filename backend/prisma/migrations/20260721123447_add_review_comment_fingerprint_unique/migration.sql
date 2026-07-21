-- DropForeignKey
ALTER TABLE "public"."ReviewComment" DROP CONSTRAINT "ReviewComment_reviewId_fkey";

-- AddForeignKey
ALTER TABLE "public"."ReviewComment" ADD CONSTRAINT "ReviewComment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
