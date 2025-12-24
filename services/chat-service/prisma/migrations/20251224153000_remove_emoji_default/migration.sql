-- Remove default value from default_emoji column
ALTER TABLE "conversation_settings" ALTER COLUMN "default_emoji" DROP DEFAULT;
