-- Add columns to trucks table that were missing from the original schema
-- These already exist in the live database (added after the initial migration)

-- Truck registration details
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS rto VARCHAR(255);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(255);
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS transmission VARCHAR(255);

-- Unique registration number for each truck
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS registration_number VARCHAR(255) UNIQUE;
