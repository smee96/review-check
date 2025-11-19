-- 테스트 캠페인에 썸네일 이미지 URL 추가
-- placeholder 이미지 사용

UPDATE campaigns 
SET thumbnail_image = 'https://via.placeholder.com/640x480/FFB6C1/FFFFFF?text=Beauty+Cream'
WHERE id = 10;

UPDATE campaigns 
SET thumbnail_image = 'https://via.placeholder.com/640x480/87CEEB/FFFFFF?text=Brunch+Cafe'
WHERE id = 11;

UPDATE campaigns 
SET thumbnail_image = 'https://via.placeholder.com/640x480/DDA0DD/FFFFFF?text=Winter+Knit'
WHERE id = 12;

UPDATE campaigns 
SET thumbnail_image = 'https://via.placeholder.com/640x480/B0C4DE/FFFFFF?text=Wireless+Earbuds'
WHERE id = 13;

UPDATE campaigns 
SET thumbnail_image = 'https://via.placeholder.com/640x480/F4A460/FFFFFF?text=Korean+BBQ'
WHERE id = 14;

SELECT 'Thumbnails updated!' as result;
