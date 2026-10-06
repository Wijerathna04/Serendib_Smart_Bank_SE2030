# SmartBank database

PostgreSQL is the source of truth. Hibernate uses ddl-auto=validate and SQL auto-initialization is disabled. No application startup code drops, rebuilds, seeds, or upgrades a database.

## Existing database

1. Back up the database and stop any running application instance.
2. Inspect upgrade_001_project.sql and resolve any reported preflight conflicts.
3. From the repository root, explicitly run:

    psql -U postgres -d smartbank_db -f database/upgrade_001_project.sql

The script takes an advisory lock, executes inside a transaction, records schema version 1, and rejects a repeated application. It preserves accounts and balances. Legacy pending authorizations are cancelled and legacy OTP codes are invalidated because they cannot safely authorize the new posting workflow. Existing financial history is retained.

New constraints deliberately fail on incompatible legacy data (for example missing/negative account balances, unknown transaction types, duplicate active beneficiaries, duplicate role names ignoring case, or multiple OTP rows for one transaction). Resolve those records deliberately; do not delete history to force an upgrade.

## Fresh empty database

Only for an empty database:

    psql -U postgres -d smartbank_db -f database/schema.sql

schema.sql creates the existing baseline tables and then includes upgrade_001_project.sql using psql's relative include command. It contains no DROP statements. Do not run it against an existing schema.

## Optional demonstration data

After schema creation/upgrade, explicitly run:

    psql -U postgres -d smartbank_db -f database/sample_data.sql

Demo users: john_customer, jane_customer, bank_employee, branch_manager, system_admin.
Demo password: DemoBank!2026

The BCrypt hash was generated with Spring Security's BCrypt implementation. These public demonstration credentials must never be used for real accounts. Roles are looked up by case-insensitive name, not hard-coded SERIAL values. The script corrects the original four seed identities only where their known email matches. Reapplying it resets matching demo passwords/roles but never overwrites an existing account balance.

The intended corrections are john_customer -> Customer; bank_employee -> Employee; branch_manager -> Manager; system_admin -> Admin. On the original empty-schema insertion order those IDs are 2, 4, 3, 1 respectively. Actual live IDs are not assumed.

Accounts: john_customer owns 1000000001 and 1000000002; jane_customer owns 2000000001. Registration creates a Customer profile, not a bank account. Seeded balances are LKR simulation funds.

## Tables

Existing tables retained: role, users, customer, employee, account, beneficiary, feedback, loan, card, bill_payment, transaction_record, otp, notification, audit_log, ai_assistant, ai_chat.

New tables: fixed_deposit, loan_decision, favourite_biller, database_schema_version.

There is no Review table. Public reviews are exactly feedback_type=REVIEW and status=APPROVED. Private COMPLAINT/SERVICE records never enter the public projection. REVIEW records cannot transition to RESOLVED/CLOSED.

The existing notification table is reused. Financial amounts use NUMERIC(12,2); IDs follow SERIAL/INT. Monetary requests use the shared transaction_record/otp tables. Pending requests do not reserve balances. Simulated bill/FD settlement may have only one local account endpoint, constrained by transaction type; this is not a general-purpose double-entry accounting ledger.

## Verification status

These scripts have been authored but not executed against a database during development. PostgreSQL execution, entity mapping validation, migrations, and seed login verification are reserved for START FULL TESTING.
