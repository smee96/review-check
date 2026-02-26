-- Add shipping address fields to influencer_profiles
ALTER TABLE influencer_profiles ADD COLUMN shipping_name TEXT;
ALTER TABLE influencer_profiles ADD COLUMN shipping_phone TEXT;
ALTER TABLE influencer_profiles ADD COLUMN shipping_postal_code TEXT;
ALTER TABLE influencer_profiles ADD COLUMN shipping_address TEXT;
ALTER TABLE influencer_profiles ADD COLUMN shipping_address_detail TEXT;
