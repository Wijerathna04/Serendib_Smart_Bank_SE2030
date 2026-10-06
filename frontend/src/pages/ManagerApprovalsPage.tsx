import { useState } from 'react';
import { send, money, date } from '../api/client';
import { useApi, Heading, Panel, Field, ErrorMessage, Loading, Pagination, StatusBadge, Empty } from '../components/ui';
import type { Account, Deposit, Loan, Page } from '../types/api';

export function ManagerApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'CURRENT_ACCOUNTS' | 'FIXED_DEPOSITS' | 'LOANS'>('CURRENT_ACCOUNTS');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingItem, setRejectingItem] = useState<{ id: number; type: 'ACCOUNT' | 'DEPOSIT' | 'LOAN' } | null>(null);

  const pendingAccounts = useApi<Page<Account>>(`/api/manager/accounts/pending`, revision);
  const pendingDeposits = useApi<Page<Deposit>>(`/api/manager/fixed-deposits/pending`, revision);
  const pendingLoans = useApi<Page<Loan>>(`/api/manager/loans?status=PENDING_MANAGER_REVIEW`, revision);

  const [approvingAccount, setApprovingAccount] = useState<Account | null>(null);
  const [approvalDeposit, setApprovalDeposit] = useState('1000');

  // Approve Actions
  async function confirmApproveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!approvingAccount) return;
    setBusy(true);
    setError(null);
    try {
      const depVal = approvalDeposit !== '' && !isNaN(Number(approvalDeposit)) ? Number(approvalDeposit) : 0;
      await send(`/api/manager/accounts/${approvingAccount.accountId}/approve`, {
        initialDeposit: depVal
      }, 'POST');
      setApprovingAccount(null);
      setApprovalDeposit('1000');
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }


  async function approveDeposit(id: number) {
    if (!confirm(`Approve Fixed Deposit #${id} exceeding LKR 1 Million?`)) return;
    setBusy(true);
    setError(null);
    try {
      await send(`/api/manager/fixed-deposits/${id}/approve`, undefined, 'POST');
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function approveLoan(id: number) {
    if (!confirm(`Grant final Manager Approval for Loan #${id}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await send(`/api/manager/loans/${id}/approve`, { reason: 'Final manager decision: APPROVED' }, 'POST');
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  // Reject Action
  async function confirmReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingItem) return;
    setBusy(true);
    setError(null);
    try {
      if (rejectingItem.type === 'ACCOUNT') {
        await send(`/api/manager/accounts/${rejectingItem.id}/reject`, { reason: rejectionReason }, 'POST');
      } else if (rejectingItem.type === 'DEPOSIT') {
        await send(`/api/manager/fixed-deposits/${rejectingItem.id}/reject`, { reason: rejectionReason }, 'POST');
      } else if (rejectingItem.type === 'LOAN') {
        await send(`/api/manager/loans/${rejectingItem.id}/reject`, { reason: rejectionReason }, 'POST');
      }
      setRejectingItem(null);
      setRejectionReason('');
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading
        title="Branch Manager Approval Center"
        subtitle="Final governance decisions for Current Accounts, Fixed Deposits > LKR 1M, and Loan Facilities."
      />

      <ErrorMessage error={error || pendingAccounts.error || pendingDeposits.error || pendingLoans.error} />

      {/* TABS */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`button ${activeTab === 'CURRENT_ACCOUNTS' ? '' : 'secondary'}`}
          onClick={() => setActiveTab('CURRENT_ACCOUNTS')}
        >
          Corporate & Current Accounts ({pendingAccounts.data?.totalElements ?? 0})
        </button>
        <button
          className={`button ${activeTab === 'FIXED_DEPOSITS' ? '' : 'secondary'}`}
          onClick={() => setActiveTab('FIXED_DEPOSITS')}
        >
          Fixed Deposits &gt; LKR 1M ({pendingDeposits.data?.totalElements ?? 0})
        </button>
        <button
          className={`button ${activeTab === 'LOANS' ? '' : 'secondary'}`}
          onClick={() => setActiveTab('LOANS')}
        >
          Loan Final Decisions ({pendingLoans.data?.totalElements ?? 0})
        </button>
      </div>

      {/* CURRENT ACCOUNTS QUEUE */}
      {activeTab === 'CURRENT_ACCOUNTS' && (
        <Panel title="Pending Current & Corporate Accounts Queue">
          {pendingAccounts.loading ? (
            <Loading />
          ) : (
            pendingAccounts.data && (
              <>
                {pendingAccounts.data.content.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Account Type</th>
                          <th>Applicant</th>
                          <th>NIC</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingAccounts.data.content.map(a => (
                          <tr key={a.accountId}>
                            <td><strong>{a.accountType}</strong></td>
                            <td>{a.customerName || 'Customer'}</td>
                            <td>{a.customerNic || 'N/A'}</td>
                            <td><StatusBadge status={a.status} /></td>
                            <td>
                              <div className="actions">
                                <button disabled={busy} onClick={() => { setApprovingAccount(a); setApprovalDeposit('1000'); }}>Approve</button>
                                <button className="secondary danger" disabled={busy} onClick={() => setRejectingItem({ id: a.accountId, type: 'ACCOUNT' })}>
                                  Reject
                                </button>

                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty>No current accounts awaiting Branch Manager authorization.</Empty>
                )}
              </>
            )
          )}
        </Panel>
      )}

      {/* FIXED DEPOSITS QUEUE */}
      {activeTab === 'FIXED_DEPOSITS' && (
        <Panel title="Fixed Deposits Exceeding LKR 1,000,000 Queue">
          {pendingDeposits.loading ? (
            <Loading />
          ) : (
            pendingDeposits.data && (
              <>
                {pendingDeposits.data.content.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Deposit ID</th>
                          <th>Principal Amount</th>
                          <th>Term / Rate</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingDeposits.data.content.map(f => (
                          <tr key={f.fixedDepositId}>
                            <td>FD #{f.fixedDepositId}</td>
                            <td><strong style={{ color: '#10b981' }}>{money(f.principalAmount)}</strong></td>
                            <td>{f.termMonths} Months @ {f.interestRate}%</td>
                            <td><StatusBadge status={f.status} /></td>
                            <td>
                              <div className="actions">
                                <button disabled={busy} onClick={() => approveDeposit(f.fixedDepositId)}>Approve FD</button>
                                <button className="secondary danger" disabled={busy} onClick={() => setRejectingItem({ id: f.fixedDepositId, type: 'DEPOSIT' })}>
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty>No fixed deposits exceeding LKR 1M awaiting Manager approval.</Empty>
                )}
              </>
            )
          )}
        </Panel>
      )}

      {/* LOANS QUEUE */}
      {activeTab === 'LOANS' && (
        <Panel title="Recommended Loans Awaiting Manager Decision">
          {pendingLoans.loading ? (
            <Loading />
          ) : (
            pendingLoans.data && (
              <>
                {pendingLoans.data.content.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Loan ID</th>
                          <th>Type</th>
                          <th>Applicant</th>
                          <th>Amount</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingLoans.data.content.map(l => (
                          <tr key={l.loanId}>
                            <td>#{l.loanId}</td>
                            <td>{l.loanType}</td>
                            <td>{l.customer}</td>
                            <td><strong>{money(l.amount)}</strong></td>
                            <td>
                              <div className="actions">
                                <button disabled={busy} onClick={() => approveLoan(l.loanId)}>Approve Loan</button>
                                <button className="secondary danger" disabled={busy} onClick={() => setRejectingItem({ id: l.loanId, type: 'LOAN' })}>
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty>No staff-recommended loans awaiting final decision.</Empty>
                )}
              </>
            )
          )}
        </Panel>
      )}

      {/* REJECTION REASON DIALOG */}
      {rejectingItem && (
        <Panel title={`Record Rejection for ${rejectingItem.type} #${rejectingItem.id}`}>
          <form onSubmit={confirmReject}>
            <Field label="Manager Rejection Reason">
              <textarea required value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Provide compliance or financial audit reason for rejection..." />
            </Field>
            <div className="actions">
              <button className="button danger" disabled={busy}>Confirm Rejection</button>
              <button type="button" className="button secondary" onClick={() => setRejectingItem(null)}>Cancel</button>
            </div>
          </form>
        </Panel>
      )}

      {/* INITIAL DEPOSIT APPROVAL MODAL */}
      {approvingAccount && (
        <div className="modal-backdrop" onClick={() => setApprovingAccount(null)}>
          <div className="glass-card-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <button className="close" onClick={() => setApprovingAccount(null)} aria-label="Close">×</button>
            <div className="glass-modal-header">
              <div className="glass-modal-icon debit">💰</div>
              <div>
                <h2>Approve &amp; Fund Account</h2>
                <p>{approvingAccount.accountType} · Customer: {approvingAccount.customerName || 'N/A'}</p>
              </div>
            </div>
            <form onSubmit={confirmApproveAccount} className="glass-modal-form">
              <Field label="Initial Deposit Amount (LKR)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={approvalDeposit}
                  onChange={e => setApprovalDeposit(e.target.value)}
                  placeholder="Enter initial deposit amount (e.g. 0, 500, 10000)"
                />
              </Field>
              <p className="fine-print" style={{ marginTop: 4 }}>
                Enter any custom initial deposit amount (e.g. 0.00, 500.00, 1000.00, 50000.00) to credit the customer's account upon approval.
              </p>
              <div className="actions" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" className="secondary" onClick={() => setApprovingAccount(null)}>Cancel</button>
                <button type="submit" disabled={busy}>
                  {busy ? 'Approving...' : 'Confirm Manager Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

