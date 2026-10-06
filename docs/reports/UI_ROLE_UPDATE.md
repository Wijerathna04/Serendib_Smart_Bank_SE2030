# Glass UI and role workspaces

The frontend uses deep navy (`#0A192F`), emerald green (`#10B981`) and pure white (`#FFFFFF`) with translucent panels and backdrop blur. The 60/30/10 visual hierarchy uses a dominant navy canvas, emerald supporting surfaces and controls, and white details in dark mode. Light mode swaps the neutral roles: a white canvas with emerald support and navy text. The compact top-right sun/moon button applies to every route and persists its choice in local storage; the initial choice follows the operating system. Theme rules are in `frontend/src/glass.css`.

All four product banners and four service banners open keyboard-accessible native dialogs with descriptions. Escape closes each dialog and native dialog behavior restores focus to its trigger.

English, Sinhala and Tamil controls are available on the guest page, login/registration and authenticated header. Language preference persists in local storage and updates the document language. Guest copy and product descriptions, role dashboard content, common navigation, shared labels and selected customer controls are translated. Existing workflow explanations and server-provided errors without dictionary entries fall back to English. Customer-entered content is not translated. Extend `frontend/src/i18n.tsx` for additional workflow copy.

## Login and permissions

Use the guest page's Log in button for every role. The authenticated server profile selects the dashboard; visitors cannot select or elevate their role. Existing public registration still creates only customers. Administrators create staff accounts through User management.

| Role | Workspace access |
| --- | --- |
| Customer | Existing personal banking workflows and exchange-rate tiles |
| Employee | Customer profiles, loan review, card issuance and feedback moderation |
| Manager | All employee tools plus final loan decisions |
| Admin | All employee and manager tools, user management, audit logs and bank-wide financial record inspection |

Frontend route guards and backend security match this hierarchy. An administrator without an employee record gets that record when first performing a loan review, within the review transaction. Loan reviewer identity, state transitions, audit records and separation of duties remain enforced. Administrators may inspect financial records but do not impersonate customers or authorize their transfers. Customer ownership and OTP checks remain intact.

The existing schema has no branch entity or staff-to-branch assignment. Manager queues therefore cover the existing bank-wide dataset. Branch-specific isolation requires a separate data-model change. No new account-opening, teller cash, or other banking workflow beyond the repository's existing operations is implied.

## Exchange rates

`GET /api/exchange-rates` is public and fetches the provider's USD-base dataset on the server. The supplied credential is configured in the local ignored `backend/smartbank-api/.env` as `EXCHANGE_RATE_API_KEY`; committed configuration contains only an environment-variable reference and a placeholder. Restart the backend to load it.

Tiles show LKR per one USD, EUR, GBP, AUD or INR, calculated as `USD_to_LKR / USD_to_currency`. These are indicative provider rates, not bank buy/sell quotes. Responses are validated, cached for six hours and time-stamped. The first request after cache expiry fetches fresh rates; requests within that window reuse the cached response. Failed refreshes retain explicitly marked stale data; requests back off for a minute. When no data exists the UI shows an error with Retry, not fabricated rates. Provider requests have five-second connection/read timeouts. Credential-bearing upstream errors are not returned to clients.

Provider contract: [ExchangeRate-API standard request documentation](https://www.exchangerate-api.com/docs/standard-requests).

## Validation on 2 October 2026

- Production frontend build passed.
- 38 targeted backend tests passed: SecurityHttpTests (8), ExchangeRateTests (4), BankingRulesTests (14), ModuleWorkflowTests (12).
- Live provider request succeeded with USD base and all required currencies.
- Headless Chrome smoke checks passed for eight dialogs, English/Sinhala/Tamil switching, preference persistence, cross-rate calculation, provider failure display, four role logins, inherited menus, administrative oversight and mobile widths.
- Desktop guest, mobile guest and manager screenshots were inspected. Browser validation used isolated API fixtures and did not modify bank records. Database integration suites were not rerun for this update.

To repeat backend checks from `backend/smartbank-api`:

```powershell
.\mvnw.cmd -q '-Dtest=SecurityHttpTests,ExchangeRateTests,BankingRulesTests,ModuleWorkflowTests' test
```

For optional browser checks, run from `frontend` with Chrome installed:

```powershell
npm install --no-save --package-lock=false playwright
npm run build
node smoke-ui.mjs
```

The smoke script serves `dist` temporarily on localhost port 4179, uses fixture API responses, closes Chrome and the server afterward, and writes screenshots into ignored `dist`. Playwright is an optional local testing dependency; application dependencies are unchanged.


## Local administrator and theme update

The local development `.env` enables `BANK_DEMO_ADMIN_ENABLED=true`. On startup, `DemoAdminInitializer` creates username `admin`, password `admin`, with the Admin role and a BCrypt password hash if that username does not exist. It does not reset passwords or change roles for existing users. The initializer is disabled by default in shared configuration and `.env.example`. Public registration password rules are unchanged.

The requested account was created in the configured local database and verified through `/auth/login` and `/auth/me` as role `ADMIN`. The temporary verification server on port 8089 was stopped afterward. Ten targeted initializer/security tests passed. Theme smoke coverage checks both modes and preference persistence in addition to existing UI checks.
