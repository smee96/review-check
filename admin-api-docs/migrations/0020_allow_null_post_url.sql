-- Allow NULL post_url in reviews table (image-only reviews for SmartStore)
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- Create temporary table with updated schema
CREATE TABLE reviews_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER UNIQUE NOT NULL,
  post_url TEXT,  -- Changed from NOT NULL to allow NULL
  image_url TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Copy existing data
INSERT INTO reviews_new (id, application_id, post_url, image_url, submitted_at, updated_at)
SELECT id, application_id, post_url, image_url, submitted_at, updated_at FROM reviews;

-- Drop old table
DROP TABLE reviews;

-- Rename new table
ALTER TABLE reviews_new RENAME TO reviews;
