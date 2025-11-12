-- Add personal information and consent fields to applications table

-- Personal information
ALTER TABLE applications ADD COLUMN real_name TEXT;
ALTER TABLE applications ADD COLUMN birth_date TEXT;
ALTER TABLE applications ADD COLUMN gender TEXT CHECK(gender IN ('male', 'female', 'other'));
ALTER TABLE applications ADD COLUMN contact_phone TEXT;

-- Consent fields
ALTER TABLE applications ADD COLUMN portrait_rights_consent INTEGER DEFAULT 0;
ALTER TABLE applications ADD COLUMN personal_info_consent INTEGER DEFAULT 0;
ALTER TABLE applications ADD COLUMN content_usage_consent INTEGER DEFAULT 0;
