-- Add user_ips table for rate limiting
-- This table tracks IP addresses for signup rate limiting (1 signup per IP per 24 hours)

CREATE TABLE IF NOT EXISTS user_ips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ip_address TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_ips_ip_address ON user_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_ips_created_at ON user_ips(created_at);
