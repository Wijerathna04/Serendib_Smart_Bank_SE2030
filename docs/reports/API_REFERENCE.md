# Development API reference

Source-level contract for the implemented backend. These endpoints have not yet been runtime-tested. Base URL: http://localhost:8081. Customer/Employee/Manager/Admin refer to existing database roles; their Spring authorities are uppercase ROLE_*.

Requests and responses use JSON. Financial response values are decimal strings. List responses have content, page, size, totalElements, totalPages. page is zero-based; size is clamped to 1?100. An inaccessible owned resource returns 404. Authentication failures return 401; role failures return 403. Business conflicts return 409 with a safe code/message. Do not depend on internal exception text.

## Authentication

| Method | Path | Access / request |
| --- | --- | --- |
| POST | /auth/register | Public: username, email, password |
| POST | /auth/login | Public: username, password; returns token, username, role |
| GET | /auth/me | Authenticated; safe profile |
| POST | /auth/logout | Authenticated; revoke current token |
| POST | /auth/activity | Authenticated; deliberate interaction heartbeat |
| POST | /auth/change-password | Authenticated: currentPassword, newPassword; revokes all sessions |

Use Authorization: Bearer <token>. Tokens remain in frontend memory. There is no password-recovery endpoint in this required-scope release.

## Customer/user management

| Method | Path | Access / request |
| --- | --- | --- |
| GET, PATCH | /api/customers/me | Customer; update email, phone, address, nic, dateOfBirth |
| GET | /api/employee/customers | Employee/Manager; page, size |
| GET | /api/employee/customers/{id} | Employee/Manager |
| GET | /api/admin/users | Admin; search, status, page, size |
| GET | /api/admin/users/{id} | Admin |
| POST | /api/admin/users/staff | Admin: username,email,password,role,department,position |
| PATCH | /api/admin/users/{id}/status | Admin: status ACTIVE or DISABLED |
| PATCH | /api/admin/users/{id}/role | Admin: role Customer,Employee,Manager,Admin |

The last active administrator is protected. Profile requests cannot choose role or status.

## Accounts, deposits, notifications

| Method | Path | Access / request |
| --- | --- | --- |
| GET | /api/accounts | Customer; own, paginated |
| GET | /api/accounts/{id} | Customer; own |
| GET | /api/fixed-deposits/products | Customer; backend-authoritative simulated rates/terms |
| POST | /api/fixed-deposits | Customer: accountId,principalAmount,termMonths; Idempotency-Key |
| GET | /api/fixed-deposits | Customer; own, paginated |
| GET | /api/fixed-deposits/{id} | Customer; own |
| PUT | /api/fixed-deposits/{id}/cancel | Customer; pending only |
| PUT | /api/fixed-deposits/{id}/close | Customer; matured only; Idempotency-Key; initiates OTP closure |
| GET | /api/notifications | Authenticated; own; status READ/UNREAD, event, page, size |
| GET | /api/notifications/unread-count | Authenticated; returns count |
| GET | /api/notifications/{id} | Authenticated; own visible record |
| PUT | /api/notifications/{id}/read | Authenticated; own |
| PUT | /api/notifications/{id}/unread | Authenticated; own |
| DELETE | /api/notifications/{id} | Authenticated; hide only |

No account POST/PUT/PATCH/DELETE routes exist. AccountService contains no balance mutation. There is no arbitrary client notification-send endpoint.

FD creation returns openingTransactionId; closing returns closingTransactionId. Verify the referenced transaction using the shared OTP endpoint. ACTIVE deposits mature without moving funds; closure settles the maturity amount.

## Shared financial processing

| Method | Path | Access / request |
| --- | --- | --- |
| POST | /api/transfers | Customer: accountId,beneficiaryId,amount,description; Idempotency-Key |
| POST | /api/bill-payments | Customer: accountId,billType,referenceNumber,amount; Idempotency-Key |
| GET | /api/bill-payments | Customer; own, paginated |
| GET | /api/bill-payments/{id} | Customer; own |
| POST | /api/transactions/{id}/verify-otp | Initiating Customer: code |
| POST | /api/transactions/{id}/resend-otp | Initiating Customer |
| POST | /api/transactions/{id}/cancel | Initiating Customer; pending only |
| GET | /api/simulation/otp/{id} | Initiating Customer; pending; simulator enabled only |
| GET | /api/transactions | Customer; authorized accounts; search,type,status,from,to,page,size |
| GET | /api/transactions/{id} | Customer; authorized participating account |
| GET | /api/transactions/{id}/receipt | Customer; completed only |

Idempotency-Key accepts 8?80 letters/digits/hyphens/underscores. Reuse the same key and identical request after a network failure. A different body using the same key is a conflict. A retry after an in-flight duplicate conflict should refresh the current transaction first. Never create a fresh financial key merely because the outcome of the preceding request is unknown.

Supported bill types: ELECTRICITY, WATER, TELEPHONE, INTERNET. Transfers support existing internal SERENDIB accounts through an active owned beneficiary. Pending requests do not reserve balance. OTP defaults: 3-minute code TTL, 10-minute authorization deadline, 5 failed/verification attempts, 30-second resend cooldown. Resend does not reset the attempt budget. The initiating customer authorizes; the recipient cannot authorize someone else's payment.

## Beneficiaries

GET/POST /api/beneficiaries; GET/PATCH/DELETE /api/beneficiaries/{id}.

Customer-only, own records. Input: name,accountNumber,bankName=SERENDIB,relationship. Account number is 6?30 digits and must resolve to a simulated account. Duplicate active destinations are rejected. DELETE deactivates; history remains.

## Loans

| Method | Path | Access |
| --- | --- | --- |
| GET, POST | /api/loans | Customer; own; create loanType,amount,information |
| GET | /api/loans/{id} | Customer; own, including decision history |
| PUT | /api/loans/{id}/cancel | Customer; cancellable states |
| POST | /api/loans/{id}/information | Customer: reason; information requested only |
| GET | /api/employee/loans | Employee; status,page,size |
| GET | /api/employee/loans/{id} | Employee |
| POST | /api/employee/loans/{id}/review | Employee: reason; claims reviewer assignment |
| POST | /api/employee/loans/{id}/request-information | Assigned Employee: reason |
| POST | /api/employee/loans/{id}/recommend | Assigned Employee: reason |
| POST | /api/employee/loans/{id}/reject | Assigned Employee: reason |
| GET | /api/manager/loans | Manager; status,page,size |
| GET | /api/manager/loans/{id} | Manager |
| POST | /api/manager/loans/{id}/approve | Manager: reason; recommendation required |
| POST | /api/manager/loans/{id}/reject | Manager: reason; recommendation required |

Types: PERSONAL, EDUCATION, HOME. Minimum application amount LKR 1,000. Demo annual loan rate 8.00%; not a real offer. Final approval cannot be performed by the same user who reviewed the loan, even if their role changes. No disbursement or repayment feature is included.

## Cards

Customer: GET/POST /api/cards, GET /api/cards/{id}, PUT /api/cards/{id}/activate, /block, /unblock, /cancel.

Request body: accountId,cardType=DEBIT.

Employee/Admin: GET /api/employee/cards (status,page,size), GET /api/employee/cards/{id}, PUT /api/employee/cards/{id}/issue or /reject.

Issuance precedes customer activation. Numbers are synthetic and masked in every response. PIN/CVV are never stored. Expiry is enforced during actions and maintained by a scheduled lifecycle job. Cancellation is terminal.

## Feedback and public reviews

Customer: GET/POST /api/feedback, GET/PATCH /api/feedback/{id}. Input: feedbackType REVIEW/COMPLAINT/SERVICE, subject,message,rating. A REVIEW requires rating 1?5; private feedback stores no rating. Only SUBMITTED feedback is editable by its author.

Employee/Admin: GET /api/employee/feedback (status,page,size), GET /api/employee/feedback/{id}, PUT /api/employee/feedback/{id}/review, /approve, /reject, /resolve, /close. Moderation body: reason.

Public: GET /api/reviews and GET /api/reviews/summary. Summary: averageRating (null when empty), totalReviews.

Publication requires feedback_type=REVIEW AND status=APPROVED. No separate review persistence exists. REVIEW records cannot become RESOLVED/CLOSED; approved reviews remain public. COMPLAINT/SERVICE records never become public. Public projections omit customer identity and staff responses.

## Audit and basic FAQ

Admin: GET /api/admin/audit-logs with action,actor (user ID),from,to,page,size. No update/delete endpoint.

Customer: POST /api/assistant/messages with question; GET /api/assistant/messages with page,size. The rule-based FAQ helper reuses ai_assistant/ai_chat and exposes only own chat history. It has no financial/administrative mutation capabilities.
