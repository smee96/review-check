-- Points System for Influencers

-- Points table (포인트 내역)
CREATE TABLE IF NOT EXISTS points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,  -- 포인트 양 (양수: 적립, 음수: 차감)
  balance INTEGER NOT NULL,  -- 거래 후 잔액
  type TEXT NOT NULL CHECK(type IN ('earn', 'withdraw', 'adjust')),  -- 적립, 인출, 조정
  source TEXT NOT NULL CHECK(source IN ('campaign', 'bonus', 'withdrawal', 'admin')),  -- 출처
  reference_id INTEGER,  -- 연관 ID (campaign_id, withdrawal_id 등)
  description TEXT,  -- 상세 설명
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Withdrawal requests table (출금 요청)
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  points INTEGER NOT NULL,  -- 출금 포인트
  amount INTEGER NOT NULL,  -- 출금 금액 (1포인트 = 1원)
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'completed')),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  admin_note TEXT,  -- 관리자 메모
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add points_balance to influencer_profiles
ALTER TABLE influencer_profiles ADD COLUMN points_balance INTEGER DEFAULT 0;

-- Add point_reward to campaigns
ALTER TABLE campaigns ADD COLUMN point_reward INTEGER DEFAULT 0;  -- 캠페인 완료 시 지급 포인트

-- Indexes
CREATE INDEX idx_points_user_id ON points(user_id);
CREATE INDEX idx_points_created_at ON points(created_at);
CREATE INDEX idx_withdrawal_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);
