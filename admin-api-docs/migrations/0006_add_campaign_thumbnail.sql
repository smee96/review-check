-- Add thumbnail image field to campaigns
ALTER TABLE campaigns ADD COLUMN thumbnail_image TEXT;  -- Base64 encoded image data
