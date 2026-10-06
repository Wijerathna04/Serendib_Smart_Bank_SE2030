# Serendib Smart Bank testing report

## Latest verification after authorized test database setup

The user subsequently authorized creating `serendib_local_test`. Fresh schema creation, upgrade 001 and demo seed execution succeeded. Java 17 startup with Hibernate validation succeeded, and all four seeded roles passed live login/profile checks. After the query fixes and final restart, live GET /api/transactions (Customer) and GET /api/admin/audit-logs (Admin) both returned HTTP 200; frontend localhost:5173 also returned 200. Both local servers were left running. The original `smartbank_db` was not modified.

The latest `clean test` against this test database passed: **43 tests, zero failures/errors/skips**. This supersedes the earlier database-blocked build result below. A live transaction-history HTTP 500 exposed PostgreSQL null-parameter typing and implicit inner-join problems. TransactionRecordRepository now explicitly casts optional search/date parameters and retains left joins through both account owners, so single-ended bill/FD records remain visible. The same optional date typing was corrected in AuditLogRepository. A new TransactionHistoryIntegrationTests test inserts rollback-only fixtures and verifies null filters, case-insensitive search, single-ended transactions, type filtering and another user's exclusion against PostgreSQL.

Additional changed files: repository/TransactionRecordRepository.java, repository/AuditLogRepository.java, src/test/java/com/smartbank/smartbank_api/TransactionHistoryIntegrationTests.java, and these test/database reports. Commands: the schema and seed were applied using psql -X -w -h localhost -U postgres -d serendib_local_test -v ON_ERROR_STOP=1 -f database/schema.sql (then database/sample_data.sql). The final Maven command was `.\mvnw.cmd -B -ntp clean test` with process-local JAVA_HOME pointing to portable Java 17, DB_URL=jdbc:postgresql://localhost:5432/serendib_local_test and DB_USERNAME=postgres; credentials were inherited without printing them. Latest log: TEMP/serendib-db-tests.log; detailed results: target/surefire-reports.

**Overall comprehensive testing remains incomplete:** browser testing, full financial workflows/concurrency, existing-data upgrades and the FD/Notification read-only requirement decision are outstanding. The sections below preserve the original test run and its then-current blockers.

Date: 2026-09-20. Overall status: BLOCKED — testing is incomplete; do not treat this project as release-ready.

No real database was connected to or modified. No SQL was executed. No Git commit, push, merge, reset, or history change was performed. Existing folders were retained.

Status meanings: PASS = executed successfully within the stated scope; FAIL = executed check failed or an inspected requirement is violated; BLOCKED = a required dependency/decision is unavailable; NOT TESTED = not executed. Mock-based tests do not establish SQL correctness, durable effects, transaction rollback, or browser behavior.

## 1. Backend build

| Check | Status | Evidence |
| --- | --- | --- |
| Manifest paths | PASS | All 123 created and 16 modified paths listed in DEVELOPMENT_HANDOFF.md exist; 139 unique entries, none missing. This verifies the manifest, not a fresh Git-baseline diff. |
| Java package paths / duplicate source | PASS | Script checked 105 main Java files: no package/path mismatches or byte-identical duplicates. |
| Constructor field dependency graph | PASS | Static graph of final project-class fields found no cycles; full Spring context initialization remains blocked. |
| Java 17 compilation | PASS | Final clean run compiled 105 main and 6 test source files with release 17 using Temurin 17.0.20.1. |
| Isolated automated tests | PASS | 41 tests passed: BankingRulesTests 14, SecurityHttpTests 7, TransactionPostingTests 8, ModuleWorkflowTests 12. |
| Complete `clean test` | FAIL | 42 tests run, 0 assertion failures, 1 context initialization error, 0 skipped. Database connection refused at the deliberately isolated endpoint 127.0.0.1:1. |

Initial sandbox failures were Maven cache access denied and esbuild spawn EPERM. Authorized elevated retries resolved both. The default system Java is 26; a portable JDK 17 was downloaded to the temporary directory and used through process-local JAVA_HOME. System Java configuration was not changed. The POM now targets Java 17 instead of 21.

## 2. Frontend build

| Check | Status | Evidence |
| --- | --- | --- |
| Dependency installation | PASS | npm.cmd install --ignore-scripts --no-audit --no-fund completed, dependencies up to date. |
| TypeScript and production build | PASS | Final npm.cmd run build completed; 60 modules transformed. Generated HTML, CSS and JS. |
| Lint | NOT TESTED | No lint script or lint configuration is provided. |
| Dependency vulnerability audit | NOT TESTED | Installation audit was disabled; no vulnerability-clean claim is made. |
| Browser hooks, rendering, console, responsive layout | BLOCKED | Browser tool returned “No browser is available.” |

No frontend source or UI design was changed during this test pass.

## 3. Database compatibility

Source/schema review completed; migration execution and live compatibility: BLOCKED. See DATABASE_COMPATIBILITY_REPORT.md for existing requirements, entity mappings, constraints, seed conflicts and migration order.

FAIL found and repaired in source: loan.status VARCHAR(20) could not hold MORE_INFORMATION_REQUIRED (25 characters) or PENDING_MANAGER_REVIEW (22). Upgrade 001 now widens the column to VARCHAR(40); Loan.status has matching length metadata. This is not yet verified against PostgreSQL and has not been applied to any database.

The application requires the upgrade, not just the original 16-table schema. Hibernate validation and SQL auto-initialization settings were retained. Creating/seeding an isolated test database awaits an answer to the permission question; no real database changes are authorized.

## 4. Application startup

Backend startup: FAIL in the available isolated configuration; successful startup: BLOCKED by database availability.

An actual spring-boot:run on Java 17.0.20.1 discovered 18 JPA repositories and initialized Tomcat on port 8081. Hibernate could not obtain JDBC metadata because no PostgreSQL server exists at the deliberately selected test address 127.0.0.1:1. The subsequent dialect error is a consequence of that connection failure, not a reason to force a dialect or disable validation. Full repository query initialization, entity validation, and controller registration are not proven.

Environment presence was checked without displaying values: DB_PASSWORD and JWT_SECRET are present; DB_URL and DB_USERNAME are absent, so normal startup would use their configured defaults. The test commands overrode database access to avoid reaching that real/default database.

Frontend startup: PASS at server/HTTP level. Vite started on 127.0.0.1:5173; GET /login and GET /src/main.tsx returned 200. The dev server was left running for inspection. Use http://localhost:5173 for the default backend CORS allowlist. A 200 HTML response does not prove the React login form rendered. Browser-level startup and dashboard routing: BLOCKED.

## 5. Authentication

PASS (isolated tests): registration assigns Customer, normalizes email, hashes the password, saves the customer and requests a welcome notification; valid login returns the user; wrong password, unknown user and disabled user are rejected. BCrypt salted verification, JWT malformed/foreign-signature rejection, logout revocation, user-wide revocation, idle timeout and absolute expiry checks passed.

Live POST /auth/register, POST /auth/login, POST /auth/logout, profile/password persistence and demo seed logins: BLOCKED. No real credentials or tokens are included in this report.

## 6. Authorization

PASS in MockMvc using the real SecurityConfig/JwtAuthFilter: anonymous and malformed bearer requests return 401; valid customer bearer accesses accounts; revoked tokens and disabled users return 401. The Customer/Employee/Manager/Admin role matrix and shared staff role sets passed. Unconfigured routes are denied.

The accounts controller is real with mocked AccountService. Other role-matrix URLs use a test fixture controller to isolate the filter policy; they are not evidence that the corresponding production controller or repository works.

Database-backed ownership for every module and role changes during active sessions: BLOCKED. Isolated tests verify notification ownership query arguments and rejection of another transaction initiator.

## 7. CRUD results

| Module | Create | Read | Update / lifecycle | Delete / cancel | Scope |
| --- | --- | --- | --- | --- | --- |
| User/customer | PASS | BLOCKED | BLOCKED | BLOCKED | Create is mocked service registration only; live persistence untested. |
| Accounts | PASS | BLOCKED | PASS | PASS | PASS means actual controller rejects unsupported POST/PUT/DELETE with 405; no creation/deletion occurred. |
| Fixed deposits | BLOCKED | BLOCKED | BLOCKED | BLOCKED | Read-only requirement conflict awaits resolution; calculation test passed separately. |
| Notifications | BLOCKED | PASS | BLOCKED | BLOCKED | Read test checks owner filtering and hidden-record rejection with mocks. |
| Transfers/transactions | BLOCKED | BLOCKED | PASS | PASS | Posting/retry/failure/cancel logic with mocks; history and durable effects blocked. |
| Bills | PASS | BLOCKED | BLOCKED | BLOCKED | PASS means insufficient funds is rejected before creating a pending bill/OTP, in a unit test. |
| Beneficiaries | BLOCKED | BLOCKED | PASS | PASS | Mocked update and soft removal; removed records cannot be edited. |
| Loans | BLOCKED | BLOCKED | PASS | BLOCKED | Mocked officer/information/manager lifecycle, separation of duties, five decision saves. |
| Cards | BLOCKED | BLOCKED | PASS | PASS | Mocked issuance/activation/block/unblock/cancel, masked number and terminal-state rejection. |
| Feedback/reviews | BLOCKED | PASS | PASS | NOT TESTED | Mocked eligible public query and moderation; no delete feature in approved source contract. |
| Audit/FAQ | BLOCKED | BLOCKED | NOT TESTED | NOT TESTED | Audit events asserted as collaborator calls only; no live audit or FAQ tests. |

All database effects and frontend CRUD behavior are BLOCKED. These partial PASS entries must not be read as full CRUD certification. No unsupported CRUD endpoint was added merely for testing.

Executed HTTP checks:

| Request | Expected / actual response | Status | Database effect / UI |
| --- | --- | --- | --- |
| GET /api/accounts, no bearer | 401, code UNAUTHENTICATED | PASS | None; mocked service; UI NOT TESTED |
| GET /api/accounts, malformed bearer | 401 | PASS | None; UI NOT TESTED |
| GET /api/accounts, valid/revoked/disabled fixture user | 200 / 401 / 401 | PASS | None; account response mocked |
| POST /api/accounts; PUT and DELETE /api/accounts/1, Customer | 405 METHOD_NOT_ALLOWED | PASS | No write method executed |
| GET /api/accounts/invalid, Customer | 400 INVALID_REQUEST | PASS | No persistence |
| GET staff/manager/admin fixture paths with each role | Authorized role 200, disallowed role 403 | PASS | Test fixture only |
| GET /api/notifications fixture with each authenticated role | 200 | PASS | Security policy only; no real notification query |
| OPTIONS /api/accounts with localhost:5173 origin | 200 and matching allow-origin | PASS | None |
| OPTIONS /api/accounts with untrusted origin | 403 and no allow-origin | PASS | None |
| GET /unconfigured, Admin | 403 | PASS | None |
| GET frontend /login and /src/main.tsx | 200 | PASS | HTTP assets only, not rendered UI |

## 8. Six member results

| Member | Assigned modules | Executed checks | Full module result |
| --- | --- | --- | --- |
| IT25103586 | Customer / Bill Payment | Registration, login and rejected insufficient-funds bill unit tests PASS | BLOCKED: live API, DB and UI |
| IT25102635 | Account / Fixed Deposit / Notification | Account write rejection, FD calculation, notification ownership unit tests PASS | BLOCKED: live tests and read-only conflict |
| IT25103677 | Fund Transfer / OTP | Posting and OTP unit tests PASS | BLOCKED: persistence, rollback, concurrency and UI |
| IT25101802 | Transaction / Beneficiary | Retry/cancel/idempotency and beneficiary lifecycle unit tests PASS | BLOCKED: history queries, SQL and UI |
| IT25100771 | Loan | Review/information/recommendation/decision and separation checks PASS; schema defect repaired | BLOCKED: PostgreSQL lifecycle and UI |
| IT25101689 | Card / Feedback / Review | Lifecycle, masking, review publication eligibility tests PASS | BLOCKED: SQL and UI |

## 9. Account / Fixed Deposit / Notification read-only requirement

Accounts: PASS for tested unsupported write methods; source exposes only GET mappings in AccountController.

Fixed Deposit read-only inspection: FAIL. Source currently exposes POST /api/fixed-deposits and PUT /{id}/close and /{id}/cancel, as required by the earlier approved implementation.

Notification read-only inspection: FAIL. Source currently exposes PUT /{id}/read, PUT /{id}/unread and DELETE /{id}, also previously approved.

The latest test instruction conflicts with those earlier approved write workflows and also says to preserve functionality. A clarification question is pending. Those actions have not been removed or exercised against a database. Internal notification creation for transaction events is separately requested and is not an arbitrary customer notification-send API.

## 10. OTP

PASS in isolation: invalid code increments attempts; fifth failed attempt locks; correct code at expiry is rejected; successful verification prevents reuse; issuance delivers a six-digit code and stores a hash; cooldown is enforced; resend retains attempts; a locked challenge cannot be reset by resend.

Persistent counters, commit-on-rejection, concurrent verify/resend, live simulator visibility and browser OTP dialog: BLOCKED.

## 11. Transactions

PASS in isolation: transfer conserves total funds, account locks are requested in ascending ID order, completion requests both sender/recipient notifications, duplicate verification does not post twice, insufficient funds/frozen destination/overflow fail before balance changes, expired authorization avoids OTP/account access, cancellation is idempotent. Changed payload with an existing key and another user's authorization are rejected.

PostgreSQL row locking, actual rollback after downstream failure, multi-request races, bill/FD settlement, durable notification atomicity and history query behavior: BLOCKED. Mock tests cannot establish any of these properties.

## 12. Security

PASS within isolated test scope: password hashing, JWT/session checks, all four role restrictions, account write rejection, CORS and selected safe error responses. Source inspection found parameterized repository queries and explicit DTO responses; that is not a penetration-test result. No secrets were printed intentionally.

Live SQL injection checks, comprehensive IDOR checks and database-outage HTTP behavior: BLOCKED by the unavailable isolated runtime. Rate-limit HTTP tests, full sensitive-field serialization review and dependency audit: NOT TESTED. In-memory sessions and OTP mailbox remain single-instance development limitations.

## 13. End-to-end

BLOCKED. Registration → login → transaction → OTP → confirmation → notification → history has not been run with a database or browser. No end-to-end pass is claimed. The browser tool reported no available browser; the isolated database decision remains pending.

## 14. Remaining issues

1. Approve or decline a disposable test database. Without it, migration, startup, live CRUD, rollback and end-to-end results cannot be completed safely.
2. Resolve whether FD and Notification customer write actions must now be removed. Current source does not satisfy the latest all-three-read-only wording.
3. Connect a browser for rendering, routing, console and interaction tests.
4. Execute the repaired migration and verify loan transitions in PostgreSQL before accepting the column-width fix as runtime-proven.
5. The existing contextLoads test depends on an external database; it remains failing rather than being disabled or mocked away.
6. The default system JDK remains 26; use a JDK 17 JAVA_HOME when building/running.

## 15. Files changed during testing

Modified:

- backend/smartbank-api/pom.xml — target Java 17.
- backend/smartbank-api/src/main/java/com/smartbank/smartbank_api/entity/Loan.java — status length 40.
- database/upgrade_001_full_project.sql — widen loan status before lifecycle checks.
- README.md — Java 17 requirements.
- docs/reports/FULL_TESTING_CHECKLIST.md — Java 17 compilation requirement.

Created inside existing folders:

- backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/BankingRulesTests.java
- backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/SecurityHttpTests.java
- backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/TransactionPostingTests.java
- backend/smartbank-api/src/test/java/com/smartbank/smartbank_api/ModuleWorkflowTests.java
- docs/reports/DATABASE_COMPATIBILITY_REPORT.md
- docs/reports/TESTING_REPORT.md

Generated build output exists in backend target and frontend dist/node_modules. The portable JDK and command logs are in the user's temporary directory. No folders were reorganized. The original context test was retained.

## 16. Commands and evidence

Run from frontend:

```powershell
npm.cmd install --ignore-scripts --no-audit --no-fund
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1
Invoke-WebRequest -Uri 'http://127.0.0.1:5173/login' -UseBasicParsing
Invoke-WebRequest -Uri 'http://127.0.0.1:5173/src/main.tsx' -UseBasicParsing
```

Build was executed initially (sandbox EPERM), retried successfully with permission, and repeated successfully for the final build. npm.cmd avoids the PowerShell npm.ps1 execution-policy issue.

Portable JDK setup (temporary directory, official Adoptium download):

```powershell
$jdkArchive = Join-Path $env:TEMP 'serendib-testing-jdk17.zip'
Invoke-WebRequest -Uri 'https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse' -OutFile $jdkArchive
Expand-Archive -LiteralPath $jdkArchive -DestinationPath (Join-Path $env:TEMP 'serendib-testing-jdk17') -Force
$env:JAVA_HOME = Join-Path $env:TEMP 'serendib-testing-jdk17\jdk-17.0.20.1+1'
& "$env:JAVA_HOME\bin\java.exe" -version
```

Backend commands from backend/smartbank-api, in execution order (early runs used default Java 26; later runs used Java 17):

```powershell
.\mvnw.cmd clean test '-Dspring.datasource.url=jdbc:postgresql://127.0.0.1:1/isolated_test_unavailable' '-Dspring.datasource.password=unused-test-value'
# Initial sandbox failure; identical command retried with permission.
.\mvnw.cmd -B -ntp test '-Dtest=BankingRulesTests'
# JAVA_HOME set to portable Java 17 from this point.
.\mvnw.cmd -B -ntp test '-Dtest=BankingRulesTests,SecurityHttpTests'
.\mvnw.cmd -B -ntp test '-Dtest=BankingRulesTests,SecurityHttpTests,TransactionPostingTests'
.\mvnw.cmd -B -ntp clean test '-Dspring.datasource.url=jdbc:postgresql://127.0.0.1:1/isolated_test_unavailable' '-Dspring.datasource.password=unused-test-value' *> (Join-Path $env:TEMP 'serendib-final-maven-test.log')
```

Separate startup attempt used process-local variables only:

```powershell
$env:JAVA_HOME = Join-Path $env:TEMP 'serendib-testing-jdk17\jdk-17.0.20.1+1'
$env:DB_URL='jdbc:postgresql://127.0.0.1:1/isolated_test_unavailable'
$env:DB_USERNAME='isolated_test'
$env:DB_PASSWORD='unused-test-value'
$env:JWT_SECRET=[Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
.\mvnw.cmd -B -ntp spring-boot:run *> (Join-Path $env:TEMP 'serendib-startup-test.log')
```

The displayed password value above is an unused test placeholder, not a database credential. The generated signing value was not displayed. Full test evidence is in backend/smartbank-api/target/surefire-reports; command logs are serendib-final-maven-test.log and serendib-startup-test.log under TEMP. Read-only inspections used rg, Get-Content, Test-Path, Get-Command and an in-memory Node script for package/hash/dependency checks. Browser attempt: cua.getBrowser({url:'http://127.0.0.1:5173'}) returned no available browser.

## 17. Final project status

BLOCKED — frontend builds; Java 17 compilation and 41 isolated tests pass; the full backend test command fails on the unchanged context test because no authorized isolated database is available. Successful backend startup, migrations, live module CRUD, database consistency and browser/end-to-end verification are not complete. The two pending requirement/authorization questions must be resolved before continuing the affected work.
