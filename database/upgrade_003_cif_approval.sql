-- Upgrade 003: CIF Numbering, Facility Numbers, and Officer Approval Tracking
BEGIN;
SET LOCAL TIME ZONE 'Asia/Colombo';

-- 1. Add CIF number to customer table
ALTER TABLE customer ADD COLUMN IF NOT EXISTS cif_number VARCHAR(20) UNIQUE;

-- Populate CIF numbers for existing customers starting from '0000000' based on primary key customer_id
UPDATE customer SET cif_number = LPAD((customer_id - 1)::text, 7, '0') WHERE cif_number IS NULL;

-- 2. Add officer tracking to account
ALTER TABLE account ADD COLUMN IF NOT EXISTS approved_by_officer_id INT REFERENCES users(user_id);
ALTER TABLE account ADD COLUMN IF NOT EXISTS approved_by_manager_id INT REFERENCES users(user_id);

-- 3. Add officer tracking to fixed_deposit
ALTER TABLE fixed_deposit ADD COLUMN IF NOT EXISTS approved_by_officer_id INT REFERENCES users(user_id);
ALTER TABLE fixed_deposit ADD COLUMN IF NOT EXISTS approved_by_manager_id INT REFERENCES users(user_id);

-- 4. Add loan_number and officer tracking to loan
ALTER TABLE loan ADD COLUMN IF NOT EXISTS loan_number VARCHAR(50);
ALTER TABLE loan ADD COLUMN IF NOT EXISTS approved_by_officer_id INT REFERENCES users(user_id);
ALTER TABLE loan ADD COLUMN IF NOT EXISTS approved_by_manager_id INT REFERENCES users(user_id);

COMMIT;

