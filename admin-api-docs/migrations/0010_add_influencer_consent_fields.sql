-- Add consent fields to influencer_profiles table
ALTER TABLE influencer_profiles ADD COLUMN portrait_rights_consent INTEGER DEFAULT 0;
ALTER TABLE influencer_profiles ADD COLUMN personal_info_consent INTEGER DEFAULT 0;
ALTER TABLE influencer_profiles ADD COLUMN content_usage_consent INTEGER DEFAULT 0;
ALTER TABLE influencer_profiles ADD COLUMN third_party_provision_consent INTEGER DEFAULT 0;
