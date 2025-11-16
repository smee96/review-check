-- 리뷰 승인 상태 필드 추가

-- reviews 테이블에 승인 관련 필드 추가
ALTER TABLE reviews ADD COLUMN approval_status TEXT DEFAULT 'pending';
ALTER TABLE reviews ADD COLUMN rejection_reason TEXT;
ALTER TABLE reviews ADD COLUMN reviewed_by INTEGER;
ALTER TABLE reviews ADD COLUMN reviewed_at DATETIME;

-- 기존 리뷰는 모두 대기중 상태로 설정
UPDATE reviews SET approval_status = 'pending' WHERE approval_status IS NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_reviews_approval_status ON reviews(approval_status);
CREATE INDEX IF NOT EXISTS idx_reviews_application_id ON reviews(application_id);
