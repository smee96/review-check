-- ========================================
-- R2 마이그레이션: Base64 썸네일을 R2 URL로 일괄 변경
-- 실행 전 반드시 백업 권장!
-- ========================================

-- 변경 전 확인
SELECT id, title, 
  CASE 
    WHEN thumbnail_image LIKE 'data:image%' THEN 'Base64 (변경 예정)'
    WHEN thumbnail_image LIKE '/api/images/%' THEN 'R2 URL (유지)'
    ELSE 'Unknown'
  END as current_status
FROM campaigns 
ORDER BY id;

-- Base64 → R2 URL 변경 (23개 캠페인)
UPDATE campaigns SET thumbnail_image = '/api/images/1.jpg' WHERE id = 1 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/2.jpg' WHERE id = 2 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/3.jpg' WHERE id = 3 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/4.jpg' WHERE id = 4 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/5.jpg' WHERE id = 5 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/6.jpg' WHERE id = 6 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/7.jpg' WHERE id = 7 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/8.jpg' WHERE id = 8 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/9.jpg' WHERE id = 9 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/10.jpg' WHERE id = 10 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/11.jpg' WHERE id = 11 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/12.jpg' WHERE id = 12 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/13.jpg' WHERE id = 13 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/14.jpg' WHERE id = 14 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/15.jpg' WHERE id = 15 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/16.jpg' WHERE id = 16 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/17.jpg' WHERE id = 17 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/18.jpg' WHERE id = 18 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/19.jpg' WHERE id = 19 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/20.jpg' WHERE id = 20 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/21.jpg' WHERE id = 21 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/22.jpg' WHERE id = 22 AND thumbnail_image LIKE 'data:image%';
UPDATE campaigns SET thumbnail_image = '/api/images/23.jpg' WHERE id = 23 AND thumbnail_image LIKE 'data:image%';

-- 변경 후 확인
SELECT id, title, thumbnail_image,
  CASE 
    WHEN thumbnail_image LIKE 'data:image%' THEN 'Base64 (변경 실패)'
    WHEN thumbnail_image LIKE '/api/images/%' THEN 'R2 URL ✓'
    ELSE 'Unknown'
  END as new_status
FROM campaigns 
ORDER BY id;

-- 통계
SELECT 
  COUNT(*) as total_campaigns,
  SUM(CASE WHEN thumbnail_image LIKE '/api/images/%' THEN 1 ELSE 0 END) as r2_urls,
  SUM(CASE WHEN thumbnail_image LIKE 'data:image%' THEN 1 ELSE 0 END) as base64_remaining
FROM campaigns;
