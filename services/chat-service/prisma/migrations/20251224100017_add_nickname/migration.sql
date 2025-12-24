-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "file_type" TEXT,
ADD COLUMN     "location" JSONB,
ADD COLUMN     "media_duration" DOUBLE PRECISION,
ADD COLUMN     "media_height" INTEGER,
ADD COLUMN     "media_public_id" TEXT,
ADD COLUMN     "media_url" TEXT,
ADD COLUMN     "media_width" INTEGER,
ADD COLUMN     "thumbnail_url" TEXT;

-- CreateTable
CREATE TABLE "conversation_settings" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mute" BOOLEAN NOT NULL DEFAULT false,
    "sound" BOOLEAN NOT NULL DEFAULT true,
    "popups" BOOLEAN NOT NULL DEFAULT true,
    "hide" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_settings_user_id_idx" ON "conversation_settings"("user_id");

-- CreateIndex
CREATE INDEX "conversation_settings_conversation_id_idx" ON "conversation_settings"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_settings_conversation_id_user_id_key" ON "conversation_settings"("conversation_id", "user_id");
