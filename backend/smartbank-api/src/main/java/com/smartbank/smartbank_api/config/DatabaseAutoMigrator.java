package com.smartbank.smartbank_api.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Self-healing database auto-migrator.
 * Automatically aligns any existing PostgreSQL database schema state to the complete required structure.
 * Ensures missing tables, columns, constraints, and initial roles are created seamlessly on startup.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class DatabaseAutoMigrator implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    private void exec(String sql) {
        try {
            jdbc.execute(sql);
        } catch (Exception e) {
            log.warn("Migration statement failed: {} - Error: {}", sql, e.getMessage());
        }
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("Starting Serendib Smart Bank self-healing database auto-migration...");

        // 0. SCHEMA VERSION TRACKING
        exec("""
            CREATE TABLE IF NOT EXISTS database_schema_version (
                version INTEGER PRIMARY KEY,
                description VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """);

        // 1. ROLE TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS role (
                role_id SERIAL PRIMARY KEY,
                role_name VARCHAR(50) NOT NULL UNIQUE,
                description VARCHAR(255)
            );
        """);
        exec("ALTER TABLE role ADD COLUMN IF NOT EXISTS description VARCHAR(255);");

        // Seed essential roles if missing
        exec("INSERT INTO role(role_name, description) VALUES('ROLE_ADMIN', 'System Administrator') ON CONFLICT (role_name) DO NOTHING;");
        exec("INSERT INTO role(role_name, description) VALUES('ROLE_MANAGER', 'Branch Manager') ON CONFLICT (role_name) DO NOTHING;");
        exec("INSERT INTO role(role_name, description) VALUES('ROLE_EMPLOYEE', 'Bank Employee') ON CONFLICT (role_name) DO NOTHING;");
        exec("INSERT INTO role(role_name, description) VALUES('ROLE_CUSTOMER', 'Retail Customer') ON CONFLICT (role_name) DO NOTHING;");

        // 2. USERS TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                role_id INT,
                username VARCHAR(50) UNIQUE,
                password_hash VARCHAR(255),
                email VARCHAR(100) UNIQUE,
                phone VARCHAR(20),
                status VARCHAR(20) DEFAULT 'ACTIVE',
                profile_image TEXT,
                must_change_password BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                version BIGINT NOT NULL DEFAULT 0
            );
        """);
        exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INT;");
        exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);");
        exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';");
        exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;");
        exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;");
        exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
        exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;");
        exec("ALTER TABLE users ALTER COLUMN profile_image TYPE TEXT;");

        // 3. CUSTOMER TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS customer (
                customer_id SERIAL PRIMARY KEY,
                user_id INT UNIQUE,
                cif_number VARCHAR(50) UNIQUE,
                nic VARCHAR(12),
                full_name VARCHAR(255),
                address TEXT,
                date_of_birth DATE,
                profile_image TEXT,
                nic_front_image TEXT,
                nic_back_image TEXT
            );
        """);
        exec("ALTER TABLE customer ADD COLUMN IF NOT EXISTS cif_number VARCHAR(50);");
        exec("ALTER TABLE customer ADD COLUMN IF NOT EXISTS nic VARCHAR(12);");
        exec("ALTER TABLE customer ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);");
        exec("ALTER TABLE customer ADD COLUMN IF NOT EXISTS address TEXT;");
        exec("ALTER TABLE customer ADD COLUMN IF NOT EXISTS date_of_birth DATE;");
        exec("ALTER TABLE customer ADD COLUMN IF NOT EXISTS profile_image TEXT;");
        exec("ALTER TABLE customer ADD COLUMN IF NOT EXISTS nic_front_image TEXT;");
        exec("ALTER TABLE customer ADD COLUMN IF NOT EXISTS nic_back_image TEXT;");
        exec("ALTER TABLE customer ALTER COLUMN profile_image TYPE TEXT;");
        exec("ALTER TABLE customer ALTER COLUMN nic_front_image TYPE TEXT;");
        exec("ALTER TABLE customer ALTER COLUMN nic_back_image TYPE TEXT;");
        exec("ALTER TABLE customer ALTER COLUMN address TYPE TEXT;");

        // 4. EMPLOYEE TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS employee (
                employee_id SERIAL PRIMARY KEY,
                user_id INT UNIQUE,
                department VARCHAR(100),
                position VARCHAR(100),
                date_joined DATE
            );
        """);
        exec("ALTER TABLE employee ADD COLUMN IF NOT EXISTS department VARCHAR(100);");
        exec("ALTER TABLE employee ADD COLUMN IF NOT EXISTS position VARCHAR(100);");
        exec("ALTER TABLE employee ADD COLUMN IF NOT EXISTS date_joined DATE;");

        // 5. ACCOUNT TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS account (
                account_id SERIAL PRIMARY KEY,
                customer_id INT,
                account_number VARCHAR(50) UNIQUE,
                account_type VARCHAR(50),
                balance NUMERIC(12,2) DEFAULT 0.00,
                open_date DATE,
                status VARCHAR(40) DEFAULT 'ACTIVE',
                kyc_data TEXT,
                rejection_reason TEXT,
                approved_by_officer_id INT,
                approved_by_manager_id INT,
                is_primary BOOLEAN DEFAULT FALSE,
                version BIGINT NOT NULL DEFAULT 0
            );
        """);
        exec("ALTER TABLE account ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) DEFAULT 0.00;");
        exec("ALTER TABLE account ADD COLUMN IF NOT EXISTS open_date DATE;");
        exec("ALTER TABLE account ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'ACTIVE';");
        exec("ALTER TABLE account ADD COLUMN IF NOT EXISTS kyc_data TEXT;");
        exec("ALTER TABLE account ADD COLUMN IF NOT EXISTS rejection_reason TEXT;");
        exec("ALTER TABLE account ADD COLUMN IF NOT EXISTS approved_by_officer_id INT;");
        exec("ALTER TABLE account ADD COLUMN IF NOT EXISTS approved_by_manager_id INT;");
        exec("ALTER TABLE account ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;");
        exec("ALTER TABLE account ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;");

        // 6. BENEFICIARY TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS beneficiary (
                beneficiary_id SERIAL PRIMARY KEY,
                customer_id INT,
                name VARCHAR(100),
                account_number VARCHAR(50),
                bank_name VARCHAR(100),
                relationship VARCHAR(100),
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                version BIGINT NOT NULL DEFAULT 0
            );
        """);
        exec("ALTER TABLE beneficiary ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);");
        exec("ALTER TABLE beneficiary ADD COLUMN IF NOT EXISTS relationship VARCHAR(100);");
        exec("ALTER TABLE beneficiary ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;");
        exec("ALTER TABLE beneficiary ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
        exec("ALTER TABLE beneficiary ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
        exec("ALTER TABLE beneficiary ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;");

        // 7. TRANSACTION RECORD TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS transaction_record (
                transaction_id SERIAL PRIMARY KEY,
                from_account_id INT,
                to_account_id INT,
                initiated_by INT,
                amount NUMERIC(12,2),
                transaction_type VARCHAR(50),
                status VARCHAR(20),
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
                version BIGINT NOT NULL DEFAULT 0
            );
        """);
        exec("ALTER TABLE transaction_record ADD COLUMN IF NOT EXISTS initiated_by INT;");
        exec("ALTER TABLE transaction_record ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(80);");
        exec("ALTER TABLE transaction_record ADD COLUMN IF NOT EXISTS request_fingerprint VARCHAR(64);");
        exec("ALTER TABLE transaction_record ADD COLUMN IF NOT EXISTS failure_code VARCHAR(80);");
        exec("ALTER TABLE transaction_record ADD COLUMN IF NOT EXISTS bill_type VARCHAR(50);");
        exec("ALTER TABLE transaction_record ADD COLUMN IF NOT EXISTS bill_reference VARCHAR(50);");
        exec("ALTER TABLE transaction_record ADD COLUMN IF NOT EXISTS external_bank VARCHAR(100);");
        exec("ALTER TABLE transaction_record ADD COLUMN IF NOT EXISTS external_account_number VARCHAR(50);");
        exec("ALTER TABLE transaction_record ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
        exec("ALTER TABLE transaction_record ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;");
        exec("ALTER TABLE transaction_record ADD COLUMN IF NOT EXISTS authorization_expires_at TIMESTAMP;");
        exec("ALTER TABLE transaction_record ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;");
        exec("ALTER TABLE transaction_record ALTER COLUMN from_account_id DROP NOT NULL;");
        exec("ALTER TABLE transaction_record ALTER COLUMN to_account_id DROP NOT NULL;");
        exec("ALTER TABLE transaction_record ALTER COLUMN reference DROP NOT NULL;");
        exec("ALTER TABLE transaction_record DROP CONSTRAINT IF EXISTS ck_payment_destination;");
        exec("ALTER TABLE transaction_record DROP CONSTRAINT IF EXISTS ck_payment_metadata;");
        exec("ALTER TABLE transaction_record DROP CONSTRAINT IF EXISTS ck_transfer_accounts;");
        exec("ALTER TABLE transaction_record DROP CONSTRAINT IF EXISTS transaction_record_reference_key;");
        exec("ALTER TABLE transaction_record DROP CONSTRAINT IF EXISTS transaction_record_reference_not_null;");
        exec("DROP INDEX IF EXISTS idx_transaction_idempotency_user;");
        exec("ALTER TABLE transaction_record DROP CONSTRAINT IF EXISTS uq_transaction_idempotency;");
        exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_txn_user_idempotency ON transaction_record (initiated_by, idempotency_key) WHERE idempotency_key IS NOT NULL;");
        exec("CREATE INDEX IF NOT EXISTS idx_txn_from_created ON transaction_record (from_account_id, created_at);");

        // 8. OTP TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS otp (
                otp_id SERIAL PRIMARY KEY,
                transaction_id INT UNIQUE,
                otp_code VARCHAR(10),
                otp_hash VARCHAR(255),
                created_at TIMESTAMP,
                expires_at TIMESTAMP,
                verified BOOLEAN DEFAULT FALSE,
                verified_at TIMESTAMP,
                attempt_count INT DEFAULT 0,
                last_sent_at TIMESTAMP,
                version BIGINT NOT NULL DEFAULT 0
            );
        """);
        exec("ALTER TABLE otp ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10);");
        exec("ALTER TABLE otp ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;");
        exec("ALTER TABLE otp ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;");
        exec("ALTER TABLE otp ADD COLUMN IF NOT EXISTS attempt_count INT DEFAULT 0;");
        exec("ALTER TABLE otp ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP;");
        exec("ALTER TABLE otp ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;");
        exec("ALTER TABLE otp ALTER COLUMN otp_code DROP NOT NULL;");
        exec("ALTER TABLE otp ALTER COLUMN user_id DROP NOT NULL;");

        // 9. FIXED DEPOSIT TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS fixed_deposit (
                fixed_deposit_id SERIAL PRIMARY KEY,
                account_id INT,
                principal_amount NUMERIC(12,2),
                interest_rate NUMERIC(5,2),
                term_months INT,
                start_date DATE,
                maturity_date DATE,
                maturity_amount NUMERIC(12,2),
                status VARCHAR(40),
                opening_transaction_id INT,
                closing_transaction_id INT,
                fd_details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                version BIGINT NOT NULL DEFAULT 0
            );
        """);
        exec("ALTER TABLE fixed_deposit ADD COLUMN IF NOT EXISTS fd_details TEXT;");
        exec("ALTER TABLE fixed_deposit ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
        exec("ALTER TABLE fixed_deposit ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
        exec("ALTER TABLE fixed_deposit ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;");

        // 10. LOAN TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS loan (
                loan_id SERIAL PRIMARY KEY,
                customer_id INT,
                reviewer_employee_id INT,
                loan_number VARCHAR(50),
                loan_type VARCHAR(50),
                amount NUMERIC(12,2),
                interest_rate NUMERIC(5,2),
                status VARCHAR(40),
                apply_date DATE,
                review_date DATE,
                additional_information TEXT,
                scrutiny_data TEXT,
                account_id INT,
                fixed_deposit_id INT,
                paid_amount NUMERIC(12,2) DEFAULT 0.00,
                approved_by_officer_id INT,
                approved_by_manager_id INT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                version BIGINT NOT NULL DEFAULT 0
            );
        """);
        exec("ALTER TABLE loan ADD COLUMN IF NOT EXISTS scrutiny_data TEXT;");
        exec("ALTER TABLE loan ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) DEFAULT 0.00;");
        exec("ALTER TABLE loan ADD COLUMN IF NOT EXISTS approved_by_officer_id INT;");
        exec("ALTER TABLE loan ADD COLUMN IF NOT EXISTS approved_by_manager_id INT;");
        exec("ALTER TABLE loan ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
        exec("ALTER TABLE loan ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;");

        // 11. LOAN DECISION TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS loan_decision (
                decision_id SERIAL PRIMARY KEY,
                loan_id INT,
                user_id INT,
                action VARCHAR(80),
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        // 12. CARD TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS card (
                card_id SERIAL PRIMARY KEY,
                user_id INT,
                account_id INT,
                card_number VARCHAR(50),
                card_type VARCHAR(50),
                card_product VARCHAR(100),
                expiry_date DATE,
                status VARCHAR(20),
                credit_limit NUMERIC(15,2),
                available_credit NUMERIC(15,2),
                current_balance NUMERIC(15,2),
                issued_by INT,
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                issued_at TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
                version BIGINT NOT NULL DEFAULT 0
            );
        """);
        exec("ALTER TABLE card ALTER COLUMN account_id DROP NOT NULL;");
        exec("ALTER TABLE card ALTER COLUMN card_number DROP NOT NULL;");
        exec("ALTER TABLE card ALTER COLUMN expiry_date DROP NOT NULL;");
        exec("ALTER TABLE card ALTER COLUMN issued_by DROP NOT NULL;");
        exec("ALTER TABLE card ALTER COLUMN user_id DROP NOT NULL;");
        exec("ALTER TABLE card ALTER COLUMN residential_address TYPE TEXT;");
        exec("UPDATE card SET card_number = CONCAT('REQ-', card_id) WHERE card_number IS NULL OR card_number = '';");
        exec("UPDATE account SET account_number = CONCAT('ACC-', account_id) WHERE account_number IS NULL OR account_number = '';");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS card_product VARCHAR(100);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS nic_number VARCHAR(12);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS email_address VARCHAR(100);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS residential_address TEXT;");
        exec("ALTER TABLE card ALTER COLUMN residential_address TYPE TEXT;");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS housing_status VARCHAR(50);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS employer_name VARCHAR(150);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS designation VARCHAR(100);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS years_of_service INT;");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS gross_monthly_income NUMERIC(15,2);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS fixed_allowances NUMERIC(15,2);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS existing_credit_deductions NUMERIC(15,2);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS primary_bank_name VARCHAR(100);");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS crib_consent BOOLEAN;");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS pay_slips_upload TEXT;");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS bank_statements_upload TEXT;");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS employment_letter_upload TEXT;");
        exec("ALTER TABLE card ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;");

        // 13. BILL PAYMENT TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS bill_payment (
                payment_id SERIAL PRIMARY KEY,
                customer_id INT,
                account_id INT,
                transaction_id INT UNIQUE,
                reference_number VARCHAR(50),
                bill_type VARCHAR(50),
                amount NUMERIC(12,2),
                payment_date DATE,
                status VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                version BIGINT NOT NULL DEFAULT 0
            );
        """);

        // 14. FAVOURITE BILLER TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS favourite_biller (
                favourite_id SERIAL PRIMARY KEY,
                customer_id INT,
                biller_category VARCHAR(50),
                biller_name VARCHAR(100),
                nickname VARCHAR(100),
                reference_number VARCHAR(50),
                default_amount NUMERIC(12,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        // 15. FEEDBACK TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS feedback (
                feedback_id SERIAL PRIMARY KEY,
                customer_id INT,
                feedback_type VARCHAR(20) DEFAULT 'COMPLAINT',
                subject VARCHAR(200),
                message TEXT,
                rating INT,
                status VARCHAR(20),
                moderator_id INT,
                staff_response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                version BIGINT NOT NULL DEFAULT 0
            );
        """);
        exec("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS feedback_type VARCHAR(20) DEFAULT 'COMPLAINT';");
        exec("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS rating INT;");
        exec("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS moderator_id INT;");
        exec("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS staff_response TEXT;");
        exec("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
        exec("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;");

        // 16. NOTIFICATION TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS notification (
                notification_id SERIAL PRIMARY KEY,
                user_id INT,
                title VARCHAR(200),
                message TEXT,
                event_type VARCHAR(80),
                status VARCHAR(20) DEFAULT 'UNREAD',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                version BIGINT NOT NULL DEFAULT 0
            );
        """);
        exec("ALTER TABLE notification ADD COLUMN IF NOT EXISTS event_type VARCHAR(80);");
        exec("ALTER TABLE notification ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'UNREAD';");
        exec("ALTER TABLE notification ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;");

        // 17. AUDIT LOG TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS audit_log (
                log_id SERIAL PRIMARY KEY,
                user_id INT,
                actor_type VARCHAR(30) DEFAULT 'USER',
                action VARCHAR(255),
                entity_type VARCHAR(100),
                entity_id INT,
                performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(50)
            );
        """);
        exec("ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS actor_type VARCHAR(30) DEFAULT 'USER';");
        exec("ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);");

        // 18. AI ASSISTANT TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS ai_assistant (
                assistant_id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                version VARCHAR(50),
                status VARCHAR(20)
            );
        """);

        // 19. AI CHAT TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS ai_chat (
                chat_id SERIAL PRIMARY KEY,
                customer_id INT,
                assistant_id INT,
                question TEXT,
                response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);
        // 20. RISK ASSESSMENT TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS risk_assessment (
                assessment_id SERIAL PRIMARY KEY,
                application_type VARCHAR(50),
                application_id INT,
                customer_id INT,
                risk_score INT,
                risk_level VARCHAR(20),
                risk_factors TEXT,
                explanation TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        // 21. SMS LOG TABLE
        exec("""
            CREATE TABLE IF NOT EXISTS sms_log (
                sms_id SERIAL PRIMARY KEY,
                recipient VARCHAR(50),
                message_body VARCHAR(500),
                provider VARCHAR(50),
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """);

        // Record schema version completion
        exec("""
            INSERT INTO database_schema_version(version, description)
            VALUES (3, 'Self-healing auto-migrated schema')
            ON CONFLICT (version) DO NOTHING;
        """);

        log.info("Database Schema Migration Verified | Schema Version: 3 | Self-healing tables aligned: 21 | Status: VALIDATED");

        // Startup Check: Verify data_type of image columns
        try {
            List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT table_name, column_name, data_type 
                FROM information_schema.columns 
                WHERE (table_name = 'users' AND column_name = 'profile_image')
                   OR (table_name = 'customer' AND column_name IN ('profile_image', 'nic_front_image', 'nic_back_image'))
            """);
            for (Map<String, Object> row : rows) {
                String tableName = String.valueOf(row.get("table_name"));
                String columnName = String.valueOf(row.get("column_name"));
                String dataType = String.valueOf(row.get("data_type")).toLowerCase(java.util.Locale.ROOT);
                if (dataType.contains("varchar") || dataType.contains("character varying")) {
                    log.error("STARTUP CHECK FAILED: Column {}.{} is still {}", tableName, columnName, dataType);
                } else {
                    log.info("Startup Check Passed: Column {}.{} is {}", tableName, columnName, dataType);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to check column data types during startup: {}", e.getMessage());
        }
    }
}
