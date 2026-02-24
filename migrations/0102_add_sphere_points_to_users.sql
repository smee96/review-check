-- Add sphere_points column to users table
ALTER TABLE users ADD COLUMN sphere_points INTEGER DEFAULT 0;

-- Create index for sphere_points
CREATE INDEX IF NOT EXISTS idx_users_sphere_points ON users(sphere_points);
