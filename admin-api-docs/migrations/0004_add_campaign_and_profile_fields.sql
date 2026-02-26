-- Add detailed campaign schedule fields
ALTER TABLE campaigns ADD COLUMN application_start_date DATE;
ALTER TABLE campaigns ADD COLUMN application_end_date DATE;
ALTER TABLE campaigns ADD COLUMN announcement_date DATE;
ALTER TABLE campaigns ADD COLUMN content_start_date DATE;
ALTER TABLE campaigns ADD COLUMN content_end_date DATE;
ALTER TABLE campaigns ADD COLUMN result_announcement_date DATE;

-- Add campaign detail fields
ALTER TABLE campaigns ADD COLUMN provided_items TEXT;  -- 제공 내역 (상품, 이용권, 기타)
ALTER TABLE campaigns ADD COLUMN mission TEXT;  -- 미션 (requirements와 별도로 명확한 미션)
ALTER TABLE campaigns ADD COLUMN keywords TEXT;  -- 키워드 (쉼표로 구분)
ALTER TABLE campaigns ADD COLUMN notes TEXT;  -- 유의사항

-- Add influencer personal information
ALTER TABLE influencer_profiles ADD COLUMN real_name TEXT;  -- 실명
ALTER TABLE influencer_profiles ADD COLUMN birth_date DATE;  -- 생년월일
ALTER TABLE influencer_profiles ADD COLUMN gender TEXT CHECK(gender IN ('male', 'female', 'other', NULL));  -- 성별

-- Add shipping information to applications
ALTER TABLE applications ADD COLUMN shipping_recipient TEXT;  -- 수령인
ALTER TABLE applications ADD COLUMN shipping_phone TEXT;  -- 수령인 연락처
ALTER TABLE applications ADD COLUMN shipping_zipcode TEXT;  -- 우편번호
ALTER TABLE applications ADD COLUMN shipping_address TEXT;  -- 주소
ALTER TABLE applications ADD COLUMN shipping_detail TEXT;  -- 상세주소
