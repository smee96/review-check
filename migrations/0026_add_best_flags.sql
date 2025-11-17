-- Add is_best flag to campaigns table
ALTER TABLE campaigns ADD COLUMN is_best INTEGER DEFAULT 0;

-- Add is_best flag to reviews table  
ALTER TABLE reviews ADD COLUMN is_best INTEGER DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_is_best ON campaigns(is_best, status);
CREATE INDEX IF NOT EXISTS idx_reviews_is_best ON reviews(is_best);
