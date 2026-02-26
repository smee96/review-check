-- Update reviews table for R2 storage
-- image_url will now store R2 object keys instead of base64
-- No schema changes needed, but adding updated_at for edit tracking

ALTER TABLE reviews ADD COLUMN updated_at DATETIME;
