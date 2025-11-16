-- 기존 출금 신청 테이블 삭제 (구조가 다르므로)
DROP TABLE IF EXISTS withdrawal_requests;

-- 포인트 출금 신청 테이블 재생성
CREATE TABLE withdrawal_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL, -- 출금 요청 포인트
  tax_amount INTEGER NOT NULL, -- 원천징수 세금 (22%)
  net_amount INTEGER NOT NULL, -- 실지급액 (세후)
  bank_name TEXT NOT NULL, -- 은행명
  account_number TEXT NOT NULL, -- 계좌번호
  account_holder TEXT NOT NULL, -- 예금주
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
  admin_memo TEXT, -- 관리자 메모
  processed_at DATETIME, -- 처리 완료 시각
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 인덱스 추가
CREATE INDEX idx_withdrawal_user ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);
