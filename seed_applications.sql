-- 테스트 인플루언서 ID와 모집중/진행중 캠페인 ID를 사용하여 지원 데이터 추가
-- 먼저 기존 테스트 지원 데이터 삭제 (중복 방지)
DELETE FROM applications WHERE influencer_id IN (
  SELECT id FROM users WHERE email LIKE 'influencer%@test.com'
);

-- 캠페인별로 테스트 인플루언서 지원 추가
-- 각 캠페인의 모집인원보다 많은 지원자 생성

-- 예시: 캠페인 ID를 직접 지정하여 지원 데이터 삽입
-- INSERT INTO applications (campaign_id, influencer_id, status, application_date, created_at, updated_at)
-- SELECT 
--   campaign_id,
--   user_id,
--   'pending' as status,
--   datetime('now') as application_date,
--   datetime('now') as created_at,
--   datetime('now') as updated_at
-- FROM ...

