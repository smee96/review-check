-- Clear existing data
DELETE FROM applications;
DELETE FROM campaigns;
DELETE FROM influencer_profiles;
DELETE FROM users;

-- Import users
INSERT INTO users (id, email, nickname, password_hash, role, created_at, updated_at) 
VALUES 
(2, 'kyuhan.lee@mobin-inc.com', '모빈관리자', '89f4f42456f145113d2e6868482e96e67e480c839e9cf2fef2cbaf037a7ead72', 'admin', '2025-11-10 08:34:14', '2025-11-10 08:34:14'),
(3, 'bensmee96@gmail.com', '광고주님', '1228be6df89535a281bab2eebe2d4437c424f9ae925d2c1be8413ddd6e008a1b', 'advertiser', '2025-11-10T14:23:17.612Z', '2025-11-10T14:23:17.612Z'),
(4, 'debugtest@example.com', 'Debug Test', '7e6e0c3079a08c5cc6036789b57e951f65f82383913ba1a49ae992544f1b4b6e', 'advertiser', '2025-11-10T14:30:15.801Z', '2025-11-10T14:30:15.801Z'),
(5, 'smee96@naver.com', '여름아', 'dfaddc0b2422a2d7736404de18d1ea6ef40ca532213c576f96ab3499e28dca6a', 'influencer', '2025-11-10T14:37:11.046Z', '2025-11-10T14:37:11.046Z');

-- Import campaigns
INSERT INTO campaigns (id, advertiser_id, title, description, product_name, channel_type, slots, point_reward, status, payment_status, created_at, updated_at)
VALUES 
(1, 3, '[라브] 튀르키예 프리미엄 하이볼 유리잔 (6P) (랜덤제공)', '예쁜 하이볼 잔입니다.', '하이볼 6P 세트', 'blog', 10, 10000, 'approved', 'paid', '2025-11-10T15:59:01.042Z', '2025-11-10T16:33:43.710Z');

-- Import influencer_profiles
INSERT INTO influencer_profiles (user_id, created_at, updated_at)
VALUES 
(5, '2025-11-10T14:37:11.298Z', '2025-11-10T14:37:11.298Z');
