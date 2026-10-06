# Database compatibility review

## Subsequent authorized local setup

After this initial review, the user authorized a separate test database. `serendib_local_test` was created on local PostgreSQL; schema.sql (including upgrade 001) and sample_data.sql completed successfully. It contains 19 public tables, schema version 1, and loan.status VARCHAR(40). Java 17 application startup completed with Hibernate validation enabled. Customer, Employee, Manager and Admin login/profile checks passed. The existing `smartbank_db` was inspected read-only and was not modified. The original review below remains a record of the earlier stage; upgrading an existing populated database is still untested.

Date: 2026-09-20. This is a source/schema review. No SQL was executed and no live database was inspected or changed. Runtime compatibility remains BLOCKED pending authorization for an isolated database.

## Requirements and mapping comparison

The application requires PostgreSQL, the 16 baseline tables, upgrade 001, and configured connection credentials. Hibernate uses `ddl-auto=validate`; SQL auto-initialization is disabled. Scheduled application jobs can update business records after successful startup, so the production database must not be used for this test run.

All 18 JPA entities have matching table definitions across schema.sql and upgrade_001_full_project.sql: role, users, customer, employee, account, beneficiary, feedback, loan, card, bill_payment, transaction_record, otp, notification, audit_log, ai_assistant, ai_chat, fixed_deposit, loan_decision. The nineteenth table, database_schema_version, is migration bookkeeping and has no entity.

Identity fields use Integer/SERIAL; relationships use integer foreign keys. Monetary fields use BigDecimal/NUMERIC(12,2), rates NUMERIC(5,2), optimistic versions long/BIGINT, dates LocalDate/DATE, and local timestamps LocalDateTime/TIMESTAMP. Application time uses Asia/Colombo. JPA default string lengths and nullability are less restrictive than several SQL columns; request validation and SQL constraints remain necessary. Hibernate validation alone is not proof that every business value fits.

## Confirmed source defect and repair

FAIL found by inspection: baseline loan.status was VARCHAR(20), but MORE_INFORMATION_REQUIRED is 25 characters and PENDING_MANAGER_REVIEW is 22. The upgrade previously retained that size, so these transitions would fail at persistence. The migration now widens it to VARCHAR(40), and Loan.status declares length=40. This repair has NOT been applied to any database. PostgreSQL execution and transition testing are still required.

## Required upgrade

Upgrade 001 adds lifecycle checks, version columns, normalized uniqueness, transaction authorization/idempotency metadata, hashed OTP support, notification event metadata, audit actors, loan decisions and fixed deposits. It reuses the existing notification and feedback tables; there is no separate Review table.

The account balance is preserved. Legacy pending transactions are cancelled, old OTP codes are cleared and invalidated, and customer/employee profiles are backfilled for applicable roles. Transaction endpoints become nullable according to transaction type. Public reviews require REVIEW type and APPROVED status.

## Potential existing-data conflicts

- Duplicate case-insensitive role names or user emails prevent normalized unique indexes.
- Null/negative account balances or missing account number/type/status fail preflight; unknown account states fail checks.
- Duplicate active beneficiary destinations and multiple OTP rows for one transaction prevent unique indexes.
- Unknown user, transaction, bill, loan, card, or feedback statuses can fail lifecycle checks.
- Historical transfers with identical endpoints, or bill/FD transactions with both endpoints populated, fail transaction shape checks.
- Null or nonpositive transaction/bill/loan amounts and missing required bill/loan/card/feedback fields prevent migration.
- Pre-existing tables or columns from a partial/manual upgrade may conflict. Version 1 is intentionally not repeatable.
- Legacy pending bill rows are not reconciled automatically with cancelled legacy transaction rows; their transaction_id was not previously stored. Review these records deliberately before enabling workflows.

The migration wraps its changes in a transaction and uses ON_ERROR_STOP and an advisory lock. Fresh schema creation commits the baseline before including the upgrade, so failure of the included upgrade leaves the baseline in place; do not rerun schema.sql blindly.

## Seed conflicts

Demo users are resolved by username and roles by case-insensitive name. Matching known emails permit role/password replacement; differing emails prevent that update. An email belonging to a different username can still fail uniqueness. Disabled demo accounts stay disabled. Existing account numbers are left unchanged, including owner and balance, so seed account ownership must be checked before assuming the demo flows work. Existing assistant rows are not forced active. Demo passwords and signing/database secrets are intentionally omitted from this report.

## Migration order (instructions only; not executed)

1. Stop application instances, back up the intended database, and inspect existing data for the conflicts above.
2. For an existing baseline database, apply only upgrade_001_full_project.sql.
3. For a fresh empty database, apply schema.sql; its relative include applies upgrade 001. Do not apply the upgrade again.
4. Load sample_data.sql only into an explicitly approved demonstration/test database if demo identities are wanted.
5. Configure connection settings, a signing secret and the optional OTP simulation flag. Start with Hibernate validation enabled.
6. Verify constraints, role/identity mappings, login, all lifecycle transitions, rollback, concurrency and idempotency against the isolated database before approving a real migration.

Current result: source comparison performed; known loan column-width defect repaired in files; actual migration, seeding, JPA validation and data compatibility BLOCKED.
