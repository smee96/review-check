-- Add payment status to campaigns table
ALTER TABLE campaigns ADD COLUMN payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid'));
