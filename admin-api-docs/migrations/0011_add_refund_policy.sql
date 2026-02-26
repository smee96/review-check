-- Add refund policy field to campaigns
-- 환불 불가 상태: 신청자가 생기면 환불 불가

ALTER TABLE campaigns ADD COLUMN refundable INTEGER DEFAULT 1;
-- 1 = 환불 가능, 0 = 환불 불가
