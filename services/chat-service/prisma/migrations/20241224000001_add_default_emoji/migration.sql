-- Add defaultEmoji column to conversation_settings
ALTER TABLE "conversation_settings" ADD COLUMN "default_emoji" TEXT DEFAULT '👍';
