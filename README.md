# Serendib Smart Bank

Web-based academic banking simulation for SE2030, group **2026-Y2-S1-MLB-B5G1-02**.

## Team

| Student | Responsibility |
| --- | --- |
| IT25103586 ? Navishika D.M.N.N. | User/customer management and bill payment |
| IT25102635 ? Wanniarachchi U.P. | Read-only accounts, fixed deposits, notifications |
| IT25103677 ? Wijerathna T.L.R.B. | Transfers and OTP |
| IT25100771 ? Jayasinghe W.M.S.B. | Loans |
| IT25101802 ? Sanketh W.A.N. | Transactions and beneficiaries |
| IT25101689 ? Vidara M.K.A.O. | Cards, feedback, public reviews |

## Development handoff

Phases 1?5 source implementation is complete. Final compilation, startup, database execution, automated tests, browser verification, and end-to-end testing have **not** been performed; they await explicit START FULL TESTING authorization. See docs/reports/DEVELOPMENT_HANDOFF.md for the file inventory and limitations, and docs/reports/API_REFERENCE.md for endpoints.

## Structure

The original backend/, database/, docs/, and frontend/ folders are retained. All production Java classes remain below com.smartbank.smartbank_api in the existing layer folders. There is one shared entity per domain concept.

Backend: Java 17, the existing Spring Boot/Maven stack, Spring MVC, JPA, PostgreSQL, BCrypt, JWT.
Frontend: React, TypeScript, React Router, Vite, and a shared fetch client.
Currency: LKR. No real banking, card, ATM, or interbank network connections.

## Database setup

Read database/README.md before applying scripts. Existing databases use database/upgrade_001_project.sql. Empty databases use database/schema.sql. Seeds are explicit and optional. No scripts run automatically.

## Backend configuration

Local development: use `backend/smartbank-api/.env` (copy `.env.example` if missing).
Set `DB_PASSWORD` to the existing PostgreSQL user's password and `JWT_SECRET` to a
cryptographically random secret of at least 32 characters. The local file created
during setup already has a generated JWT secret; its database password must be filled in.
Spring Boot imports this file when launched from `backend/smartbank-api` or the
repository root. OS environment variables can also supply these values and take precedence.
The file uses Java properties syntax: do not quote values, and write literal
backslashes as `\\`. Local `.env` files are ignored by Git.

Required environment values:

- DB_PASSWORD: local PostgreSQL password.
- JWT_SECRET: a randomly generated secret with at least 32 UTF-8 bytes. Never commit it.

Optional settings:

- DB_URL (default jdbc:postgresql://localhost:5432/smartbank_db)
- DB_USERNAME (default postgres)
- PORT (default 8081)
- CORS_ORIGINS (default http://localhost:5173; comma-separated exact origins)
- BANK_OTP_SIMULATION_ENABLED=true to enable the academic OTP mailbox.
- FD_MINIMUM_AMOUNT, FD_RATE_3, FD_RATE_6, FD_RATE_12 for simulated FD products.

When testing is authorized, set these values in the terminal and run from backend/smartbank-api:

    .\mvnw.cmd spring-boot:run

Use the Maven wrapper and JDK 17. The backend requires the upgraded PostgreSQL schema and existing roles. No development credentials are embedded in application.properties.

## Frontend configuration

Copy frontend/.env.example to frontend/.env locally. It contains only a backend URL and simulation flag; never put JWT signing secrets or database credentials in frontend environment variables.

When testing is authorized, from frontend/:

    npm.cmd ci
    npm.cmd run dev

Open http://localhost:5173. Set VITE_OTP_SIMULATION=true only alongside the backend simulator setting. The OTP dialog then offers a deliberate Show simulated code action for the current user's pending transaction. Outside simulation mode no delivery provider is configured, so monetary initiation fails explicitly instead of pretending a code was sent.

Dependency installation and package-lock generation were done during development with lifecycle scripts disabled. No frontend build or test was run.

## Demonstration identities

After explicitly applying sample_data.sql, all demo users use DemoBank!2026:

- john_customer and jane_customer: Customer
- bank_employee: Employee (customer service / loan officer)
- branch_manager: Manager
- system_admin: Admin (including audit access)

These are public demo-only credentials. Customers can register without an account; the account screens display an empty state until controlled account provisioning occurs.

## Implemented workflows

- Registration creates User and Customer atomically; existing authentication is extended.
- Read-only customer account list/details/balance.
- FD request -> OTP funding -> ACTIVE -> MATURED -> OTP closure -> CLOSED.
- Notifications: own list/detail/filter/count, read/unread, soft hide.
- Internal transfer and bill payment through one locked, transactional posting service.
- Transaction search/date/type/status filtering, pagination, details, confirmation.
- Owned beneficiary add/edit/deactivate with duplicate prevention.
- Loan review, additional information, recommendation, final manager decision, cancellation, decision history.
- Simulated card request/issue/activate/block/unblock/cancel and expiry checks.
- Typed private feedback and moderated public reviews using the existing feedback table.
- Audit search and a simple rule-based FAQ helper using existing AI tables.
- Customer, Employee, Manager, and Admin React workspaces.

## Security and scope

JWT signatures and absolute expiry are retained. In-memory per-token state enforces logout and a ten-minute inactivity timeout. Disabled-user status and current role are checked on each bearer request. Restart signs users out; this setup targets one application instance. Tokens stay in browser memory. Background polling does not extend inactivity. Password change revokes every session for that user.

API responses use explicit DTO projections. OTPs are hashed, expire, have bounded attempts and cooldown, and are bound to an immutable transaction. Account balance changes exist only in TransactionPostingService. Idempotency keys and row locks prevent repeated posting. Public reviews omit private customer/moderation data. CORS is an explicit origin allowlist.

FD rates are academic values, not real Sri Lankan banking offers. Interest uses simple annual percentage interest prorated by months and rounds the final amount with HALF_EVEN to two decimals. Maturity alone does not credit an account. No early closure/renewal is implemented. Loan approval does not disburse funds. Cards are synthetic and never store PIN/CVV.

Scheduled transactions, password recovery, advanced AI, ATM, external-bank simulation, and reporting are deferred so optional scope does not destabilize the required modules. Password change and basic FAQ navigation are present.

## Git

All changes remain uncommitted. No push, merge, branch deletion, or destructive Git operation is part of this development handoff.
