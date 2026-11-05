ALTER TABLE "Media" ADD COLUMN "thumbnailUrl" TEXT;
CREATE INDEX "Media_createdAt_idx" ON "Media"("createdAt");
