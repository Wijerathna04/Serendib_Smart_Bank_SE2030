\set ON_ERROR_STOP on
-- COMPLETE STANDALONE SERENDIB SMART BANK DATABASE SCHEMA.
-- Full production schema matching Java Hibernate entity mapping definitions.

BEGIN;

SET LOCAL TIME ZONE 'Asia/Colombo';

-- 0. SCHEMA VERSION TRACKING
CREATE TABLE IF NOT EXISTS database_schema_version (
    version INTEGER PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1. ROLE TABLE
CREATE TABLE IF NOT EXISTS role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);
CREATE UNIQUE INDEX IF NOT EXISTS role_name_normalized_unique ON role(LOWER(role_name));

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    role_id INT NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    profile_image TEXT,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES role(role_id),
    CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'DISABLED'))
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_unique ON users(LOWER(email));

-- 3. CUSTOMER TABLE
CREATE TABLE IF NOT EXISTS customer (
    customer_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    cif_number VARCHAR(50) UNIQUE,
    nic VARCHAR(12),
    full_name VARCHAR(255),
    address TEXT,
    date_of_birth DATE,
    profile_image TEXT,
    nic_front_image TEXT,
    nic_back_image TEXT,

    CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 4. EMPLOYEE TABLE
CREATE TABLE IF NOT EXISTS employee (
    employee_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    department VARCHAR(100),
    position VARCHAR(100),
    date_joined DATE,

    CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 5. ACCOUNT TABLE
CREATE TABLE IF NOT EXISTS account (
    account_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    account_type VARCHAR(50) NOT NULL,
    balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    open_date DATE,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    kyc_data TEXT,
    rejection_reason TEXT,
    approved_by_officer_id INT,
    approved_by_manager_id INT,
    is_primary BOOLEAN DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_account_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_account_officer FOREIGN KEY (approved_by_officer_id) REFERENCES users(user_id),
    CONSTRAINT fk_account_manager FOREIGN KEY (approved_by_manager_id) REFERENCES users(user_id),
    CONSTRAINT account_balance_check CHECK (balance >= 0),
    CONSTRAINT account_status_check CHECK (status IN ('PENDING_EMPLOYEE_APPROVAL', 'PENDING_MANAGER_APPROVAL', 'ACTIVE', 'INACTIVE', 'FROZEN', 'CLOSED', 'REJECTED'))
);
CREATE INDEX IF NOT EXISTS account_customer_idx ON account(customer_id);

-- 6. BENEFICIARY TABLE
CREATE TABLE IF NOT EXISTS beneficiary (
    beneficiary_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    name VARCHAR(100),
    account_number VARCHAR(50),
    bank_name VARCHAR(100),
    relationship VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_beneficiary_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS beneficiary_active_destination_unique ON beneficiary(customer_id, LOWER(bank_name), account_number) WHERE active;
CREATE INDEX IF NOT EXISTS beneficiary_customer_idx ON beneficiary(customer_id);

-- 7. TRANSACTION RECORD TABLE
CREATE TABLE IF NOT EXISTS transaction_record (
    transaction_id SERIAL PRIMARY KEY,
    from_account_id INT,
    to_account_id INT,
    initiated_by INT,
    amount NUMERIC(12,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    description VARCHAR(255),
    idempotency_key VARCHAR(80),
    request_fingerprint VARCHAR(64),
    failure_code VARCHAR(80),
    bill_type VARCHAR(50),
    bill_reference VARCHAR(50),
    external_bank VARCHAR(100),
    external_account_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    authorization_expires_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_transaction_sender FOREIGN KEY (from_account_id) REFERENCES account(account_id),
    CONSTRAINT fk_transaction_receiver FOREIGN KEY (to_account_id) REFERENCES account(account_id),
    CONSTRAINT fk_transaction_initiator FOREIGN KEY (initiated_by) REFERENCES users(user_id),
    CONSTRAINT transaction_amount_check CHECK (amount > 0),
    CONSTRAINT transaction_status_check CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);
CREATE UNIQUE INDEX IF NOT EXISTS transaction_idempotency_unique ON transaction_record(initiated_by, idempotency_key);
CREATE INDEX IF NOT EXISTS transaction_source_time_idx ON transaction_record(from_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transaction_destination_time_idx ON transaction_record(to_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transaction_pending_expiry_idx ON transaction_record(status, authorization_expires_at);

-- 8. OTP TABLE
CREATE TABLE IF NOT EXISTS otp (
    otp_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL UNIQUE,
    otp_code VARCHAR(10),
    otp_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    attempt_count INT NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_otp_transaction FOREIGN KEY (transaction_id) REFERENCES transaction_record(transaction_id),
    CONSTRAINT otp_attempt_check CHECK (attempt_count >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS otp_transaction_unique ON otp(transaction_id);

-- 9. FIXED DEPOSIT TABLE
CREATE TABLE IF NOT EXISTS fixed_deposit (
    fixed_deposit_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    principal_amount NUMERIC(12,2) NOT NULL CHECK (principal_amount > 0),
    interest_rate NUMERIC(5,2) NOT NULL CHECK (interest_rate >= 0),
    term_months INT NOT NULL CHECK (term_months > 0),
    start_date DATE,
    maturity_date DATE,
    maturity_amount NUMERIC(12,2),
    status VARCHAR(40) NOT NULL CHECK (status IN ('PENDING_MANAGER_APPROVAL', 'PENDING', 'ACTIVE', 'MATURED', 'CLOSED', 'CANCELLED', 'REJECTED')),
    opening_transaction_id INT NOT NULL UNIQUE,
    closing_transaction_id INT UNIQUE,
    fd_details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_fd_account FOREIGN KEY (account_id) REFERENCES account(account_id),
    CONSTRAINT fk_fd_opening_txn FOREIGN KEY (opening_transaction_id) REFERENCES transaction_record(transaction_id),
    CONSTRAINT fk_fd_closing_txn FOREIGN KEY (closing_transaction_id) REFERENCES transaction_record(transaction_id)
);
CREATE INDEX IF NOT EXISTS fixed_deposit_account_idx ON fixed_deposit(account_id);
CREATE INDEX IF NOT EXISTS fixed_deposit_maturity_idx ON fixed_deposit(status, maturity_date);

-- 10. LOAN TABLE
CREATE TABLE IF NOT EXISTS loan (
    loan_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    reviewer_employee_id INT,
    loan_number VARCHAR(50),
    loan_type VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    interest_rate NUMERIC(5,2),
    status VARCHAR(40) NOT NULL CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED', 'PENDING_MANAGER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED')),
    apply_date DATE,
    review_date DATE,
    additional_information TEXT,
    scrutiny_data TEXT,
    account_id INT,
    fixed_deposit_id INT,
    paid_amount NUMERIC(12,2) DEFAULT 0.00,
    approved_by_officer_id INT,
    approved_by_manager_id INT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_loan_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_loan_employee FOREIGN KEY (reviewer_employee_id) REFERENCES employee(employee_id),
    CONSTRAINT fk_loan_account FOREIGN KEY (account_id) REFERENCES account(account_id),
    CONSTRAINT fk_loan_fd FOREIGN KEY (fixed_deposit_id) REFERENCES fixed_deposit(fixed_deposit_id),
    CONSTRAINT fk_loan_officer FOREIGN KEY (approved_by_officer_id) REFERENCES users(user_id),
    CONSTRAINT fk_loan_manager FOREIGN KEY (approved_by_manager_id) REFERENCES users(user_id)
);
CREATE INDEX IF NOT EXISTS loan_customer_idx ON loan(customer_id);

-- 11. LOAN DECISION TABLE
CREATE TABLE IF NOT EXISTS loan_decision (
    decision_id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(80) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_loan_decision_loan FOREIGN KEY (loan_id) REFERENCES loan(loan_id),
    CONSTRAINT fk_loan_decision_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE INDEX IF NOT EXISTS loan_decision_loan_time_idx ON loan_decision(loan_id, created_at);

-- 12. CARD TABLE
CREATE TABLE IF NOT EXISTS card (
    card_id SERIAL PRIMARY KEY,
    user_id INT,
    account_id INT,
    card_number VARCHAR(50),
    card_type VARCHAR(50) NOT NULL, -- "DEBIT" or "CREDIT"
    card_product VARCHAR(100),
    expiry_date DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'BLOCKED', 'CANCELLED', 'EXPIRED')),
    credit_limit NUMERIC(15,2),
    available_credit NUMERIC(15,2),
    current_balance NUMERIC(15,2),
    issued_by INT,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    issued_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    full_name VARCHAR(255),
    nic_number VARCHAR(12),
    mobile_number VARCHAR(20),
    email_address VARCHAR(100),
    residential_address TEXT,
    housing_status VARCHAR(50),
    employment_type VARCHAR(50),
    employer_name VARCHAR(150),
    designation VARCHAR(100),
    years_of_service INT,
    gross_monthly_income NUMERIC(15,2),
    fixed_allowances NUMERIC(15,2),
    existing_credit_deductions NUMERIC(15,2),
    primary_bank_name VARCHAR(100),
    crib_consent BOOLEAN,
    pay_slips_upload TEXT,
    bank_statements_upload TEXT,
    employment_letter_upload TEXT,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_card_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_card_account FOREIGN KEY (account_id) REFERENCES account(account_id),
    CONSTRAINT fk_card_issuer FOREIGN KEY (issued_by) REFERENCES users(user_id)
);
CREATE INDEX IF NOT EXISTS card_account_idx ON card(account_id);
CREATE INDEX IF NOT EXISTS card_user_idx ON card(user_id);

-- 13. BILL PAYMENT TABLE
CREATE TABLE IF NOT EXISTS bill_payment (
    payment_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    account_id INT NOT NULL,
    transaction_id INT UNIQUE,
    reference_number VARCHAR(50) NOT NULL,
    bill_type VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_payment_account FOREIGN KEY (account_id) REFERENCES account(account_id),
    CONSTRAINT fk_payment_transaction FOREIGN KEY (transaction_id) REFERENCES transaction_record(transaction_id)
);
CREATE INDEX IF NOT EXISTS bill_customer_time_idx ON bill_payment(customer_id, created_at DESC);

-- 14. FAVOURITE BILLER TABLE
CREATE TABLE IF NOT EXISTS favourite_biller (
    favourite_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    biller_category VARCHAR(50) NOT NULL,
    biller_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    reference_number VARCHAR(50) NOT NULL,
    default_amount NUMERIC(12,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_favourite_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS favourite_biller_customer_idx ON favourite_biller(customer_id);

-- 15. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    feedback_type VARCHAR(20) NOT NULL DEFAULT 'COMPLAINT' CHECK (feedback_type IN ('REVIEW', 'COMPLAINT', 'SERVICE')),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    rating INT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED', 'CLOSED')),
    moderator_id INT,
    staff_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_feedback_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_feedback_moderator FOREIGN KEY (moderator_id) REFERENCES users(user_id)
);
CREATE INDEX IF NOT EXISTS feedback_customer_idx ON feedback(customer_id);
CREATE INDEX IF NOT EXISTS feedback_publication_idx ON feedback(feedback_type, status, created_at DESC);

-- 16. NOTIFICATION TABLE
CREATE TABLE IF NOT EXISTS notification (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200),
    message TEXT,
    event_type VARCHAR(80),
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ', 'DELETED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE INDEX IF NOT EXISTS notification_user_status_time_idx ON notification(user_id, status, created_at DESC);

-- 17. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS audit_log (
    log_id SERIAL PRIMARY KEY,
    user_id INT,
    actor_type VARCHAR(30) NOT NULL DEFAULT 'USER' CHECK (actor_type IN ('USER', 'SYSTEM_OR_ANONYMOUS')),
    action VARCHAR(255),
    entity_type VARCHAR(100),
    entity_id INT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),

    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE INDEX IF NOT EXISTS audit_actor_time_idx ON audit_log(user_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS audit_action_time_idx ON audit_log(action, performed_at DESC);

-- 18. AI ASSISTANT TABLE
CREATE TABLE IF NOT EXISTS ai_assistant (
    assistant_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    version VARCHAR(50),
    status VARCHAR(20)
);

-- 19. AI CHAT TABLE
CREATE TABLE IF NOT EXISTS ai_chat (
    chat_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    assistant_id INT NOT NULL,
    question TEXT,
    response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chat_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_chat_assistant FOREIGN KEY (assistant_id) REFERENCES ai_assistant(assistant_id)
);

-- Record schema version
INSERT INTO database_schema_version(version, description)
VALUES (2, 'Complete Serendib Smart Bank SE2030 Database Schema')
ON CONFLICT (version) DO NOTHING;

COMMIT;
