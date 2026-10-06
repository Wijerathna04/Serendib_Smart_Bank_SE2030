# Full testing checklist ? not executed

This document is preparation for the separately authorized Phase 6. Do not interpret an unchecked item as a passed test.

## Build and database

- [ ] Compile the complete Java 17 backend with its Maven wrapper.
- [ ] Build/type-check the React frontend from package-lock.json.
- [ ] Confirm the declared Spring Boot/JJWT/Jackson dependencies and imports resolve.
- [ ] Apply schema.sql and sample_data.sql only to a disposable empty PostgreSQL database.
- [ ] Apply upgrade_001_full_project.sql to a separate copy of the original baseline; confirm repeat execution is refused and transaction rollback preserves data on preflight failure.
- [ ] Validate all 18 entity/table mappings; start Spring Boot with ddl-auto=validate.
- [ ] Confirm no automatic schema/seed execution occurs.
- [ ] Confirm all demo credentials and correct role assignments.

## Identity/security

- [ ] Registration creates one User and one Customer atomically; duplicate username/email fail safely.
- [ ] Register cannot choose an elevated role or create a bank account.
- [ ] Bad, missing, malformed, expired and revoked credentials are rejected.
- [ ] Disabled users cannot use previously issued JWTs.
- [ ] Logout, password changes, role changes and user disabling revoke intended sessions.
- [ ] Ten-minute inactivity timeout is enforced by the backend; UI polling does not keep it alive.
- [ ] Re-login is required after backend restart.
- [ ] Every Customer/Employee/Manager/Admin endpoint denies other roles.
- [ ] Origin allowlist and preflight behavior work for the configured frontend only.
- [ ] Responses/logs contain no password hashes, OTP hashes, JWT secret, full synthetic card IDs, or raw credentials.
- [ ] Unknown customer-owned IDs and another customer's IDs produce equivalent not-found behavior.
- [ ] Last active administrator protections and reviewer/manager separation work under concurrent requests.

## Core banking

- [ ] Account lists/details are owned and read-only; no account write routes exist.
- [ ] FD products come from backend configuration and are labelled simulated.
- [ ] FD principal/rate/term/rounding/date calculation and amount boundaries are correct.
- [ ] FD opening debits exactly once after OTP; pending cancellation debits nothing.
- [ ] Maturity job is idempotent and catches up after downtime; maturity alone credits nothing.
- [ ] Matured closure credits principal plus interest once; repeated closure/confirmation cannot credit twice.
- [ ] Bills retain references/history and post one matching debit/transaction.
- [ ] Transfer debit and credit succeed together or both roll back.
- [ ] Same-account, invalid-beneficiary, zero/negative amount, frozen account, insufficient balance and capacity-limit requests fail.
- [ ] Simultaneous transfers cannot overdraw a source account; opposing transfers do not leave partial writes.
- [ ] Idempotency retries return/identify existing requests; a reused key with a changed payload conflicts.
- [ ] OTP hash storage, expiry, global request expiry, attempts, cooldown, resend invalidation and replay prevention work.
- [ ] Invalid OTP attempts persist when the endpoint returns an error.
- [ ] Recipients cannot authorize or cancel the sender's transaction or view the sender's simulation code.
- [ ] Cancellation/expiry/failed-posting updates corresponding FD/bill lifecycle state, audit and notification consistently.
- [ ] Transaction history, search, filters, pagination and receipts preserve ownership, including own-account transfers.
- [ ] Beneficiary create/update/deactivate and duplicate constraints work; edits cannot redirect an existing pending transaction.

## Staff and customer workflows

- [ ] Customer profile edits and staff profile views enforce their permitted fields/roles.
- [ ] Loan application, claim review, request information, customer response, recommendation, manager decision and cancellation work.
- [ ] Only the assigned employee reviews an already-claimed application.
- [ ] Loan decision history preserves reasons and previous submitted information.
- [ ] Loan approval does not disburse money.
- [ ] Card request/issue/activation/block/unblock/cancellation and expiry behavior work.
- [ ] Card duplicate requests are protected under concurrency.
- [ ] Feedback type/rating validation and every moderation transition work.
- [ ] Public review list and summary contain only REVIEW + APPROVED records.
- [ ] Private complaints/service requests never appear in public responses.
- [ ] Approved reviews cannot be resolved/closed and remain visible.
- [ ] Notification list/detail/filters/count/read/unread/hide are own-user only; hidden notifications cannot be restored by mark-unread.
- [ ] Audit records include relevant successful and failed operations without secrets; system/anonymous actors remain visible.
- [ ] FAQ/chat history is owned; the helper has no transactional/administrative capabilities.

## Frontend/end-to-end

- [ ] Login/register/customer/staff/manager/admin navigation and protected routes.
- [ ] Every required form, list, detail, confirmation, validation, loading, empty and failure state.
- [ ] Shared OTP dialog works for transfers, bills and both FD operations.
- [ ] Simulation code disclosure is deliberate and disabled unless both simulator flags are enabled.
- [ ] Network failure preserves a financial request key; users can inspect history before retrying.
- [ ] In-memory token behavior, logout, page reload, 401 handling and activity heartbeat.
- [ ] Desktop/mobile layout, keyboard navigation, accessible form labels and printable confirmation.
- [ ] Automated JUnit/Spring/PostgreSQL integration and financial-concurrency tests.
- [ ] Frontend component and end-to-end tests, plus a Postman/API collection.
- [ ] Regression pass and complete application rerun after repairs.

Record actual commands, database targets, pass/fail results and environmental blockers during Phase 6. Nothing in this checklist has been executed as part of Phases 1?5.
