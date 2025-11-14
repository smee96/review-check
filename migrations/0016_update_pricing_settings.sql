-- 포인트만 지급 설정 추가 및 최소 수수료 통일

-- 포인트만 지급 설정 추가
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('fee_rate_points_only', '20', '포인트만 지급 시 수수료율 (%)'),
('min_fee_points', '3000', '포인트만 지급 최소 수수료 (원)'),
('min_fee_with_points', '5000', '상품/이용권 + 포인트 최소 수수료 (원)');

-- 기존 최소 수수료 통일 (상품: 2000 → 3000)
UPDATE system_settings SET setting_value = '3000' WHERE setting_key = 'min_fee_product';

-- 설명 업데이트
UPDATE system_settings SET description = '상품만 제공 시 최소 수수료 (원)' WHERE setting_key = 'min_fee_product';
UPDATE system_settings SET description = '이용권만 제공 시 최소 수수료 (원)' WHERE setting_key = 'min_fee_voucher';
UPDATE system_settings SET description = '상품/이용권 + 포인트 제공 시 수수료율 (%)' WHERE setting_key = 'fee_rate_with_points';
