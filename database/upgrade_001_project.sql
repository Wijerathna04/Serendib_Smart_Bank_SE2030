\set ON_ERROR_STOP on
-- Explicitly run with psql against the existing baseline database after taking a backup.
-- No DROP TABLE, account deletion, balance replacement, or financial-history deletion.
BEGIN;
SET LOCAL TIME ZONE 'Asia/Colombo';
SELECT pg_advisory_xact_lock(2030202601);
CREATE TABLE IF NOT EXISTS database_schema_version (
    version INTEGER PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM database_schema_version WHERE version=1) THEN
        RAISE EXCEPTION 'Upgrade 001 already applied; do not rerun it.';
    END IF;
END $$;

ALTER TABLE users ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
CREATE UNIQUE INDEX role_name_normalized_unique ON role(LOWER(role_name));
UPDATE users SET status=UPPER(COALESCE(status,'DISABLED'));
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK(status IN ('ACTIVE','DISABLED'));
CREATE UNIQUE INDEX users_email_normalized_unique ON users(LOWER(email));
INSERT INTO customer(user_id)
SELECT u.user_id FROM users u JOIN role r ON r.role_id=u.role_id
WHERE UPPER(r.role_name)='CUSTOMER' AND NOT EXISTS(SELECT 1 FROM customer c WHERE c.user_id=u.user_id);
INSERT INTO employee(user_id,department,position,date_joined)
SELECT u.user_id,'Bank operations',r.role_name,CURRENT_DATE FROM users u JOIN role r ON r.role_id=u.role_id
WHERE UPPER(r.role_name) IN ('EMPLOYEE','MANAGER') AND NOT EXISTS(SELECT 1 FROM employee e WHERE e.user_id=u.user_id);

-- Incomplete account data needs a deliberate correction, never an invented balance.
DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM account WHERE balance IS NULL OR balance<0 OR account_number IS NULL OR account_type IS NULL OR status IS NULL) THEN
        RAISE EXCEPTION 'Account preflight failed: resolve null/negative balance or missing number/type/status before upgrading.';
    END IF;
END $$;
ALTER TABLE account ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
UPDATE account SET status=UPPER(status);
ALTER TABLE account ALTER COLUMN balance SET NOT NULL;
ALTER TABLE account ALTER COLUMN account_number SET NOT NULL;
ALTER TABLE account ALTER COLUMN account_type SET NOT NULL;
ALTER TABLE account ALTER COLUMN status SET NOT NULL;
ALTER TABLE account ADD CONSTRAINT account_balance_check CHECK(balance>=0);
ALTER TABLE account ADD CONSTRAINT account_status_check CHECK(status IN ('ACTIVE','INACTIVE','FROZEN','CLOSED'));
CREATE INDEX account_customer_idx ON account(customer_id);

ALTER TABLE notification ADD COLUMN event_type VARCHAR(80);
ALTER TABLE notification ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
UPDATE notification SET status=CASE WHEN UPPER(COALESCE(status,'')) IN ('READ','UNREAD','DELETED') THEN UPPER(status) ELSE 'UNREAD' END,
    created_at=COALESCE(created_at,CURRENT_TIMESTAMP);
ALTER TABLE notification ALTER COLUMN status SET DEFAULT 'UNREAD';
ALTER TABLE notification ALTER COLUMN status SET NOT NULL;
ALTER TABLE notification ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE notification ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE notification ADD CONSTRAINT notification_status_check CHECK(status IN ('UNREAD','READ','DELETED'));
CREATE INDEX notification_user_status_time_idx ON notification(user_id,status,created_at DESC);

ALTER TABLE audit_log ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE audit_log ADD COLUMN actor_type VARCHAR(30) NOT NULL DEFAULT 'USER';
ALTER TABLE audit_log ADD CONSTRAINT audit_actor_check CHECK((actor_type='USER' AND user_id IS NOT NULL) OR (actor_type='SYSTEM_OR_ANONYMOUS' AND user_id IS NULL));
CREATE INDEX audit_actor_time_idx ON audit_log(user_id,performed_at DESC);
CREATE INDEX audit_action_time_idx ON audit_log(action,performed_at DESC);

ALTER TABLE beneficiary ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE beneficiary ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE beneficiary ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE beneficiary ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX beneficiary_active_destination_unique ON beneficiary(customer_id,LOWER(bank_name),account_number) WHERE active;
CREATE INDEX beneficiary_customer_idx ON beneficiary(customer_id);

ALTER TABLE transaction_record ALTER COLUMN from_account_id DROP NOT NULL;
ALTER TABLE transaction_record ALTER COLUMN to_account_id DROP NOT NULL;
ALTER TABLE transaction_record ADD COLUMN initiated_by INT REFERENCES users(user_id);
ALTER TABLE transaction_record ADD COLUMN idempotency_key VARCHAR(80);
ALTER TABLE transaction_record ADD COLUMN request_fingerprint VARCHAR(64);
ALTER TABLE transaction_record ADD COLUMN failure_code VARCHAR(80);
ALTER TABLE transaction_record ADD COLUMN authorization_expires_at TIMESTAMP;
ALTER TABLE transaction_record ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
UPDATE transaction_record t SET initiated_by=c.user_id FROM account a JOIN customer c ON c.customer_id=a.customer_id WHERE t.from_account_id=a.account_id;
UPDATE transaction_record SET transaction_type=UPPER(transaction_type),status=UPPER(status);
-- Legacy pending authorizations cannot be confirmed using pre-upgrade OTPs.
UPDATE transaction_record SET status='CANCELLED',failure_code='LEGACY_AUTHORIZATION_INVALIDATED',completed_at=CURRENT_TIMESTAMP WHERE status='PENDING';
ALTER TABLE transaction_record ALTER COLUMN amount SET NOT NULL;
ALTER TABLE transaction_record ALTER COLUMN transaction_type SET NOT NULL;
ALTER TABLE transaction_record ALTER COLUMN status SET NOT NULL;
ALTER TABLE transaction_record ADD CONSTRAINT transaction_amount_check CHECK(amount>0);
ALTER TABLE transaction_record ADD CONSTRAINT transaction_status_check CHECK(status IN ('PENDING','COMPLETED','FAILED','CANCELLED'));
ALTER TABLE transaction_record ADD CONSTRAINT transaction_shape_check CHECK(
    (transaction_type='TRANSFER' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id<>to_account_id)
    OR (transaction_type IN ('BILL_PAYMENT','FD_OPEN') AND from_account_id IS NOT NULL AND to_account_id IS NULL)
    OR (transaction_type='FD_CLOSE' AND from_account_id IS NULL AND to_account_id IS NOT NULL)
);
ALTER TABLE transaction_record ADD CONSTRAINT transaction_pending_authorization_check CHECK(status<>'PENDING' OR (initiated_by IS NOT NULL AND idempotency_key IS NOT NULL AND request_fingerprint IS NOT NULL AND authorization_expires_at IS NOT NULL));
CREATE UNIQUE INDEX transaction_idempotency_unique ON transaction_record(initiated_by,idempotency_key);
CREATE INDEX transaction_source_time_idx ON transaction_record(from_account_id,created_at DESC);
CREATE INDEX transaction_destination_time_idx ON transaction_record(to_account_id,created_at DESC);
CREATE INDEX transaction_pending_expiry_idx ON transaction_record(status,authorization_expires_at);

ALTER TABLE otp ADD COLUMN otp_hash VARCHAR(255);
ALTER TABLE otp ADD COLUMN attempt_count INT NOT NULL DEFAULT 0;
ALTER TABLE otp ADD COLUMN last_sent_at TIMESTAMP;
ALTER TABLE otp ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
UPDATE otp SET otp_code=NULL,otp_hash='INVALIDATED',verified=TRUE,expires_at=CURRENT_TIMESTAMP;
ALTER TABLE otp ALTER COLUMN otp_hash SET NOT NULL;
ALTER TABLE otp ADD CONSTRAINT otp_attempt_check CHECK(attempt_count>=0);
CREATE UNIQUE INDEX otp_transaction_unique ON otp(transaction_id);
-- otp_code remains as an unused compatibility column, and no Java code reads/writes it.

CREATE TABLE fixed_deposit (
    fixed_deposit_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES account(account_id),
    principal_amount NUMERIC(12,2) NOT NULL CHECK(principal_amount>0),
    interest_rate NUMERIC(5,2) NOT NULL CHECK(interest_rate>=0),
    term_months INT NOT NULL CHECK(term_months>0),
    start_date DATE,
    maturity_date DATE,
    maturity_amount NUMERIC(12,2),
    status VARCHAR(20) NOT NULL CHECK(status IN ('PENDING','ACTIVE','MATURED','CLOSED','CANCELLED')),
    opening_transaction_id INT NOT NULL UNIQUE REFERENCES transaction_record(transaction_id),
    closing_transaction_id INT UNIQUE REFERENCES transaction_record(transaction_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CHECK(status IN ('PENDING','CANCELLED') OR (start_date IS NOT NULL AND maturity_date IS NOT NULL AND maturity_amount IS NOT NULL AND maturity_date>start_date AND maturity_amount>=principal_amount)),
    CHECK(status<>'CLOSED' OR closing_transaction_id IS NOT NULL)
);
CREATE INDEX fixed_deposit_account_idx ON fixed_deposit(account_id);
CREATE INDEX fixed_deposit_maturity_idx ON fixed_deposit(status,maturity_date);

ALTER TABLE bill_payment ADD COLUMN transaction_id INT UNIQUE REFERENCES transaction_record(transaction_id);
ALTER TABLE bill_payment ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE bill_payment ADD COLUMN completed_at TIMESTAMP;
ALTER TABLE bill_payment ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
UPDATE bill_payment SET status=UPPER(status);
ALTER TABLE bill_payment ALTER COLUMN amount SET NOT NULL;
ALTER TABLE bill_payment ALTER COLUMN bill_type SET NOT NULL;
ALTER TABLE bill_payment ALTER COLUMN reference_number SET NOT NULL;
ALTER TABLE bill_payment ALTER COLUMN status SET NOT NULL;
ALTER TABLE bill_payment ADD CONSTRAINT bill_amount_check CHECK(amount>0);
ALTER TABLE bill_payment ADD CONSTRAINT bill_status_check CHECK(status IN ('PENDING','COMPLETED','FAILED','CANCELLED'));
CREATE INDEX bill_customer_time_idx ON bill_payment(customer_id,created_at DESC);

ALTER TABLE loan ADD COLUMN additional_information TEXT;
ALTER TABLE loan ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE loan ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
-- Review workflow states exceed the baseline VARCHAR(20).
ALTER TABLE loan ALTER COLUMN status TYPE VARCHAR(40);
UPDATE loan SET status=CASE WHEN UPPER(status)='PENDING' THEN 'SUBMITTED' ELSE UPPER(status) END;
ALTER TABLE loan ALTER COLUMN amount SET NOT NULL;
ALTER TABLE loan ALTER COLUMN loan_type SET NOT NULL;
ALTER TABLE loan ALTER COLUMN status SET NOT NULL;
ALTER TABLE loan ADD CONSTRAINT loan_amount_check CHECK(amount>0);
ALTER TABLE loan ADD CONSTRAINT loan_status_check CHECK(status IN ('SUBMITTED','UNDER_REVIEW','MORE_INFORMATION_REQUIRED','PENDING_MANAGER_REVIEW','APPROVED','REJECTED','CANCELLED'));
CREATE TABLE loan_decision (
    decision_id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL REFERENCES loan(loan_id),
    user_id INT NOT NULL REFERENCES users(user_id),
    action VARCHAR(80) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX loan_customer_idx ON loan(customer_id);
CREATE INDEX loan_decision_loan_time_idx ON loan_decision(loan_id,created_at);

ALTER TABLE card ADD COLUMN issued_by INT REFERENCES users(user_id);
ALTER TABLE card ADD COLUMN requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE card ADD COLUMN issued_at TIMESTAMP;
ALTER TABLE card ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE card ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
UPDATE card SET status=UPPER(status),issued_at=CASE WHEN card_number IS NOT NULL THEN CURRENT_TIMESTAMP ELSE NULL END;
ALTER TABLE card ALTER COLUMN card_type SET NOT NULL;
ALTER TABLE card ALTER COLUMN status SET NOT NULL;
ALTER TABLE card ADD CONSTRAINT card_status_check CHECK(status IN ('PENDING','ACTIVE','BLOCKED','CANCELLED','EXPIRED'));
CREATE INDEX card_account_idx ON card(account_id);

ALTER TABLE feedback ADD COLUMN feedback_type VARCHAR(20) NOT NULL DEFAULT 'COMPLAINT';
ALTER TABLE feedback ADD COLUMN rating INT;
ALTER TABLE feedback ADD COLUMN moderator_id INT REFERENCES users(user_id);
ALTER TABLE feedback ADD COLUMN staff_response TEXT;
ALTER TABLE feedback ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE feedback ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
UPDATE feedback SET status=CASE WHEN status IS NULL OR UPPER(status)='PENDING' THEN 'SUBMITTED' ELSE UPPER(status) END;
ALTER TABLE feedback ALTER COLUMN subject SET NOT NULL;
ALTER TABLE feedback ALTER COLUMN message SET NOT NULL;
ALTER TABLE feedback ALTER COLUMN status SET NOT NULL;
ALTER TABLE feedback ADD CONSTRAINT feedback_type_check CHECK(feedback_type IN ('REVIEW','COMPLAINT','SERVICE'));
ALTER TABLE feedback ADD CONSTRAINT feedback_status_check CHECK(status IN ('SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','RESOLVED','CLOSED'));
ALTER TABLE feedback ADD CONSTRAINT feedback_publication_check CHECK(
    (feedback_type='REVIEW' AND rating BETWEEN 1 AND 5 AND rating IS NOT NULL AND status NOT IN ('RESOLVED','CLOSED'))
    OR (feedback_type IN ('COMPLAINT','SERVICE') AND rating IS NULL)
);
CREATE INDEX feedback_customer_idx ON feedback(customer_id);
CREATE INDEX feedback_publication_idx ON feedback(feedback_type,status,created_at DESC);

CREATE TABLE IF NOT EXISTS favourite_biller (
    favourite_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    biller_category VARCHAR(50) NOT NULL,
    biller_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    reference_number VARCHAR(50) NOT NULL,
    default_amount NUMERIC(12, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS favourite_biller_customer_idx ON favourite_biller(customer_id);

INSERT INTO database_schema_version(version,description) VALUES(1,'Required full-project banking implementation');
COMMIT;
