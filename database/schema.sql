--Creating tables for the database schema


-- Drop tables in reverse order to clear existing tables safely
DROP TABLE IF EXISTS ai_chat CASCADE;
DROP TABLE IF EXISTS ai_assistant CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS otp CASCADE;
DROP TABLE IF EXISTS transaction_record CASCADE;
DROP TABLE IF EXISTS bill_payment CASCADE;
DROP TABLE IF EXISTS card CASCADE;
DROP TABLE IF EXISTS loan CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS beneficiary CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS employee CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role CASCADE;


--ROLE TABLE
CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);


--USERS TABLE
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    role_id INT NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_role
    FOREIGN KEY (role_id)
    REFERENCES role(role_id)  
);


--CUSTOMER TABLE
CREATE TABLE customer (
    customer_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    nic VARCHAR(20),
    address VARCHAR(255),
    date_of_birth DATE,

    CONSTRAINT fk_customer_user
    FOREIGN KEY(user_id)
    REFERENCES users(user_id)
);


--EMPLOYEE TABLE
CREATE TABLE employee (
    employee_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    department VARCHAR(100),
    position VARCHAR(100),
    date_joined DATE,

    CONSTRAINT fk_employee_user
    FOREIGN KEY(user_id)
    REFERENCES users(user_id)
);


--ACCOUNT TABLE
CREATE TABLE account(
    account_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    account_number VARCHAR(50) UNIQUE,
    account_type VARCHAR(50),
    balance NUMERIC(12,2),
    open_date DATE,
    status VARCHAR(20),

    CONSTRAINT fk_account_customer
    FOREIGN KEY(customer_id)
    REFERENCES customer(customer_id)
);


--BENEFICIARY TABLE
CREATE TABLE beneficiary(
    beneficiary_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    name VARCHAR(100),
    account_number VARCHAR(50),
    bank_name VARCHAR(100),
    relationship VARCHAR(100),

    CONSTRAINT fk_beneficiary_customer
    FOREIGN KEY(customer_id)
    REFERENCES customer(customer_id)
);


--FEEDBACK TABLE
CREATE TABLE feedback(
    feedback_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    subject VARCHAR(200),
    message TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_customer
    FOREIGN KEY(customer_id)
    REFERENCES customer(customer_id)
);


--LOAN TABLE
CREATE TABLE loan(
    loan_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    reviewer_employee_id INT,
    loan_type VARCHAR(50),
    amount NUMERIC(12,2),
    interest_rate NUMERIC(5,2),
    status VARCHAR(20),
    apply_date DATE,
    review_date DATE,

    CONSTRAINT fk_loan_customer
    FOREIGN KEY(customer_id)
    REFERENCES customer(customer_id),

    CONSTRAINT fk_loan_employee
    FOREIGN KEY(reviewer_employee_id)
    REFERENCES employee(employee_id)
);


--CARD TABLE
CREATE TABLE card(
    card_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    card_number VARCHAR(50),
    card_type VARCHAR(50),
    expiry_date DATE,
    status VARCHAR(20),

    CONSTRAINT fk_card_account
    FOREIGN KEY(account_id)
    REFERENCES account(account_id)
);


--BILL-PAYMENT TABLE
CREATE TABLE bill_payment(
    payment_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    account_id INT NOT NULL,
    reference_number VARCHAR(50),
    bill_type VARCHAR(50),
    amount NUMERIC(12,2),
    payment_date DATE,
    status VARCHAR(20),

    CONSTRAINT fk_payment_customer
    FOREIGN KEY(customer_id)
    REFERENCES customer(customer_id),

    CONSTRAINT fk_payment_account
    FOREIGN KEY(account_id)
    REFERENCES account(account_id)
);


--TRANACTION TABLE
CREATE TABLE transaction_record(
    transaction_id SERIAL PRIMARY KEY,
    from_account_id INT NOT NULL,
    to_account_id INT NOT NULL,
    amount NUMERIC(12,2),
    transaction_type VARCHAR(50),
    status VARCHAR(20),
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    CONSTRAINT fk_transaction_sender
    FOREIGN KEY(from_account_id)
    REFERENCES account(account_id),

    CONSTRAINT fk_transaction_receiver
    FOREIGN KEY(to_account_id)
    REFERENCES account(account_id)
);


--OTP TABLE
CREATE TABLE otp(
    otp_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL,
    otp_code VARCHAR(10),
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    verified BOOLEAN,
    verified_at TIMESTAMP,

    CONSTRAINT fk_otp_transaction
    FOREIGN KEY(transaction_id)
    REFERENCES transaction_record(transaction_id)
);


--NOTIFICATION TABLE
CREATE TABLE notification(
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200),
    message TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP,

    CONSTRAINT fk_notification_user
    FOREIGN KEY(user_id)
    REFERENCES users(user_id)
);


--AUDIT LOG TABLE
CREATE TABLE audit_log(
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255),
    entity_type VARCHAR(100),
    entity_id INT,
    performed_at TIMESTAMP,
    ip_address VARCHAR(50),

    CONSTRAINT fk_audit_user
    FOREIGN KEY(user_id)
    REFERENCES users(user_id)
);


--AI ASSISTANT TABLE
CREATE TABLE ai_assistant(
    assistant_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    version VARCHAR(50),
    status VARCHAR(20)
);


--AI CHAT TABLE
CREATE TABLE ai_chat(
    chat_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    assistant_id INT NOT NULL,
    question TEXT,
    response TEXT,
    created_at TIMESTAMP,

    CONSTRAINT fk_chat_customer
    FOREIGN KEY(customer_id)
    REFERENCES customer(customer_id),

    CONSTRAINT fk_chat_assistant
    FOREIGN KEY(assistant_id)
    REFERENCES ai_assistant(assistant_id)
);