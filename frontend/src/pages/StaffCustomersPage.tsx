import { useState } from 'react';
import { send } from '../api/client';
import { useApi, Heading, Panel, Field, ErrorMessage, Loading, Pagination, StatusBadge, Empty } from '../components/ui';
import type { Page, ProfileView } from '../types/api';
import { useAuth } from '../auth/AuthProvider';
import { autoScrollTo } from '../utils/scrollHelper';

export function StaffCustomersPage() {
  const { role } = useAuth();
  const isManager = role === 'MANAGER' || role === 'ADMIN';

  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<ProfileView | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Fetch paginated customer list with active search filter
  const customers = useApi<Page<ProfileView>>(
    `/api/employee/customers?page=${page}&search=${encodeURIComponent(search.trim())}`,
    revision
  );

  // Toggle Customer Active/Disabled status (direct employee action)
  async function handleToggleStatus(customer: ProfileView) {
    const isCurrentlyActive = customer.status === 'ACTIVE';
    const actionName = isCurrentlyActive ? 'Disable' : 'Activate';

    if (!confirm(`Are you sure you want to ${actionName.toLowerCase()} customer access for ${customer.username}?`)) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/customers/${customer.userId}/toggle-status?enabled=${!isCurrentlyActive}`, undefined, 'POST');
      setRevision(r => r + 1);
      if (selectedCustomer?.userId === customer.userId) {
        setSelectedCustomer(null);
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  // Request Customer Deletion (Employee action -> requires Branch Manager approval)
  async function handleRequestDeletion(customer: ProfileView) {
    if (!confirm(`Initiate deletion request for customer profile ${customer.username}? This will require Branch Manager final approval.`)) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/customers/${customer.userId}/request-deletion`, undefined, 'POST');
      setRevision(r => r + 1);
      if (selectedCustomer?.userId === customer.userId) {
        setSelectedCustomer(null);
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  // Approve Customer Deletion (Branch Manager / Admin action)
  async function handleApproveDeletion(customer: ProfileView) {
    if (!confirm(`BRANCH MANAGER APPROVAL: Permanently delete customer record for ${customer.username}? This action cannot be undone.`)) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/customers/${customer.userId}/approve-deletion`, undefined, 'POST');
      setRevision(r => r + 1);
      if (selectedCustomer?.userId === customer.userId) {
        setSelectedCustomer(null);
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  // Reject Customer Deletion Request (Branch Manager / Admin action)
  async function handleRejectDeletion(customer: ProfileView) {
    if (!confirm(`Reject customer deletion request for ${customer.username}? Customer profile will be restored to Active.`)) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/customers/${customer.userId}/reject-deletion`, undefined, 'POST');
      setRevision(r => r + 1);
      if (selectedCustomer?.userId === customer.userId) {
        setSelectedCustomer(null);
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading
        title="Customer Profile & Document Management"
        subtitle="Search customer records, manage account active statuses, and process customer deletion requests."
      />

      <ErrorMessage error={error || customers.error} />

      {/* SEARCH PANEL ABOVE CUSTOMERS */}
      <Panel>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <Field label="Search Customers (by NIC, Username, CIF Number, or Full Name)">
              <input
                type="text"
                placeholder="e.g. 199012345678, john.doe, 0000001, or full name..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </Field>
          </div>
          {search && (
            <button
              className="button secondary"
              onClick={() => {
                setSearch('');
                setPage(0);
                autoScrollTo('.table-wrap');
              }}
              style={{ marginBottom: '0.25rem' }}
            >
              Clear Search
            </button>
          )}
        </div>
      </Panel>

      {/* CUSTOMERS LIST TABLE */}
      <Panel title="Bank Customer Directory">
        {customers.loading ? (
          <Loading />
        ) : customers.data && customers.data.content.length > 0 ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>CIF Number</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Customer Profile</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Category</th>
                    <th style={{ whiteSpace: 'nowrap' }}>NIC Number</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Contact Info</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.data.content.map(c => {
                    const userCat = c.userCategory || (c.cifNumber ? 'Bank users' : 'Wallet users');
                    return (
                      <tr key={c.userId}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <strong>{c.cifNumber || 'None (Wallet)'}</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={c.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`}
                              alt={c.username}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', background: '#f1f5f9' }}
                            />
                            <div>
                              <strong style={{ display: 'block' }}>{c.fullName || c.username}</strong>
                              <small style={{ color: 'var(--ink-soft)' }}>@{c.username}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status ${userCat === 'Bank users' ? 'active' : 'submitted'}`}
                            style={{ fontWeight: 700 }}
                          >
                            {userCat}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{c.nic || 'Not Recorded'}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <div>{c.email || '—'}</div>
                          <small style={{ color: 'var(--ink-soft)' }}>{c.phone || '—'}</small>
                        </td>
                        <td>
                          <StatusBadge status={c.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="actions" style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button
                              className="button secondary"
                              onClick={() => {
                                setSelectedCustomer(c);
                                autoScrollTo('.modal-backdrop');
                              }}
                            >
                              View Profile &amp; KYC
                            </button>

                            {/* Disable / Activate (Bank Employees & Managers) */}
                            {c.status !== 'DELETED' && (
                              <button
                                className={`button ${c.status === 'ACTIVE' ? 'secondary danger' : 'secondary'}`}
                                disabled={busy}
                                onClick={() => handleToggleStatus(c)}
                              >
                                {c.status === 'ACTIVE' ? 'Disable' : 'Activate'}
                              </button>
                            )}

                            {/* Deletion Workflow */}
                            {c.status === 'PENDING_DELETION' ? (
                              isManager ? (
                                <>
                                  <button
                                    className="button danger"
                                    disabled={busy}
                                    onClick={() => handleApproveDeletion(c)}
                                  >
                                    Approve Deletion
                                  </button>
                                  <button
                                    className="button secondary"
                                    disabled={busy}
                                    onClick={() => handleRejectDeletion(c)}
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#f59e0b',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    background: '#fffbeb',
                                    border: '1px solid #fcd34d'
                                  }}
                                >
                                  Pending Manager Approval
                                </span>
                              )
                            ) : (
                              c.status !== 'DELETED' && (
                                <button
                                  className="button danger"
                                  disabled={busy}
                                  onClick={() => {
                                    if (isManager) {
                                      handleApproveDeletion(c);
                                    } else {
                                      handleRequestDeletion(c);
                                    }
                                  }}
                                >
                                  {isManager ? 'Delete Customer' : 'Request Deletion'}
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination data={customers.data} onPage={setPage} />
          </>
        ) : (
          <Empty>No customer records found matching your search criteria.</Empty>
        )}
      </Panel>

      {/* KYC DOCUMENT & COMPLETE PROFILE PREVIEW MODAL */}
      {selectedCustomer && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedCustomer(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 11, 16, 0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '760px',
              width: '100%',
              padding: '2rem',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '24px',
              border: '1px solid var(--gold-border)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <img
                  src={selectedCustomer.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCustomer.username}`}
                  alt={selectedCustomer.username}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }}
                />
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px' }}>{selectedCustomer.fullName || selectedCustomer.username}</h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <small style={{ color: 'var(--ink-soft)' }}>@{selectedCustomer.username}</small>
                    <span
                      className={`status ${(selectedCustomer.userCategory || (selectedCustomer.cifNumber ? 'Bank users' : 'Wallet users')) === 'Bank users' ? 'active' : 'submitted'}`}
                      style={{ fontWeight: 800, fontSize: '11px' }}
                    >
                      {selectedCustomer.userCategory || (selectedCustomer.cifNumber ? 'Bank users' : 'Wallet users')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="button secondary"
                onClick={() => setSelectedCustomer(null)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '50%' }}
              >
                ✕
              </button>
            </div>

            {/* Complete Profile Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', background: 'var(--card-subtle)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.75rem' }}>
              <div>
                <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Full Name</small>
                <strong style={{ fontSize: '15px' }}>{selectedCustomer.fullName || selectedCustomer.username}</strong>
              </div>

              <div>
                <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Username</small>
                <strong style={{ fontSize: '15px' }}>@{selectedCustomer.username}</strong>
              </div>

              <div>
                <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>National ID (NIC Number)</small>
                <strong style={{ fontSize: '15px', color: 'var(--gold)' }}>{selectedCustomer.nic || 'Not Provided'}</strong>
              </div>

              <div>
                <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Phone Number</small>
                <strong style={{ fontSize: '15px' }}>{selectedCustomer.phone || 'Not Provided'}</strong>
              </div>

              <div>
                <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Email Address</small>
                <strong style={{ fontSize: '15px' }}>{selectedCustomer.email || 'Not Provided'}</strong>
              </div>

              <div>
                <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Birthday (Date of Birth)</small>
                <strong style={{ fontSize: '15px' }}>{selectedCustomer.dateOfBirth || 'Not Provided'}</strong>
              </div>

              <div>
                <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>CIF Number</small>
                <strong style={{ fontSize: '15px' }}>{selectedCustomer.cifNumber || 'None (Wallet User)'}</strong>
              </div>

              <div>
                <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>User Status</small>
                <div><StatusBadge status={selectedCustomer.status} /></div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Residential Address</small>
                <strong style={{ fontSize: '14px', lineHeight: '1.6' }}>{selectedCustomer.address || 'No registered address on record'}</strong>
              </div>
            </div>

            {/* Customer Financial Statistics & Banking Overview */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.7))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              borderRadius: '20px',
              padding: '1.5rem',
              marginBottom: '1.75rem',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)' }}>
                  📊 Customer Financial Statistics &amp; Banking Overview
                </h3>
                <small style={{ color: 'var(--ink-soft)', fontSize: '12px' }}>Whole Bank Lifetime Stats</small>
              </div>

              {selectedCustomer.financialStats ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: 'var(--card-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block' }}>Total Account Balance</small>
                      <strong style={{ fontSize: '18px', color: '#10b981', display: 'block', marginTop: '4px' }}>
                        LKR {Number(selectedCustomer.financialStats.totalAccountBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                      <small style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>{selectedCustomer.financialStats.totalAccounts} Active Accounts</small>
                    </div>

                    <div style={{ background: 'var(--card-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block' }}>Fixed Deposit Volume</small>
                      <strong style={{ fontSize: '18px', color: 'var(--gold)', display: 'block', marginTop: '4px' }}>
                        LKR {Number(selectedCustomer.financialStats.totalFixedDepositAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                      <small style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>{selectedCustomer.financialStats.totalFixedDepositsCount} Active FDs</small>
                    </div>

                    <div style={{ background: 'var(--card-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block' }}>Outstanding Loan Debt</small>
                      <strong style={{ fontSize: '18px', color: '#ef4444', display: 'block', marginTop: '4px' }}>
                        LKR {Number(selectedCustomer.financialStats.totalLoanBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                      <small style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>{selectedCustomer.financialStats.totalLoansCount} Active Loans</small>
                    </div>

                    <div style={{ background: 'var(--card-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block' }}>Cards &amp; Activity</small>
                      <strong style={{ fontSize: '18px', color: 'var(--ink)', display: 'block', marginTop: '4px' }}>
                        {selectedCustomer.financialStats.totalCardsCount} Cards Issued
                      </strong>
                      <small style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>{selectedCustomer.financialStats.totalTransactionsCount} Total Transactions</small>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div>
                      <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block' }}>Lifetime Deposits / Credits</small>
                      <strong style={{ fontSize: '15px', color: '#10b981' }}>
                        +LKR {Number(selectedCustomer.financialStats.totalDeposits || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div>
                      <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block' }}>Lifetime Debits / Transfers</small>
                      <strong style={{ fontSize: '15px', color: '#f59e0b' }}>
                        -LKR {Number(selectedCustomer.financialStats.totalWithdrawals || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div>
                      <small style={{ color: 'var(--ink-muted)', fontSize: '11px', display: 'block' }}>Net Lifetime Cash Flow</small>
                      <strong style={{ fontSize: '15px', color: Number(selectedCustomer.financialStats.netFlow || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                        {Number(selectedCustomer.financialStats.netFlow || 0) >= 0 ? '+' : ''}LKR {Number(selectedCustomer.financialStats.netFlow || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--ink-soft)', fontSize: '13px', fontStyle: 'italic' }}>
                  No financial statistics calculated yet.
                </div>
              )}
            </div>

            {/* Submitted KYC Identification Documents Section */}
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '18px' }}>Submitted KYC Identification Documents</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem', background: 'var(--card-subtle)', textAlign: 'center' }}>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--gold)', marginBottom: '0.75rem' }}>NIC Front Document</strong>
                <a href={selectedCustomer.nicFrontImage || 'https://dummyimage.com/600x380/e2e8f0/1e293b.png&text=NIC+Front+Document'} target="_blank" rel="noopener noreferrer">
                  <img
                    src={selectedCustomer.nicFrontImage || 'https://dummyimage.com/600x380/e2e8f0/1e293b.png&text=NIC+Front+Document'}
                    alt="NIC Front Document"
                    style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border)' }}
                  />
                </a>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem', background: 'var(--card-subtle)', textAlign: 'center' }}>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--gold)', marginBottom: '0.75rem' }}>NIC Back Document</strong>
                <a href={selectedCustomer.nicBackImage || 'https://dummyimage.com/600x380/e2e8f0/1e293b.png&text=NIC+Back+Document'} target="_blank" rel="noopener noreferrer">
                  <img
                    src={selectedCustomer.nicBackImage || 'https://dummyimage.com/600x380/e2e8f0/1e293b.png&text=NIC+Back+Document'}
                    alt="NIC Back Document"
                    style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border)' }}
                  />
                </a>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <button
                className={`button ${selectedCustomer.status === 'ACTIVE' ? 'secondary danger' : 'secondary'}`}
                disabled={busy}
                onClick={() => handleToggleStatus(selectedCustomer)}
              >
                {selectedCustomer.status === 'ACTIVE' ? 'Disable Customer Access' : 'Activate Customer Access'}
              </button>

              {selectedCustomer.status === 'PENDING_DELETION' ? (
                isManager && (
                  <>
                    <button
                      className="button danger"
                      disabled={busy}
                      onClick={() => handleApproveDeletion(selectedCustomer)}
                    >
                      Approve Deletion
                    </button>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => handleRejectDeletion(selectedCustomer)}
                    >
                      Reject Deletion Request
                    </button>
                  </>
                )
              ) : selectedCustomer.status !== 'DELETED' && (
                <button
                  className="button danger"
                  disabled={busy}
                  onClick={() => {
                    if (isManager) {
                      handleApproveDeletion(selectedCustomer);
                    } else {
                      handleRequestDeletion(selectedCustomer);
                    }
                  }}
                >
                  {isManager ? 'Delete Customer' : 'Request Deletion'}
                </button>
              )}

              <button
                className="button secondary"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}