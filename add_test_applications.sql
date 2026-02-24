-- 1. 테스트 인플루언서 ID 확인
SELECT id, email, name, role FROM users WHERE email LIKE 'influencer%@test.com' ORDER BY id;

-- 2. 현재 모집중/진행중 캠페인 확인
SELECT id, title, status, slots, 
  (SELECT COUNT(*) FROM applications WHERE campaign_id = campaigns.id) as current_applications
FROM campaigns 
WHERE status IN ('recruiting', 'in_progress')
ORDER BY id;
