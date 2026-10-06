import { useState } from 'react';
import { send, api, money } from '../api/client';
import { useApi, Heading, Panel, Field, ErrorMessage, Loading, Pagination, StatusBadge, Empty } from '../components/ui';
import { ApplicationPdfModal } from '../components/ApplicationPdfModal';
import type { Account, Deposit, Loan, Page, CustomerSearchResult } from '../types/api';

const ACCOUNT_TYPES = [
  'Serendib Prime Investor Savings',
  'YouthWave Digital Account',
  'Ranbima Senior Citizens Scheme',
  'Serendib Personal RFC',
  'Liya Saviya Ladies Savings Account',
  'Serendib Dynamic Corporate Current Account',
  'SmartBiz Sole Proprietor Current Account'
];

const LOAN_TYPES = [
  'SpeedDraft Personal Credit Line',
  'Serendib Home Premium Loan',
  'Nena Haras Higher Education Loan',
  'GreenDrive Hybrid & EV Leasing',
  'Commercial Machinery Leasing',
  'Small Business Expansion Facility'
];

export function StaffAccountsPage() {
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [activeQueueTab, setActiveQueueTab] = useState<'ACCOUNTS' | 'DEPOSITS' | 'LOANS'>('ACCOUNTS');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form State
  const [activeFormTab, setActiveFormTab] = useState<'ACCOUNT' | 'LOAN' | null>(null);
  
  // NIC Search & Customer State
  const [nicSearch, setNicSearch] = useState('');
  const [searchingNic, setSearchingNic] = useState(false);
  const [searchResult, setSearchResult] = useState<CustomerSearchResult | null>(null);

  // Form Input States
  const [cifNumber, setCifNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nicFront, setNicFront] = useState('');
  const [nicBack, setNicBack] = useState('');
  const [addressDoc, setAddressDoc] = useState('');

  // Account Form Specifics
  const [accountType, setAccountType] = useState(ACCOUNT_TYPES[0]);
  const [initialDeposit, setInitialDeposit] = useState('');

  // Loan Form Specifics
  const [loanType, setLoanType] = useState(LOAN_TYPES[0]);
  const [loanAmount, setLoanAmount] = useState('');
  const [termMonths, setTermMonths] = useState('24');
  const [interestRate, setInterestRate] = useState('');
  const [loanInformation, setLoanInformation] = useState('');

  // PDF Printable Modal State
  const [pdfAccount, setPdfAccount] = useState<Account | null>(null);
  const [pdfLoan, setPdfLoan] = useState<Loan | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const pendingAccounts = useApi<Page<Account>>(`/api/employee/accounts/pending?page=${page}`, revision);
  const pendingDeposits = useApi<Page<Deposit>>(`/api/employee/fixed-deposits/pending?page=${page}`, revision);
  const pendingLoans = useApi<Page<Loan>>(`/api/employee/loans?status=SUBMITTED&page=${page}`, revision);

  const todayStr = new Date().toISOString().split('T')[0];

  async function handleNicSearch() {
    if (!nicSearch.trim()) return;
    setSearchingNic(true);
    setError(null);
    try {
      const res = await api<CustomerSearchResult>(`/api/employee/customers/search-by-nic?nic=${encodeURIComponent(nicSearch.trim())}`);
      setSearchResult(res);
      if (res.exists) {
        setCifNumber(res.cifNumber || '0000000');
        setFullName(res.fullName || '');
        setEmail(res.email || '');
        setPhone(res.phone || '');
        setAddress(res.address || '');
        setDateOfBirth(res.dateOfBirth || '');
      } else {
        alert('Customer does not exist in database.');
        setCifNumber(res.nextCifNumber || '0000000');
        setFullName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setDateOfBirth('');
      }
    } catch (e) {
      setError(e);
    } finally {
      setSearchingNic(false);
    }
  }

  function validateForm(): boolean {
    if (!nicSearch.trim()) {
      setError('Please enter Customer NIC Number first.');
      return false;
    }
    if (dateOfBirth && dateOfBirth > todayStr) {
      setError('Date of Birth cannot be in the future.');
      return false;
    }
    if (/[0-9]/.test(fullName) || (fullName.trim() && !/^[a-zA-Z\s.'-]+$/.test(fullName.trim()))) {
      setError('Full name cannot contain numbers or special characters.');
      return false;
    }
    if (/[a-zA-Z]/.test(phone)) {
      setError('Mobile phone number cannot contain letters.');
      return false;
    }
    if (activeFormTab === 'ACCOUNT') {
      if (!nicFront.trim() || !nicBack.trim() || !addressDoc.trim()) {
        setError('Must add all three required documents (NIC Front, NIC Back, and Address Verification document) to proceed.');
        return false;
      }
    }
    return true;
  }

  async function handleProvisionAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setBusy(true);
    setError(null);
    try {
      const payload = {
        customerUserId: searchResult?.exists ? searchResult.userId : null,
        nic: nicSearch.trim(),
        cifNumber,
        fullName,
        email,
        phone,
        address,
        dateOfBirth: dateOfBirth || null,
        accountType,
        initialDeposit: Number(initialDeposit) || 0
      };

      const createdAccount = await send<Account>('/api/employee/accounts/open', payload, 'POST');
      
      if (createdAccount.tempUsername && createdAccount.tempPassword) {
        alert(
          `Account Provisioned Successfully!\n\n` +
          `System generated login credentials have been sent to customer email (${email || (nicSearch.trim().toLowerCase() + '@serendibsmartbank.lk')}):\n\n` +
          `Username: ${createdAccount.tempUsername}\n` +
          `Temporary Password: ${createdAccount.tempPassword}\n\n` +
          `Customer will be prompted to upload NIC front/back images and profile picture upon first login.`
        );
      }

      // Automatically clear filling fields after application is submitted to upper layer / approval
      setActiveFormTab(null);
      resetForm();
      setRevision(r => r + 1);

      // Open PDF Modal immediately after account is opened
      setPdfAccount(createdAccount);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleProvisionLoan(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setBusy(true);
    setError(null);
    try {
      const payload = {
        customerUserId: searchResult?.exists ? searchResult.userId : null,
        nic: nicSearch.trim(),
        cifNumber,
        fullName,
        email,
        phone,
        address,
        dateOfBirth: dateOfBirth || null,
        loanType,
        amount: Number(loanAmount) || 100000,
        termMonths: Number(termMonths) || 24,
        interestRate: Number(interestRate) || 10.5,
        information: loanInformation || 'Credit facility opened by bank staff'
      };

      const createdLoan = await send<Loan>('/api/employee/loans/open', payload, 'POST');
      
      // Automatically clear filling fields after application is submitted to upper layer / approval
      setActiveFormTab(null);
      resetForm();
      setRevision(r => r + 1);

      // Open PDF Modal immediately after loan is opened
      setPdfLoan(createdLoan);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const [approvingAccount, setApprovingAccount] = useState<Account | null>(null);
  const [approvalDeposit, setApprovalDeposit] = useState('');

  function resetForm() {
    setNicSearch('');
    setSearchResult(null);
    setCifNumber('');
    setFullName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setDateOfBirth('');
    setAccountType(ACCOUNT_TYPES[0]);
    setInitialDeposit('');
    setLoanType(LOAN_TYPES[0]);
    setLoanAmount('');
    setTermMonths('24');
    setInterestRate('');
    setLoanInformation('');
  }

  async function confirmApproveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!approvingAccount) return;
    setBusy(true);
    setError(null);
    try {
      const depVal = approvalDeposit !== '' && !isNaN(Number(approvalDeposit)) ? Number(approvalDeposit) : 0;
      const updated = await send<Account>(`/api/employee/accounts/${approvingAccount.accountId}/approve`, {
        initialDeposit: depVal
      }, 'POST');
      setApprovingAccount(null);
      setApprovalDeposit('');
      setRevision(r => r + 1);
      setPdfAccount(updated);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }


  async function reject(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAccount) return;
    if (!confirm(`Reject application for ${selectedAccount.accountType}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/accounts/${selectedAccount.accountId}/reject`, { reason: rejectionReason }, 'POST');
      setSelectedAccount(null);
      setRejectionReason('');
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function approveDeposit(deposit: Deposit) {
    if (!confirm(`Approve Fixed Deposit #${deposit.fixedDepositId} for ${money(deposit.principalAmount)}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/fixed-deposits/${deposit.fixedDepositId}/approve`, undefined, 'POST');
      setSelectedDeposit(null);
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function rejectDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDeposit) return;
    if (!confirm(`Reject Fixed Deposit #${selectedDeposit.fixedDepositId}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/fixed-deposits/${selectedDeposit.fixedDepositId}/reject`, { reason: rejectionReason }, 'POST');
      setSelectedDeposit(null);
      setRejectionReason('');
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function reviewLoan(loan: Loan, action: string) {
    if (!confirm(`Perform ${action} on Loan #${loan.loanId}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/loans/${loan.loanId}/${action}`, { reason: 'Reviewed by bank staff' }, 'POST');
      setSelectedLoan(null);
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
        title="Employee Bank Operations Dashboard"
        subtitle="Provision accounts & credit facilities (loans/leasings) for existing or new bank customers."
        icon="/images/page-icons/accounts.png"
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className={`button ${activeFormTab === 'ACCOUNT' ? 'secondary' : ''}`}
              onClick={() => {
                if (activeFormTab === 'ACCOUNT') setActiveFormTab(null);
                else { setActiveFormTab('ACCOUNT'); resetForm(); }
              }}
            >
              {activeFormTab === 'ACCOUNT' ? 'Close Form' : '+ Open Account for Customer'}
            </button>
            <button
              className={`button ${activeFormTab === 'LOAN' ? 'secondary' : ''}`}
              style={{ background: activeFormTab === 'LOAN' ? '#64748b' : '#059669' }}
              onClick={() => {
                if (activeFormTab === 'LOAN') setActiveFormTab(null);
                else { setActiveFormTab('LOAN'); resetForm(); }
              }}
            >
              {activeFormTab === 'LOAN' ? 'Close Form' : '+ Open Loan / Leasing for Customer'}
            </button>
          </div>
        }
      />

      <ErrorMessage error={error || pendingAccounts.error || pendingDeposits.error || pendingLoans.error} />

      {/* ACCOUNT OR LOAN PROVISIONING FORM */}
      {activeFormTab && (
        <Panel title={activeFormTab === 'ACCOUNT' ? 'Bank Account Opening Form (Staff Provisioning)' : 'Loan & Leasing Credit Facility Form (Staff Provisioning)'} className="glass-card">
          <form onSubmit={activeFormTab === 'ACCOUNT' ? handleProvisionAccount : handleProvisionLoan}>

            {/* STEP 1: NIC NUMBER ENTERED FIRST */}
            <div className="glass-card" style={{ background: 'var(--card-subtle)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-gold-primary)', fontSize: '1.05rem' }}>Step 1: Enter Customer NIC Number to Check Database</h4>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <Field label="Customer NIC Number *">
                    <input
                      type="text"
                      required
                      maxLength={12}
                      placeholder="e.g. 199012345678 or 901234567V"
                      value={nicSearch}
                      onChange={e => setNicSearch(e.target.value.slice(0, 12))}
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  disabled={searchingNic || !nicSearch.trim()}
                  onClick={handleNicSearch}
                  style={{ marginBottom: '0.25rem' }}
                >
                  {searchingNic ? 'Searching Database...' : 'Search NIC in Database'}
                </button>
              </div>

              {/* SEARCH RESULT BADGE */}
              {searchResult && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1.15rem',
                  borderRadius: '10px',
                  background: searchResult.exists ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                  borderLeft: `4px solid ${searchResult.exists ? '#10b981' : '#3b82f6'}`,
                  color: 'var(--ink)',
                  fontSize: '0.9rem'
                }}>
                  {searchResult.exists ? (
                    <div>
                      <strong style={{ color: '#10b981' }}>✓ Existing Customer Found!</strong> CIF Number: <strong style={{ color: 'var(--color-gold-primary)' }}>{searchResult.cifNumber}</strong>. Details auto-populated.
                    </div>
                  ) : (
                    <div>
                      <strong style={{ color: '#3b82f6' }}>ℹ New Customer Registration:</strong> Customer does not exist in DB. Mandatory New CIF Number <strong style={{ color: 'var(--color-gold-primary)' }}>{searchResult.nextCifNumber}</strong> will be assigned.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: CIF AND CUSTOMER DETAILS */}
            <div className="glass-card" style={{ background: 'var(--surface-primary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--ink)', fontSize: '1.05rem' }}>Step 2: Customer CIF &amp; Personal Identification Data</h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <Field label="Customer Identification Number (CIF) *">
                  <input
                    type="text"
                    required
                    readOnly
                    value={cifNumber}
                    style={{ background: 'var(--card-subtle)', color: 'var(--color-gold-primary)', fontWeight: 700, fontFamily: 'monospace' }}
                    placeholder="Auto-assigned starting from 0000000"
                  />
                </Field>

                <Field label="Full Name (Letters and spaces only) *">
                  <input
                    type="text"
                    required
                    placeholder="Enter Customer Full Name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value.replace(/[^a-zA-Z\s.'-]/g, ''))}
                  />
                </Field>

                <Field label="Bank Registered Email *">
                  <input
                    type="email"
                    required
                    placeholder="customer@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </Field>

                <Field label="Bank Registered Mobile Phone (Digits only) *">
                  <input
                    type="text"
                    required
                    placeholder="07XXXXXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[a-zA-Z]/g, '').replace(/[^0-9+]/g, ''))}
                  />
                </Field>

                <Field label="Date of Birth (Future dates blocked) *">
                  <input
                    type="date"
                    required
                    max={todayStr}
                    value={dateOfBirth}
                    onChange={e => {
                      if (e.target.value > todayStr) {
                        setError('Date of birth cannot be in the future');
                      } else {
                        setError(null);
                        setDateOfBirth(e.target.value);
                      }
                    }}
                  />
                </Field>

                <Field label="Residential Address *">
                  <input
                    type="text"
                    required
                    placeholder="Permanent address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {/* STEP 3: FACILITY / APPLICATION SPECIFICS */}
            <div className="glass-card" style={{ background: 'var(--surface-primary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--ink)', fontSize: '1.05rem' }}>
                Step 3: {activeFormTab === 'ACCOUNT' ? 'Account Type & Opening Balance Details' : 'Credit Facility Amount, Rate & Tenure Details'}
              </h4>

              {activeFormTab === 'ACCOUNT' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <Field label="Account Type Tier">
                    <select value={accountType} onChange={e => setAccountType(e.target.value)}>
                      {ACCOUNT_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Initial Deposit Amount (LKR)">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="e.g. 5000"
                      value={initialDeposit}
                      onChange={e => setInitialDeposit(e.target.value)}
                    />
                  </Field>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <Field label="Facility Type Tier">
                    <select value={loanType} onChange={e => setLoanType(e.target.value)}>
                      {LOAN_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Facility Amount (LKR) *">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="Enter any numerical loan amount"
                      value={loanAmount}
                      onChange={e => setLoanAmount(e.target.value)}
                    />
                  </Field>

                  <Field label="Tenure Period (Months) *">
                    <input
                      type="number"
                      min="6"
                      max="360"
                      required
                      placeholder="e.g. 24"
                      value={termMonths}
                      onChange={e => setTermMonths(e.target.value)}
                    />
                  </Field>

                  <Field label="Annual Interest Rate (%) *">
                    <input
                      type="number"
                      min="1.0"
                      max="30.0"
                      step="0.25"
                      required
                      placeholder="e.g. 12.00"
                      value={interestRate}
                      onChange={e => setInterestRate(e.target.value)}
                    />
                  </Field>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Facility Scrutiny & Purpose Information">
                      <textarea
                        value={loanInformation}
                        onChange={e => setLoanInformation(e.target.value)}
                        placeholder="State employment salary, vehicle details, or credit assessment notes..."
                      />
                    </Field>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 4: MANDATORY KYC DOCUMENT UPLOADS */}
            {activeFormTab === 'ACCOUNT' && (
              <div className="glass-card" style={{ background: 'var(--surface-primary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--ink)', fontSize: '1.05rem' }}>Step 4: Mandatory Document Verification Files (All 3 Required)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <Field label="NIC Front Image / PDF *">
                    <input required type="file" onChange={e => setNicFront(e.target.files?.[0]?.name || '')} />
                  </Field>
                  <Field label="NIC Back Image / PDF *">
                    <input required type="file" onChange={e => setNicBack(e.target.files?.[0]?.name || '')} />
                  </Field>
                  <Field label="Address Verification Document *">
                    <input required type="file" onChange={e => setAddressDoc(e.target.files?.[0]?.name || '')} />
                  </Field>
                </div>
              </div>
            )}

            <div className="actions" style={{ display: 'flex', gap: '1rem' }}>
              <button disabled={busy} className="button" style={{ background: activeFormTab === 'LOAN' ? '#059669' : undefined }}>
                {busy ? 'Processing Application...' : (activeFormTab === 'ACCOUNT' ? 'Complete Account Opening' : 'Complete Loan Facility Opening')}
              </button>
              <button type="button" className="button secondary" onClick={() => setActiveFormTab(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      )}

      {/* ACCOUNT SERVICES APPLICATIONS QUEUES (ACCOUNTS, FIXED DEPOSITS & LOANS) */}
      <Panel title="Account Services Applications Queue (All Submitted Applications)">
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button
            className={`button ${activeQueueTab === 'ACCOUNTS' ? '' : 'secondary'}`}
            onClick={() => setActiveQueueTab('ACCOUNTS')}
          >
            🏦 Account Opening Applications ({pendingAccounts.data?.totalElements ?? 0})
          </button>
          <button
            className={`button ${activeQueueTab === 'DEPOSITS' ? '' : 'secondary'}`}
            onClick={() => setActiveQueueTab('DEPOSITS')}
          >
            💰 Fixed Deposit Applications ({pendingDeposits.data?.totalElements ?? 0})
          </button>
          <button
            className={`button ${activeQueueTab === 'LOANS' ? '' : 'secondary'}`}
            onClick={() => setActiveQueueTab('LOANS')}
          >
            📑 Loan & Leasing Applications ({pendingLoans.data?.totalElements ?? 0})
          </button>
        </div>

        {/* TAB 1: ACCOUNT OPENING APPLICATIONS QUEUE */}
        {activeQueueTab === 'ACCOUNTS' && (
          <>
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
                            <th>CIF Number</th>
                            <th>Account Type</th>
                            <th>Applicant</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingAccounts.data.content.map(a => (
                            <tr key={a.accountId}>
                              <td><strong>{a.cifNumber || '0000000'}</strong></td>
                              <td>{a.accountType}</td>
                              <td>{a.customerName || 'Customer'} (NIC: {a.customerNic || 'N/A'})</td>
                              <td><StatusBadge status={a.status} /></td>
                              <td>
                                <div className="actions">
                                  <button disabled={busy} onClick={() => { setApprovingAccount(a); setApprovalDeposit('1000'); }}>Approve</button>
                                  <button className="secondary danger" disabled={busy} onClick={() => setSelectedAccount(a)}>
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
                    <Empty>No pending account applications in your verification queue.</Empty>
                  )}
                  <Pagination data={pendingAccounts.data} onPage={setPage} />
                </>
              )
            )}
          </>
        )}

        {/* TAB 2: FIXED DEPOSIT APPLICATIONS QUEUE */}
        {activeQueueTab === 'DEPOSITS' && (
          <>
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
                          {pendingDeposits.data.content.map(d => (
                            <tr key={d.fixedDepositId}>
                              <td><strong>FD #{d.fixedDepositId}</strong></td>
                              <td><strong>{money(d.principalAmount)}</strong></td>
                              <td>{d.termMonths} Months @ {d.interestRate}%</td>
                              <td><StatusBadge status={d.status} /></td>
                              <td>
                                <div className="actions">
                                  <button disabled={busy} onClick={() => approveDeposit(d)}>Approve FD</button>
                                  <button className="secondary danger" disabled={busy} onClick={() => setSelectedDeposit(d)}>
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
                    <Empty>No pending fixed deposit applications in your queue.</Empty>
                  )}
                  <Pagination data={pendingDeposits.data} onPage={setPage} />
                </>
              )
            )}
          </>
        )}

        {/* TAB 3: LOAN APPLICATIONS QUEUE */}
        {activeQueueTab === 'LOANS' && (
          <>
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
                            <th>Loan Facility</th>
                            <th>CIF Number</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingLoans.data.content.map(l => (
                            <tr key={l.loanId}>
                              <td>{l.loanNumber || `#${l.loanId}`} · {l.loanType}</td>
                              <td><strong>{l.cifNumber || '0000000'}</strong></td>
                              <td>{l.customer}</td>
                              <td><strong>{money(l.amount)}</strong></td>
                              <td><StatusBadge status={l.status} /></td>
                              <td>
                                <div className="actions">
                                  <button
                                    disabled={busy}
                                    style={{ background: '#059669', color: '#fff' }}
                                    onClick={async () => {
                                      if (!confirm(`Recommend Loan #${l.loanId} (${money(l.amount)}) directly to Manager for approval?`)) return;
                                      setBusy(true);
                                      try {
                                        await send(`/api/employee/loans/${l.loanId}/recommend`, { reason: 'Recommended to manager by bank employee' }, 'POST');
                                        setRevision(r => r + 1);
                                      } catch (err) {
                                        setError(err);
                                      } finally {
                                        setBusy(false);
                                      }
                                    }}
                                  >
                                    👍 Recommend to Manager
                                  </button>
                                  <button
                                    className="secondary"
                                    disabled={busy}
                                    onClick={async () => {
                                      const reasonStr = prompt(`Enter document correction notes requested from customer for Loan #${l.loanId}:`, 'Please refill application with updated salary slips and NIC documents');
                                      if (reasonStr === null) return;
                                      setBusy(true);
                                      try {
                                        await send(`/api/employee/loans/${l.loanId}/request-information`, { reason: reasonStr }, 'POST');
                                        setRevision(r => r + 1);
                                      } catch (err) {
                                        setError(err);
                                      } finally {
                                        setBusy(false);
                                      }
                                    }}
                                  >
                                    📝 Request Documents
                                  </button>
                                  <button
                                    className="secondary danger"
                                    disabled={busy}
                                    onClick={async () => {
                                      const reasonStr = prompt(`Enter rejection reason for Loan #${l.loanId}:`, 'Does not meet credit eligibility criteria');
                                      if (reasonStr === null) return;
                                      setBusy(true);
                                      try {
                                        await send(`/api/employee/loans/${l.loanId}/reject`, { reason: reasonStr }, 'POST');
                                        setRevision(r => r + 1);
                                      } catch (err) {
                                        setError(err);
                                      } finally {
                                        setBusy(false);
                                      }
                                    }}
                                  >
                                    ❌ Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty>No submitted loan applications awaiting review in your queue.</Empty>
                  )}
                  <Pagination data={pendingLoans.data} onPage={setPage} />
                </>
              )
            )}
          </>
        )}
      </Panel>

      {/* REJECTION REASON PANEL FOR ACCOUNTS */}
      {selectedAccount && (
        <Panel title={`Reject Application for ${selectedAccount.accountType}`}>
          <form onSubmit={reject}>
            <Field label="Rejection Reason">
              <textarea required value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="State the reason for rejection..." />
            </Field>
            <div className="actions">
              <button className="button danger" disabled={busy}>Confirm Rejection</button>
              <button type="button" className="button secondary" onClick={() => setSelectedAccount(null)}>Cancel</button>
            </div>
          </form>
        </Panel>
      )}

      {/* REJECTION REASON PANEL FOR FIXED DEPOSITS */}
      {selectedDeposit && (
        <Panel title={`Reject Fixed Deposit #${selectedDeposit.fixedDepositId}`}>
          <form onSubmit={rejectDeposit}>
            <Field label="Rejection Reason">
              <textarea required value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="State the reason for rejection..." />
            </Field>
            <div className="actions">
              <button className="button danger" disabled={busy}>Confirm Rejection</button>
              <button type="button" className="button secondary" onClick={() => setSelectedDeposit(null)}>Cancel</button>
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
                  {busy ? 'Approving...' : 'Confirm Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETED APPLICATION PDF PRINT MODAL */}

      {(pdfAccount || pdfLoan) && (
        <ApplicationPdfModal
          account={pdfAccount}
          loan={pdfLoan}
          onClose={() => { setPdfAccount(null); setPdfLoan(null); }}
        />
      )}
    </>
  );
}
