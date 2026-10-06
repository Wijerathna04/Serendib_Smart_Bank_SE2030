-- Upgrade 002: Product Descriptions, Structured Fields, and Manager Approval Workflows
BEGIN;
SET LOCAL TIME ZONE 'Asia/Colombo';

-- 1. Update account status constraint and add application/KYC data column
ALTER TABLE account DROP CONSTRAINT IF EXISTS account_status_check;
ALTER TABLE account ADD CONSTRAINT account_status_check CHECK(status IN ('PENDING_EMPLOYEE_APPROVAL','PENDING_MANAGER_APPROVAL','ACTIVE','INACTIVE','FROZEN','CLOSED','REJECTED'));
ALTER TABLE account ADD COLUMN IF NOT EXISTS kyc_data TEXT;
ALTER TABLE account ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Update fixed_deposit status column size & constraint
ALTER TABLE fixed_deposit ALTER COLUMN status TYPE VARCHAR(40);
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT constraint_name FROM information_schema.constraint_column_usage WHERE table_name = 'fixed_deposit' AND column_name = 'status') LOOP
        EXECUTE 'ALTER TABLE fixed_deposit DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE fixed_deposit ADD CONSTRAINT fixed_deposit_status_check CHECK(status IN ('PENDING_MANAGER_APPROVAL','PENDING','ACTIVE','MATURED','CLOSED','CANCELLED','REJECTED'));
ALTER TABLE fixed_deposit ADD COLUMN IF NOT EXISTS fd_details TEXT;

-- 3. Add scrutiny_data to loan
ALTER TABLE loan ADD COLUMN IF NOT EXISTS scrutiny_data TEXT;

COMMIT;
