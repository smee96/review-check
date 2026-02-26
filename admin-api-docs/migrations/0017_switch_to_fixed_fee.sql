-- 고정 수수료 체계로 전환

-- 기존 수수료율 설정 삭제 (더 이상 사용하지 않음)
DELETE FROM system_settings WHERE setting_key IN (
  'fee_rate_product_only',
  'fee_rate_voucher_only',
  'fee_rate_points_only',
  'fee_rate_with_points',
  'min_fee_product',
  'min_fee_voucher',
  'min_fee_points',
  'min_fee_with_points'
);

-- 새로운 고정 수수료 설정
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('fixed_fee_points_only', '10000', '포인트만 지급 - 건당 고정 수수료 (원)'),
('fixed_fee_purchase_with_points', '10000', '구매 + 포인트 지급 - 건당 고정 수수료 (원)'),
('fixed_fee_product_only', '10000', '상품만 지급 - 건당 고정 수수료 (원)'),
('fixed_fee_product_with_points', '10000', '상품 + 포인트 지급 - 건당 고정 수수료 (원)'),
('fixed_fee_voucher_only', '10000', '이용권만 지급 - 건당 고정 수수료 (원)'),
('fixed_fee_voucher_with_points', '10000', '이용권 + 포인트 지급 - 건당 고정 수수료 (원)'),
('points_fee_rate', '30', '포인트 수수료율 (%) - 포인트 금액에 추가로 부과');
