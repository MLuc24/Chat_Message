-- AlterTable
-- Add media_items column to support grouped media messages
ALTER TABLE "messages" ADD COLUMN "media_items" JSONB;

-- Add comment to explain the structure
COMMENT ON COLUMN "messages"."media_items" IS 'Array of media items for grouped messages. Format: [{ url: string, type: string, publicId: string, width?: number, height?: number, duration?: number, thumbnailUrl?: string }]';
