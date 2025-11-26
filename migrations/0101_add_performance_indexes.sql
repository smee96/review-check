-- Add performance indexes for campaign queries

-- Index for applications.campaign_id (서브쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_applications_campaign_id ON applications(campaign_id);

-- Composite index for campaigns sorting (status + created_at)
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created ON campaigns(status, created_at DESC);

-- Index for campaigns.created_at (정렬 성능 개선)
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
