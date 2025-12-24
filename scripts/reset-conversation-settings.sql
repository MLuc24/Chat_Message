-- Reset conversation_settings table with proper UTF-8 encoding

-- Delete all existing settings
TRUNCATE TABLE conversation_settings;

-- Verify the table is empty
SELECT COUNT(*) as count FROM conversation_settings;

-- The table is now ready for new inserts with proper UTF-8 encoding
