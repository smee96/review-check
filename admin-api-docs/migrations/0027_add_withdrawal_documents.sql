-- Add document fields for withdrawal requests (tax reporting)
-- 출금 요청 시 세금 신고를 위한 서류 정보 추가

ALTER TABLE withdrawal_requests ADD COLUMN id_card_image_url TEXT; -- 신분증 사본 URL
ALTER TABLE withdrawal_requests ADD COLUMN bankbook_image_url TEXT; -- 통장 사본 URL
ALTER TABLE withdrawal_requests ADD COLUMN real_name TEXT; -- 실명 (신분증 기준)
ALTER TABLE withdrawal_requests ADD COLUMN resident_number_partial TEXT; -- 주민등록번호 앞 6자리 (세금 신고용)

-- Add index for processed_at
CREATE INDEX IF NOT EXISTS idx_withdrawal_processed_at ON withdrawal_requests(processed_at);
