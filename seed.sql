-- M-Spheres Seed Data

-- Admin user (password: admin123)
INSERT OR IGNORE INTO users (id, email, nickname, password_hash, role) VALUES 
  (1, 'admin@mspheres.com', '관리자', '$2a$10$xQZr8o0qMxG5pLBLXnKZxu7TZzPVQqK5tGqKdZqJmV4bFpZvPxVzC', 'admin');

-- Test advertiser (password: test123)
INSERT OR IGNORE INTO users (id, email, nickname, password_hash, role) VALUES 
  (2, 'advertiser@test.com', '테스트광고주', '$2a$10$xQZr8o0qMxG5pLBLXnKZxu7TZzPVQqK5tGqKdZqJmV4bFpZvPxVzC', 'advertiser');

-- Test influencer (password: test123)
INSERT OR IGNORE INTO users (id, email, nickname, password_hash, role) VALUES 
  (3, 'influencer@test.com', '테스트인플루언서', '$2a$10$xQZr8o0qMxG5pLBLXnKZxu7TZzPVQqK5tGqKdZqJmV4bFpZvPxVzC', 'influencer');

-- Advertiser profile
INSERT OR IGNORE INTO advertiser_profiles (user_id, company_name, business_number, representative_name, contact_email) VALUES 
  (2, '테스트컴퍼니', '123-45-67890', '홍길동', 'advertiser@test.com');

-- Influencer profile
INSERT OR IGNORE INTO influencer_profiles (user_id, instagram_handle, follower_count, category, account_holder_name, bank_name, account_number) VALUES 
  (3, '@test_influencer', 50000, '뷰티', '김인플', '신한은행', '110-123-456789');

-- Test campaign
INSERT OR IGNORE INTO campaigns (id, advertiser_id, title, description, product_name, budget, slots, status) VALUES 
  (1, 2, '신제품 립스틱 리뷰 캠페인', '새로 출시된 매트 립스틱 리뷰어를 모집합니다.', '매트 립스틱 #01', 300000, 5, 'approved');
