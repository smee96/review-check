-- 시스템 설정 테이블 생성
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 초기 수수료 설정값 삽입
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('fee_rate_product_only', '20', '상품만 제공 시 수수료율 (%)'),
('fee_rate_voucher_only', '20', '이용권만 제공 시 수수료율 (%)'),
('fee_rate_with_points', '28', '포인트 포함 시 수수료율 (%)'),
('min_fee_product', '2000', '상품 제공 최소 수수료 (원)'),
('min_fee_voucher', '3000', '이용권 제공 최소 수수료 (원)');

-- campaigns 테이블에 과금 관련 컬럼 추가
ALTER TABLE campaigns ADD COLUMN pricing_type TEXT DEFAULT 'product_only';
-- 'product_only', 'voucher_only', 'product_with_points', 'voucher_with_points'

ALTER TABLE campaigns ADD COLUMN product_value INTEGER DEFAULT 0;
-- 상품/이용권 가치 (원)

ALTER TABLE campaigns ADD COLUMN sphere_points INTEGER DEFAULT 0;
-- 스피어포인트 (P)

-- 기존 budget 필드는 유지 (참고용)
-- platform_fee는 실시간 계산으로 처리
