import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { send, money, date, downloadPdf } from '../api/client';
import { useApi, Heading, Panel, Field, ErrorMessage, Loading, Pagination, StatusBadge, Empty } from '../components/ui';
import type { Account, Deposit, Loan, Card, Transaction, Page } from '../types/api';
import { ApplicationDetails } from '../components/ApplicationDetails';

type FacilityTab = 'accounts' | 'deposits' | 'loans' | 'cards';

export function ManagerAllAccountsPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<FacilityTab>('accounts');
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [revision, setRevision] = useState(0);

  // Selected items for detail/transaction modals
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [stmtFrom, setStmtFrom] = useState('');
  const [stmtTo, setStmtTo] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const [txPage, setTxPage] = useState(0);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState('');

  const isManagerOrAdmin = role === 'MANAGER' || role === 'ADMIN';

  // API Hooks per facility type
  const accountsApi = useApi<Page<Account>>(
    activeTab === 'accounts'
      ? `/api/employee/accounts/all?query=${encodeURIComponent(searchQuery)}&page=${page}`
      : '',
    revision
  );

  const depositsApi = useApi<Page<Deposit>>(
    activeTab === 'deposits'
      ? `/api/employee/fixed-deposits/all?query=${encodeURIComponent(searchQuery)}&page=${page}`
      : '',
    revision
  );

  const loansApi = useApi<Page<Loan>>(
    activeTab === 'loans'
      ? `/api/employee/loans/all?query=${encodeURIComponent(searchQuery)}&page=${page}`
      : '',
    revision
  );

  const cardsApi = useApi<Page<Card>>(
    activeTab === 'cards'
      ? `/api/employee/cards/all?query=${encodeURIComponent(searchQuery)}&page=${page}`
      : '',
    revision
  );

  // Transactions for selected account or card linked account
  const cardAccountId = selectedCard?.accountId;
  const targetAccountId = selectedAccountId || cardAccountId;

  const txApi = useApi<Page<Transaction>>(
    targetAccountId ? `/api/employee/accounts/${targetAccountId}/transactions?page=${txPage}` : '',
    targetAccountId ? txPage : 0
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setSearchQuery(queryInput.trim());
  }

  async function handleToggleHold(account: Account) {
    const isHeld = account.status === 'HELD' || account.status === 'HOLD';
    const actionText = isHeld ? 'Un-hold / Activate' : 'HOLD funds in';
    if (!confirm(`Are you sure you want to ${actionText} account ${account.accountNumber}?`)) return;

    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/accounts/${account.accountId}/hold`, {}, 'POST');
      setNotice(`Account ${account.accountNumber} has been ${isHeld ? 'un-held (activated)' : 'placed on HOLD'}.`);
      setRevision(r => r + 1);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAccount(account: Account) {
    if (!confirm(`CRITICAL: Are you sure you want to DELETE account ${account.accountNumber} entirely? This action is permanent!`)) return;

    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/accounts/${account.accountId}`, {}, 'DELETE');
      setNotice(`Account ${account.accountNumber} has been deleted.`);
      setRevision(r => r + 1);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDeposit(deposit: Deposit) {
    if (!confirm(`Are you sure you want to DELETE Fixed Deposit #${deposit.fixedDepositId}?`)) return;

    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/fixed-deposits/${deposit.fixedDepositId}`, {}, 'DELETE');
      setNotice(`Fixed Deposit #${deposit.fixedDepositId} deleted.`);
      setRevision(r => r + 1);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteLoan(loan: Loan) {
    if (!confirm(`Are you sure you want to DELETE Loan #${loan.loanNumber || loan.loanId}?`)) return;

    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/loans/${loan.loanId}`, {}, 'DELETE');
      setNotice(`Loan #${loan.loanNumber || loan.loanId} deleted.`);
      setRevision(r => r + 1);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCard(card: Card) {
    if (!confirm(`Are you sure you want to DELETE Card ${card.cardNumber}?`)) return;

    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/cards/${card.cardId}`, {}, 'DELETE');
      setNotice(`Card ${card.cardNumber} deleted.`);
      setRevision(r => r + 1);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading
        title="All Bank Accounts, Loans, Cards &amp; Transactions"
        subtitle="Search, audit, inspect details and transaction history, hold funds, or manage facilities across Serendib Smart Bank."
        icon="/images/page-icons/accounts.png"
      />

      <ErrorMessage error={error} />
      {notice && <div className="alert success">{notice}</div>}

      {/* SEARCH PANEL */}
      <Panel title="Search All Banking Facilities" className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Field label="Search by Account Number, Card Number, Loan Number, NIC Number, CIF Number, or Name">
              <input
                type="text"
                placeholder="e.g. 1000001, SIM-1092, LN-HOME-001, 199284710294, CIF 0000005, or John..."
                value={queryInput}
                onChange={e => setQueryInput(e.target.value)}
              />
            </Field>
          </div>
          <button type="submit">
            🔍 Search Facilities
          </button>
          {searchQuery && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setQueryInput('');
                setSearchQuery('');
                setPage(0);
              }}
            >
              Clear Filter
            </button>
          )}
        </form>
      </Panel>

      {/* FACILITY CATEGORY NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={activeTab === 'accounts' ? '' : 'secondary'}
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}
          onClick={() => { setActiveTab('accounts'); setPage(0); }}
        >
          🏦 Savings &amp; Current Accounts
        </button>
        <button
          type="button"
          className={activeTab === 'deposits' ? '' : 'secondary'}
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}
          onClick={() => { setActiveTab('deposits'); setPage(0); }}
        >
          🔒 Fixed Deposits (FD)
        </button>
        <button
          type="button"
          className={activeTab === 'loans' ? '' : 'secondary'}
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}
          onClick={() => { setActiveTab('loans'); setPage(0); }}
        >
          📈 Loans &amp; Leasing Facilities
        </button>
        <button
          type="button"
          className={activeTab === 'cards' ? '' : 'secondary'}
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}
          onClick={() => { setActiveTab('cards'); setPage(0); }}
        >
          💳 Credit &amp; Debit Cards
        </button>
      </div>

      {/* TAB 1: SAVINGS & CURRENT ACCOUNTS */}
      {activeTab === 'accounts' && (
        <Panel title="Deposit Accounts Registry" className="glass-card">
          <ErrorMessage error={accountsApi.error} />
          {accountsApi.loading ? (
            <Loading />
          ) : accountsApi.data?.content.length ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Account Number</th>
                      <th>Customer Name &amp; NIC</th>
                      <th>CIF Number</th>
                      <th>Account Type</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Management Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountsApi.data.content.map(a => {
                      const isHeld = a.status === 'HELD' || a.status === 'HOLD';
                      const isDeleted = a.status === 'DELETED';
                      return (
                        <tr key={a.accountId}>
                          <td>
                            <strong className="mono" style={{ color: 'var(--color-gold-primary)' }}>{a.accountNumber}</strong>
                            {a.isPrimary && <span className="status active" style={{ marginLeft: '6px', fontSize: '10px' }}>Primary</span>}
                          </td>
                          <td>
                            <div><strong>{a.customerName || 'Customer'}</strong></div>
                            <small className="mono">{a.customerNic || 'NIC Unregistered'}</small>
                          </td>
                          <td className="mono" style={{ fontSize: '0.85rem' }}>
                            {a.cifNumber || '0000000'}
                          </td>
                          <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            {a.accountType}
                          </td>
                          <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                            {money(a.balance)}
                          </td>
                          <td>
                            <StatusBadge status={a.status} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="secondary"
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                onClick={() => {
                                  setSelectedAccountId(a.accountId);
                                  setTxPage(0);
                                }}
                              >
                                📊 Transactions
                              </button>

                              {isManagerOrAdmin && !isDeleted && (
                                <>
                                  <button
                                    type="button"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '0.8rem',
                                      background: isHeld ? 'var(--status-success)' : 'var(--status-warning)',
                                      color: '#000'
                                    }}
                                    disabled={busy}
                                    onClick={() => handleToggleHold(a)}
                                  >
                                    {isHeld ? 'UN-HOLD' : 'HOLD'}
                                  </button>
                                  <button
                                    type="button"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '0.8rem',
                                      background: 'var(--status-error)',
                                      color: '#fff'
                                    }}
                                    disabled={busy}
                                    onClick={() => handleDeleteAccount(a)}
                                  >
                                    DELETE
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                data={accountsApi.data}
                onPage={setPage}
              />
            </>
          ) : (
            <Empty>No bank deposit accounts found matching search criteria.</Empty>
          )}
        </Panel>
      )}

      {/* TAB 2: FIXED DEPOSITS */}
      {activeTab === 'deposits' && (
        <Panel title="Fixed Deposit Placements Registry" className="glass-card">
          <ErrorMessage error={depositsApi.error} />
          {depositsApi.loading ? (
            <Loading />
          ) : depositsApi.data?.content.length ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>FD ID &amp; Account</th>
                      <th>Term &amp; Interest Rate</th>
                      <th>Principal Amount</th>
                      <th>Maturity Amount</th>
                      <th>Start &amp; Maturity Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Management Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depositsApi.data.content.map(d => (
                      <tr key={d.fixedDepositId}>
                        <td>
                          <strong className="mono" style={{ color: 'var(--color-gold-primary)' }}>FD #{d.fixedDepositId}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Linked Acc: {d.accountNumber}</div>
                        </td>
                        <td>
                          <div><strong>{d.termMonths} Months</strong></div>
                          <small style={{ color: 'var(--color-gold-primary)', fontWeight: 600 }}>{d.interestRate}% p.a.</small>
                        </td>
                        <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                          {money(d.principalAmount)}
                        </td>
                        <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--status-success)' }}>
                          {d.maturityAmount ? money(d.maturityAmount) : 'N/A'}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <div>Start: {date(d.startDate || d.createdAt)}</div>
                          <div>Matures: {date(d.maturityDate || d.createdAt)}</div>
                        </td>
                        <td>
                          <StatusBadge status={d.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="secondary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              onClick={() => setSelectedDeposit(d)}
                            >
                              ℹ️ Details
                            </button>
                            {isManagerOrAdmin && (
                              <button
                                type="button"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.8rem',
                                  background: 'var(--status-error)',
                                  color: '#fff'
                                }}
                                disabled={busy}
                                onClick={() => handleDeleteDeposit(d)}
                              >
                                DELETE
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                data={depositsApi.data}
                onPage={setPage}
              />
            </>
          ) : (
            <Empty>No fixed deposit placements found matching search criteria.</Empty>
          )}
        </Panel>
      )}

      {/* TAB 3: LOANS & LEASING */}
      {activeTab === 'loans' && (
        <Panel title="Loans &amp; Credit Facilities Registry" className="glass-card">
          <ErrorMessage error={loansApi.error} />
          {loansApi.loading ? (
            <Loading />
          ) : loansApi.data?.content.length ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Loan Number &amp; Customer</th>
                      <th>Loan Type</th>
                      <th>Sanctioned Amount</th>
                      <th>Interest Rate</th>
                      <th>Repaid / Balance</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Management Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loansApi.data.content.map(l => (
                      <tr key={l.loanId}>
                        <td>
                          <strong className="mono" style={{ color: 'var(--color-gold-primary)' }}>{l.loanNumber || `LN-${l.loanId}`}</strong>
                          <div><strong>{l.customer}</strong></div>
                          {l.customerNic && <small className="mono">{l.customerNic}</small>}
                        </td>
                        <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {l.loanType}
                        </td>
                        <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                          {money(l.amount)}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--color-gold-primary)' }}>
                          {l.interestRate}% p.a.
                        </td>
                        <td style={{ fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>
                          <div>Paid: {money(l.paidAmount || '0.00')}</div>
                          <div style={{ color: 'var(--status-warning)' }}>Rem: {money(l.remainingAmount || l.amount)}</div>
                        </td>
                        <td>
                          <StatusBadge status={l.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="secondary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              onClick={() => setSelectedLoan(l)}
                            >
                              📑 Details &amp; Audit
                            </button>
                            {isManagerOrAdmin && (
                              <button
                                type="button"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.8rem',
                                  background: 'var(--status-error)',
                                  color: '#fff'
                                }}
                                disabled={busy}
                                onClick={() => handleDeleteLoan(l)}
                              >
                                DELETE
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                data={loansApi.data}
                onPage={setPage}
              />
            </>
          ) : (
            <Empty>No loan or leasing facilities found matching search criteria.</Empty>
          )}
        </Panel>
      )}

      {/* TAB 4: CREDIT & DEBIT CARDS */}
      {activeTab === 'cards' && (
        <Panel title="Credit &amp; Debit Cards Registry" className="glass-card">
          <ErrorMessage error={cardsApi.error} />
          {cardsApi.loading ? (
            <Loading />
          ) : cardsApi.data?.content.length ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Card Number</th>
                      <th>Holder / Applicant</th>
                      <th>Type &amp; Product</th>
                      <th>Limit / Available</th>
                      <th>Current Balance</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Management Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cardsApi.data.content.map(c => (
                      <tr key={c.cardId}>
                        <td>
                          <strong className="mono" style={{ color: 'var(--color-gold-primary)' }}>{c.cardNumber}</strong>
                          {c.expiryDate && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Exp: {c.expiryDate}</div>}
                        </td>
                        <td>
                          <div><strong>{c.applicantName || 'Card Holder'}</strong></div>
                          {c.applicantNic && <small className="mono">{c.applicantNic}</small>}
                        </td>
                        <td>
                          <span className={`badge ${c.cardType === 'CREDIT' ? 'warning' : 'info'}`} style={{ marginRight: '6px' }}>
                            {c.cardType}
                          </span>
                          <small style={{ fontWeight: 500 }}>{c.cardProduct || 'Serendib Card'}</small>
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}>
                          {c.cardType === 'CREDIT' ? (
                            <>
                              <div>Limit: {money(c.creditLimit || '0.00')}</div>
                              <div style={{ color: 'var(--status-success)' }}>Avail: {money(c.availableCredit || c.creditLimit || '0.00')}</div>
                            </>
                          ) : (
                            <div>Linked Account ID #{c.accountId || 'N/A'}</div>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                          {c.cardType === 'CREDIT' ? money(c.currentBalance || '0.00') : 'N/A (Debit)'}
                        </td>
                        <td>
                          <StatusBadge status={c.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="secondary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              onClick={() => {
                                setSelectedCard(c);
                                setTxPage(0);
                              }}
                            >
                              📊 Details &amp; Tx
                            </button>
                            {isManagerOrAdmin && (
                              <button
                                type="button"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.8rem',
                                  background: 'var(--status-error)',
                                  color: '#fff'
                                }}
                                disabled={busy}
                                onClick={() => handleDeleteCard(c)}
                              >
                                DELETE
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                data={cardsApi.data}
                onPage={setPage}
              />
            </>
          ) : (
            <Empty>No credit or debit cards found matching search criteria.</Empty>
          )}
        </Panel>
      )}

      {/* DEPOSIT ACCOUNT TRANSACTIONS MODAL */}
      {selectedAccountId && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div
            className="glass-card modal-content"
            style={{
              maxWidth: '840px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: '24px',
              border: '1.5px solid var(--color-gold-primary)',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.98) 100%)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="eyebrow" style={{ color: 'var(--color-gold-primary)' }}>TRANSACTION HISTORY AUDIT</span>
                <h3 style={{ margin: '0.25rem 0 0 0', fontFamily: 'Playfair Display' }}>
                  Account Transactions Audit
                </h3>
              </div>
              <button
                className="secondary close"
                onClick={() => setSelectedAccountId(null)}
                style={{ padding: '4px 10px', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <Field label="From Date">
                <input type="date" value={stmtFrom} onChange={e => setStmtFrom(e.target.value)} />
              </Field>
              <Field label="To Date">
                <input type="date" value={stmtTo} onChange={e => setStmtTo(e.target.value)} />
              </Field>
              <button
                type="button"
                className="button secondary"
                style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => downloadPdf(`/api/accounts/${selectedAccountId}/statement.pdf?from=${stmtFrom}&to=${stmtTo}`, `statement-acc-${selectedAccountId}.pdf`)}
              >
                📄 Download PDF Statement
              </button>
            </div>

            <ErrorMessage error={txApi.error} />
            {txApi.loading ? (
              <Loading />
            ) : txApi.data?.content.length ? (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Tx ID</th>
                        <th>Description &amp; Type</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txApi.data.content.map(t => (
                        <tr key={t.transactionId}>
                          <td className="mono">#{t.transactionId}</td>
                          <td>
                            <strong>{t.description}</strong>
                            <small className="mono">{t.transactionType}</small>
                          </td>
                          <td>{date(t.createdAt)}</td>
                          <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{money(t.amount)}</td>
                          <td><StatusBadge status={t.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  data={txApi.data}
                  onPage={setTxPage}
                />
              </>
            ) : (
              <Empty>No transactions recorded for this bank account yet.</Empty>
            )}
          </div>
        </div>
      )}

      {/* FIXED DEPOSIT DETAILS MODAL */}
      {selectedDeposit && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div
            className="glass-card modal-content"
            style={{
              maxWidth: '680px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: '24px',
              border: '1.5px solid var(--color-gold-primary)',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.98) 100%)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="eyebrow" style={{ color: 'var(--color-gold-primary)' }}>FIXED DEPOSIT AUDIT</span>
                <h3 style={{ margin: '0.25rem 0 0 0', fontFamily: 'Playfair Display' }}>
                  Fixed Deposit Placement #{selectedDeposit.fixedDepositId}
                </h3>
              </div>
              <button
                className="secondary close"
                onClick={() => setSelectedDeposit(null)}
                style={{ padding: '4px 10px', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Linked Account Number</small>
                <div style={{ fontWeight: 700 }} className="mono">{selectedDeposit.accountNumber}</div>
              </div>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Tenure &amp; Annual Rate</small>
                <div style={{ fontWeight: 700 }}>{selectedDeposit.termMonths} Months ({selectedDeposit.interestRate}% p.a.)</div>
              </div>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Principal Amount</small>
                <div style={{ fontWeight: 700, color: 'var(--color-gold-primary)' }}>{money(selectedDeposit.principalAmount)}</div>
              </div>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Expected Maturity Amount</small>
                <div style={{ fontWeight: 700, color: 'var(--status-success)' }}>{selectedDeposit.maturityAmount ? money(selectedDeposit.maturityAmount) : 'N/A'}</div>
              </div>
            </div>

            {selectedDeposit.fdDetails && (
              <ApplicationDetails data={selectedDeposit.fdDetails} kind="fd" title="FD Instructions & Declarations" />
            )}

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Created: {date(selectedDeposit.createdAt)} | Current Status: <strong>{selectedDeposit.status}</strong>
            </div>
          </div>
        </div>
      )}

      {/* LOAN AUDIT & DETAILS MODAL */}
      {selectedLoan && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div
            className="glass-card modal-content"
            style={{
              maxWidth: '840px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: '24px',
              border: '1.5px solid var(--color-gold-primary)',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.98) 100%)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="eyebrow" style={{ color: 'var(--color-gold-primary)' }}>CREDIT FACILITY AUDIT</span>
                <h3 style={{ margin: '0.25rem 0 0 0', fontFamily: 'Playfair Display' }}>
                  Loan #{selectedLoan.loanNumber || selectedLoan.loanId} Details &amp; Audit
                </h3>
              </div>
              <button
                className="secondary close"
                onClick={() => setSelectedLoan(null)}
                style={{ padding: '4px 10px', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Borrower &amp; NIC</small>
                <div style={{ fontWeight: 700 }}>{selectedLoan.customer}</div>
                <small className="mono">{selectedLoan.customerNic || 'NIC N/A'}</small>
              </div>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Loan Type &amp; Rate</small>
                <div style={{ fontWeight: 700 }}>{selectedLoan.loanType}</div>
                <small style={{ color: 'var(--color-gold-primary)' }}>{selectedLoan.interestRate}% p.a.</small>
              </div>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Sanctioned Loan Amount</small>
                <div style={{ fontWeight: 700, color: 'var(--color-gold-primary)' }}>{money(selectedLoan.amount)}</div>
              </div>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Paid / Remaining Balance</small>
                <div style={{ fontWeight: 700 }}>Paid: {money(selectedLoan.paidAmount || '0.00')}</div>
                <small style={{ color: 'var(--status-warning)' }}>Rem: {money(selectedLoan.remainingAmount || selectedLoan.amount)}</small>
              </div>
            </div>

            {selectedLoan.scrutinyData && (
              <ApplicationDetails data={selectedLoan.scrutinyData} kind="loan" loanType={selectedLoan.loanType} title="Income & Collateral Scrutiny Profile" />
            )}

            {selectedLoan.decisions?.length > 0 && (
              <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-gold-primary)' }}>Approval &amp; Scrutiny Decision Log</h4>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Role / Actor</th>
                        <th>Notes / Rationale</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLoan.decisions.map((d, idx) => (
                        <tr key={idx}>
                          <td><strong>{d.action}</strong></td>
                          <td>{d.actor}</td>
                          <td>{d.reason}</td>
                          <td>{date(d.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CARD DETAILS & TRANSACTIONS MODAL */}
      {selectedCard && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div
            className="glass-card modal-content"
            style={{
              maxWidth: '840px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: '24px',
              border: '1.5px solid var(--color-gold-primary)',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.98) 100%)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="eyebrow" style={{ color: 'var(--color-gold-primary)' }}>CARD FACILITY AUDIT</span>
                <h3 style={{ margin: '0.25rem 0 0 0', fontFamily: 'Playfair Display' }}>
                  Card {selectedCard.cardNumber} Details &amp; Activity
                </h3>
              </div>
              <button
                className="secondary close"
                onClick={() => setSelectedCard(null)}
                style={{ padding: '4px 10px', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Holder / Applicant</small>
                <div style={{ fontWeight: 700 }}>{selectedCard.applicantName || 'Card Holder'}</div>
                <small className="mono">{selectedCard.applicantNic || 'NIC N/A'}</small>
              </div>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Card Product &amp; Type</small>
                <div style={{ fontWeight: 700 }}>{selectedCard.cardProduct || 'Serendib Card'}</div>
                <small style={{ color: 'var(--color-gold-primary)' }}>{selectedCard.cardType}</small>
              </div>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Credit Limit / Available</small>
                <div style={{ fontWeight: 700, color: 'var(--color-gold-primary)' }}>
                  {selectedCard.cardType === 'CREDIT' ? money(selectedCard.creditLimit || '0.00') : 'Linked Account Card'}
                </div>
                {selectedCard.cardType === 'CREDIT' && (
                  <small style={{ color: 'var(--status-success)' }}>Avail: {money(selectedCard.availableCredit || selectedCard.creditLimit || '0.00')}</small>
                )}
              </div>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Current Status</small>
                <div><StatusBadge status={selectedCard.status} /></div>
              </div>
            </div>

            {selectedCard.employmentType && (
              <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-gold-primary)' }}>Applicant Credit Profile</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <div><strong>Employer:</strong> {selectedCard.employerName || 'N/A'}</div>
                  <div><strong>Designation:</strong> {selectedCard.designation || 'N/A'}</div>
                  <div><strong>Monthly Income:</strong> {selectedCard.grossMonthlyIncome ? money(selectedCard.grossMonthlyIncome) : 'N/A'}</div>
                  <div><strong>CRIB Consent:</strong> {selectedCard.cribConsent ? 'Granted' : 'Not Provided'}</div>
                </div>
              </div>
            )}

            {/* If linked account exists, show account transactions */}
            {selectedCard.accountId ? (
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-gold-primary)' }}>Linked Bank Account (ID #{selectedCard.accountId}) Transactions</h4>
                <ErrorMessage error={txApi.error} />
                {txApi.loading ? (
                  <Loading />
                ) : txApi.data?.content.length ? (
                  <>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Tx ID</th>
                            <th>Description</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {txApi.data.content.map(t => (
                            <tr key={t.transactionId}>
                              <td className="mono">#{t.transactionId}</td>
                              <td>{t.description}</td>
                              <td>{date(t.createdAt)}</td>
                              <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{money(t.amount)}</td>
                              <td><StatusBadge status={t.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination data={txApi.data} onPage={setTxPage} />
                  </>
                ) : (
                  <Empty>No transaction activity recorded for this linked account.</Empty>
                )}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-gold-primary)' }}>Card Activity Record</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  This is a standalone Credit Card. Current balance: <strong>{money(selectedCard.currentBalance || '0.00')}</strong>. Requested on {date(selectedCard.requestedAt)}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
