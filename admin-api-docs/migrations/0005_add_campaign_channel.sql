-- Add channel type to campaigns
ALTER TABLE campaigns ADD COLUMN channel_type TEXT CHECK(channel_type IN ('instagram', 'blog', 'youtube', NULL));

-- Add channel-specific fields
ALTER TABLE campaigns ADD COLUMN instagram_mention_account TEXT;  -- 인스타그램 멘션 계정
ALTER TABLE campaigns ADD COLUMN blog_product_url TEXT;  -- 블로그 상품 URL
ALTER TABLE campaigns ADD COLUMN youtube_purchase_link TEXT;  -- 유튜브 구매 링크
