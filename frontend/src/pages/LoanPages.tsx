import { Text } from '../i18n';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { send, api, money, date, query } from '../api/client';
import { useApi, Heading, Panel, Field, ErrorMessage, Loading, Pagination, StatusBadge, Detail, Empty } from '../components/ui';
import type { Loan, Page, Account, Deposit, CustomerSearchResult } from '../types/api';
import { TermsModal } from '../components/TermsModal';
import { ApplicationPdfModal } from '../components/ApplicationPdfModal';
import { ApplicationDetails } from '../components/ApplicationDetails';
import { LOANS_CATALOG } from '../data/productCatalog';
import { useAuth } from '../auth/AuthProvider';

export function RefillLoanModal({ loan, onClose, onSuccess }: { loan: Loan; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState(String(loan.amount || ''));
  const [tenureMonths, setTenureMonths] = useState(String(loan.termMonths || loan.preferredTenureMonths || 24));
  const [basicSalary, setBasicSalary] = useState(String(loan.basicMonthlySalary || ''));
  const [fixedAllowances, setFixedAllowances] = useState(String(loan.fixedAllowances || ''));
  const [cribDeductions, setCribDeductions] = useState(String(loan.existingMonthlyLoanDeductionsCrib || ''));

  const [nicFrontDoc, setNicFrontDoc] = useState(loan.nicFrontDoc || 'NIC_Front.pdf');
  const [nicBackDoc, setNicBackDoc] = useState(loan.nicBackDoc || 'NIC_Back.pdf');
  const [addressDoc, setAddressDoc] = useState(loan.addressVerificationDoc || 'Address_Verification.pdf');
  const [salarySlips, setSalarySlips] = useState(loan.salarySlipsUpload || '');
  const [bankStatements, setBankStatements] = useState(loan.bankStatementsUpload || '');
  const [employmentLetter, setEmploymentLetter] = useState(loan.employmentLetterUpload || '');

  const [additionalInformation, setAdditionalInformation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleResubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nicFrontDoc || !nicBackDoc || !addressDoc) {
      setError('Must provide all three required verification documents (NIC Front, NIC Back, and Address Verification) to resubmit.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await send(`/api/loans/${loan.loanId}/resubmit`, {
        loanType: loan.loanType,
        amount: Number(amount),
        preferredTenureMonths: Number(tenureMonths),
        basicMonthlySalary: Number(basicSalary) || 0,
        fixedAllowances: Number(fixedAllowances) || 0,
        existingMonthlyLoanDeductionsCrib: Number(cribDeductions) || 0,
        nicFrontDoc,
        nicBackDoc,
        addressVerificationDoc: addressDoc,
        salarySlipsUpload: salarySlips,
        bankStatementsUpload: bankStatements,
        employmentLetterUpload: employmentLetter,
        additionalInformation: additionalInformation || 'Refilled and updated loan application form'
      }, 'POST');
      onSuccess();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-card-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 650, width: '90%' }}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <div className="glass-modal-header">
          <div className="glass-modal-icon credit">📝</div>
          <div>
            <h2>Refill Loan Application</h2>
            <p>Facility #{loan.loanNumber || loan.loanId} · {loan.loanType}</p>
          </div>
        </div>

        <ErrorMessage error={error} />

        <div style={{ background: 'rgba(245,158,11,0.12)', borderLeft: '4px solid #f59e0b', padding: '0.85rem 1rem', borderRadius: '10px', margin: '0.75rem 0', fontSize: '0.9rem' }}>
          <strong style={{ color: '#f59e0b' }}>⚠️ Bank Staff Request &amp; Correction Remarks:</strong>
          <p style={{ margin: '0.35rem 0 0 0', opacity: 0.9, whiteSpace: 'pre-wrap' }}>
            {loan.additionalInformation || 'Staff requested updated documents or form corrections.'}
          </p>
        </div>

        <form onSubmit={handleResubmit} className="glass-modal-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Requested Loan Amount (LKR) *">
              <input type="number" step="any" min="0.01" required value={amount} onChange={e => setAmount(e.target.value)} />
            </Field>
            <Field label="Preferred Tenure (Months) *">
              <input type="number" required min="1" max="360" value={tenureMonths} onChange={e => setTenureMonths(e.target.value)} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <Field label="Basic Salary">
              <input type="number" step="any" min="0" value={basicSalary} onChange={e => setBasicSalary(e.target.value)} />
            </Field>
            <Field label="Fixed Allowances">
              <input type="number" step="any" min="0" value={fixedAllowances} onChange={e => setFixedAllowances(e.target.value)} />
            </Field>
            <Field label="CRIB Deductions">
              <input type="number" step="any" min="0" value={cribDeductions} onChange={e => setCribDeductions(e.target.value)} />
            </Field>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: 'var(--ink)' }}>Required Verification &amp; Supporting Documents</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <Field label="NIC Front Doc *">
                <input type="file" onChange={e => setNicFrontDoc(e.target.files?.[0]?.name || nicFrontDoc || 'NIC_Front.pdf')} />
              </Field>
              <Field label="NIC Back Doc *">
                <input type="file" onChange={e => setNicBackDoc(e.target.files?.[0]?.name || nicBackDoc || 'NIC_Back.pdf')} />
              </Field>
              <Field label="Address Verification *">
                <input type="file" onChange={e => setAddressDoc(e.target.files?.[0]?.name || addressDoc || 'Address_Verification.pdf')} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Field label="Salary Slips">
                <input type="file" onChange={e => setSalarySlips(e.target.files?.[0]?.name || salarySlips || '')} />
              </Field>
              <Field label="Bank Statements">
                <input type="file" onChange={e => setBankStatements(e.target.files?.[0]?.name || bankStatements || '')} />
              </Field>
              <Field label="Employment Letter">
                <input type="file" onChange={e => setEmploymentLetter(e.target.files?.[0]?.name || employmentLetter || '')} />
              </Field>
            </div>
          </div>

          <Field label="Customer Response / Refill Explanation for Bank Officer *">
            <textarea required maxLength={2000} value={additionalInformation} onChange={e => setAdditionalInformation(e.target.value)} placeholder="State what details or documents were updated..." />
          </Field>

          <div className="actions" style={{ marginTop: '1.25rem', justifyContent: 'flex-end' }}>
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={busy}>
              {busy ? 'Resubmitting…' : 'Submit Refilled Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LoansPage() {
  const { role } = useAuth();
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loanType, setLoanType] = useState(LOANS_CATALOG[0].name);
  const [amount, setAmount] = useState('');
  const [tenureMonths, setTenureMonths] = useState('60');
  const [info, setInfo] = useState('');
  
  // Account & FD Collateral State
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedFdId, setSelectedFdId] = useState<number | null>(null);

  // Loan Repayment Modal State
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);
  const [payAccountId, setPayAccountId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payingBusy, setPayingBusy] = useState(false);
  const [paymentError, setPaymentError] = useState<unknown>(null);

  // Scrutiny Fields
  const [basicSalary, setBasicSalary] = useState('');
  const [fixedAllowances, setFixedAllowances] = useState('');
  const [cribDeductions, setCribDeductions] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('Permanent');
  const [serviceYears, setServiceYears] = useState('');

  // Leasing Vehicle Details
  const [vehicleCondition, setVehicleCondition] = useState('Brand New');
  const [manufactureYear, setManufactureYear] = useState('');
  const [valuationAmount, setValuationAmount] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');

  // Documents
  const [salarySlips, setSalarySlips] = useState('');
  const [bankStatements, setBankStatements] = useState('');
  const [employmentLetter, setEmploymentLetter] = useState('');

  const [refillLoan, setRefillLoan] = useState<Loan | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const result = useApi<Page<Loan>>(`/api/loans?page=${page}`, revision);
  const userAccounts = useApi<Page<Account>>('/api/accounts', revision);
  const userDeposits = useApi<Page<Deposit>>('/api/deposits', revision);

  // Auto-select first active account if not selected
  useEffect(() => {
    if (!selectedAccountId && userAccounts.data?.content.length) {
      const active = userAccounts.data.content.find(a => a.status === 'ACTIVE');
      if (active) setSelectedAccountId(active.accountId);
    }
  }, [userAccounts.data, selectedAccountId]);

  const isLeasing = loanType.includes('Leasing') || loanType.includes('GreenDrive');
  const isFdSecured = loanType.includes('FD Backed') || loanType.includes('FD_SECURED');

  const eligibleDeposits = userDeposits.data?.content.filter(
    d => d.status === 'ACTIVE' && Number(d.principalAmount) >= 1000000
  ) || [];

  const activeLoans = result.data?.content.filter(l => l.status === 'APPROVED');

  function openTerms(e: React.FormEvent) {
    e.preventDefault();
    setShowTerms(true);
  }

  function resetFormFields() {
    setLoanType(LOANS_CATALOG[0].name);
    setAmount('');
    setTenureMonths('60');
    setInfo('');
    setSelectedFdId(null);
    setBasicSalary('');
    setFixedAllowances('');
    setCribDeductions('');
    setEmploymentStatus('Permanent');
    setServiceYears('');
    setVehicleCondition('Brand New');
    setManufactureYear('');
    setValuationAmount('');
    setChassisNumber('');
    setEngineNumber('');
    setSalarySlips('');
    setBankStatements('');
    setEmploymentLetter('');
  }

  async function submitApplication() {
    setBusy(true);
    setError(null);
    try {
      await send('/api/loans', {
        loanType,
        amount: Number(amount),
        preferredTenureMonths: Number(tenureMonths),
        information: info,
        accountId: selectedAccountId || undefined,
        fixedDepositId: isFdSecured ? (selectedFdId || undefined) : undefined,
        basicMonthlySalary: Number(basicSalary),
        fixedAllowances: Number(fixedAllowances),
        existingMonthlyLoanDeductionsCrib: Number(cribDeductions),
        employmentStatus,
        servicePeriodYears: Number(serviceYears),
        vehicleCondition: isLeasing ? vehicleCondition : undefined,
        yearOfManufacture: isLeasing ? Number(manufactureYear) : undefined,
        vehicleValuationAmount: isLeasing ? Number(valuationAmount) : undefined,
        chassisNumber: isLeasing ? chassisNumber : undefined,
        engineNumber: isLeasing ? engineNumber : undefined,
        salarySlipsUpload: salarySlips,
        bankStatementsUpload: bankStatements,
        employmentLetterUpload: employmentLetter
      });

      resetFormFields();
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function submitLoanPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payingLoan || !payAccountId || !payAmount) return;
    setPayingBusy(true);
    setPaymentError(null);
    try {
      await send(`/api/loans/${payingLoan.loanId}/pay`, {
        accountId: payAccountId,
        amount: Number(payAmount)
      });
      setPayingLoan(null);
      setPayAmount('');
      setRevision(r => r + 1);
    } catch (e) {
      setPaymentError(e);
    } finally {
      setPayingBusy(false);
    }
  }

  return (
    <>
      <Heading
        title="Loans & Leasing Facilities"
        subtitle="Apply for home loans, education financing, credit lines, FD-backed loans, and EV leasing."
        icon="/images/page-icons/loans.png"
      />

      <div 
        className="welcome-banner glass-card"
        style={{
          '--banner-bg-img': "url('/images/loan_businessman_banner.jpeg')",
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          marginBottom: '2rem'
        } as React.CSSProperties}
      >
        <span className="eyebrow">PRESTIGE CREDIT FACILITIES</span>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'Playfair Display', margin: '0.35rem 0 0.5rem 0' }}>
          Flexible Lending &amp; Asset Leasing
        </h2>
        <p style={{ margin: 0, maxWidth: '620px', opacity: 0.9, fontSize: '0.95rem' }}>
          Access personal credit, FD-collateralized instant loans, commercial equipment leasing, and vehicle facilities with competitive rates and transparent approval workflows.
        </p>
      </div>

      <ErrorMessage error={error || result.error || paymentError} />

      {/* ONGOING LOAN SECTION - DISPLAYED ONLY WHEN CUSTOMER HAS ACTIVE/APPROVED LOAN */}
      {activeLoans && activeLoans.length > 0 && (
        <section className="ongoing-loans-section" style={{ marginBottom: '2rem' }}>
          <Panel title="🟢 Active Ongoing Loans & Leasing">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {activeLoans.map(l => (
                <div
                  key={l.loanId}
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '12px',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>{l.loanType}</strong>
                    <StatusBadge status={l.status} />
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
                    {money(l.amount)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#a7f3d0', marginBottom: '0.5rem' }}>
                    Remaining: <strong>{money(l.remainingAmount || l.amount)}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.9 }}>
                    <div>Facility No: <strong>{l.loanNumber || `700000${l.loanId}`}</strong></div>
                    <div>Account: <strong>{l.targetAccountNumber || 'Disbursed'}</strong></div>
                    <div>Rate: <strong>{l.interestRate}% p.a.</strong></div>
                    <div>Applied: <strong>{date(l.applyDate)}</strong></div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      className="button primary"
                      style={{ flex: 1, padding: '0.5rem' }}
                      onClick={() => {
                        setPayingLoan(l);
                        setPayAmount(l.remainingAmount || l.amount);
                        if (userAccounts.data?.content.length) {
                          setPayAccountId(userAccounts.data.content[0].accountId);
                        }
                      }}
                    >
                      💳 Pay Installment
                    </button>
                    <Link className="button light" style={{ flex: 1, textAlign: 'center', padding: '0.5rem' }} to={`/app/loans/${l.loanId}`}>
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      )}

      <div className="two-column">
        {/* NEW APPLICATION FORM */}
        <Panel title="New Financing Application">
          <form onSubmit={openTerms}>
            <Field label="Loan / Leasing Product">
              <select value={loanType} onChange={e => setLoanType(e.target.value)}>
                {LOANS_CATALOG.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.rateOrYield})</option>
                ))}
              </select>
            </Field>

            <Field label="Disbursement Destination Account *">
              <select
                required
                value={selectedAccountId ?? ''}
                onChange={e => setSelectedAccountId(Number(e.target.value))}
              >
                <option value="">-- Select Account to Receive Loan Funds --</option>
                {userAccounts.data?.content.map(a => (
                  <option key={a.accountId} value={a.accountId}>
                    {a.accountNumber} ({a.accountType}) - Balance: LKR {money(a.balance)}
                  </option>
                ))}
              </select>
            </Field>

            {/* FD BACKED LOAN COLLATERAL BLOCK */}
            {isFdSecured && (
              <div style={{ background: 'rgba(59,130,246,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.25)', margin: '1rem 0' }}>
                <h4 style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>🔒 Fixed Deposit Collateral Selection</h4>
                <Field label="Select Qualifying Fixed Deposit (Principal ≥ LKR 1,000,000) *">
                  <select
                    required
                    value={selectedFdId ?? ''}
                    onChange={e => {
                      const id = Number(e.target.value);
                      setSelectedFdId(id);
                      const dep = eligibleDeposits.find(d => d.fixedDepositId === id);
                      if (dep) {
                        const maxVal = (Number(dep.principalAmount) / 2).toFixed(2);
                        setAmount(maxVal);
                      }
                    }}
                  >
                    <option value="">-- Select Active Fixed Deposit --</option>
                    {eligibleDeposits.map(d => (
                      <option key={d.fixedDepositId} value={d.fixedDepositId}>
                        FD #{d.fixedDepositId} - LKR {money(d.principalAmount)} ({d.termMonths} Months)
                      </option>
                    ))}
                  </select>
                </Field>
                {eligibleDeposits.length === 0 ? (
                  <p className="fine-print" style={{ color: '#f87171', marginTop: 4 }}>
                    ⚠️ You do not currently have an active Fixed Deposit worth over LKR 1,000,000 to use as collateral.
                  </p>
                ) : (
                  <p className="fine-print" style={{ color: '#93c5fd', marginTop: 4 }}>
                    ℹ️ You can borrow up to 50% of your Fixed Deposit principal. Your FD will be safely frozen as collateral until the loan is fully paid off with interest.
                  </p>
                )}
              </div>
            )}

            <div className="two-column">
              <Field label="Requested amount (LKR)">
                <input
                  required
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="Enter any loan amount (e.g. 500, 1000, 25000, 500000)"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </Field>

              <Field label="Preferred tenure (Months)">
                <select value={tenureMonths} onChange={e => setTenureMonths(e.target.value)}>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                  <option value="36">36 Months (3 Years)</option>
                  <option value="60">60 Months (5 Years)</option>
                  <option value="120">120 Months (10 Years)</option>
                  <option value="240">240 Months (20 Years)</option>
                  <option value="300">300 Months (25 Years)</option>
                </select>
              </Field>
            </div>

            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem', margin: '1.25rem 0 0.75rem', color: '#10b981' }}>
              Financial Scrutiny &amp; CRIB Data
            </h4>

            <div className="two-column">
              <Field label="Basic monthly salary (LKR)">
                <input required type="number" placeholder="e.g. 150000" value={basicSalary} onChange={e => setBasicSalary(e.target.value)} />
              </Field>
              <Field label="Fixed allowances (LKR)">
                <input type="number" placeholder="e.g. 25000" value={fixedAllowances} onChange={e => setFixedAllowances(e.target.value)} />
              </Field>
            </div>

            <div className="two-column">
              <Field label="Existing CRIB monthly loan deductions (LKR)">
                <input type="number" placeholder="e.g. 15000" value={cribDeductions} onChange={e => setCribDeductions(e.target.value)} />
              </Field>
              <Field label="Employment status">
                <select value={employmentStatus} onChange={e => setEmploymentStatus(e.target.value)}>
                  <option value="Permanent">Permanent</option>
                  <option value="Contractual">Contractual</option>
                  <option value="Probationary">Probationary</option>
                </select>
              </Field>
            </div>

            <Field label="Service period (Years)">
              <input type="number" min="0" placeholder="e.g. 3" value={serviceYears} onChange={e => setServiceYears(e.target.value)} />
            </Field>

            {/* VEHICLE LEASING DETAILS BLOCK */}
            {isLeasing && (
              <div style={{ background: 'rgba(16,185,129,0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', margin: '1.25rem 0' }}>
                <h4 style={{ color: '#34d399', marginBottom: '0.75rem' }}>🚗 GreenDrive Vehicle Leasing Details</h4>
                <div className="two-column">
                  <Field label="Vehicle condition">
                    <select value={vehicleCondition} onChange={e => setVehicleCondition(e.target.value)}>
                      <option value="Brand New">Brand New</option>
                      <option value="Unregistered">Unregistered</option>
                      <option value="Reconditioned">Reconditioned</option>
                      <option value="Registered">Registered</option>
                    </select>
                  </Field>
                  <Field label="Year of manufacture">
                    <input type="number" min="2000" max="2026" placeholder="e.g. 2024" value={manufactureYear} onChange={e => setManufactureYear(e.target.value)} />
                  </Field>
                </div>
                <Field label="Valuation amount (LKR)">
                  <input type="number" placeholder="e.g. 8500000" value={valuationAmount} onChange={e => setValuationAmount(e.target.value)} />
                </Field>
                <div className="two-column">
                  <Field label="Chassis number">
                    <input type="text" value={chassisNumber} onChange={e => setChassisNumber(e.target.value)} placeholder="e.g. ZVW50-123456" />
                  </Field>
                  <Field label="Engine number">
                    <input type="text" value={engineNumber} onChange={e => setEngineNumber(e.target.value)} placeholder="e.g. 2ZR-FXE98765" />
                  </Field>
                </div>
              </div>
            )}

            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem', margin: '1.25rem 0 0.75rem', color: '#10b981' }}>
              Credit Documents Upload
            </h4>

            <div className="two-column">
              <Field label="Last 3 months salary slips">
                <input type="file" onChange={e => setSalarySlips(e.target.files?.[0]?.name || '')} />
              </Field>
              <Field label="Last 6 months bank statements">
                <input type="file" onChange={e => setBankStatements(e.target.files?.[0]?.name || '')} />
              </Field>
            </div>
            <Field label="Letter of employment">
              <input type="file" onChange={e => setEmploymentLetter(e.target.files?.[0]?.name || '')} />
            </Field>

            <Field label="Purpose and supporting information">
              <textarea required maxLength={2000} value={info} onChange={e => setInfo(e.target.value)} placeholder="Describe the purpose of your loan..." />
            </Field>

            <div className="callout" style={{ background: 'rgba(245,158,11,0.15)', borderLeft: '4px solid #f59e0b', margin: '1rem 0' }}>
              <strong>Branch Manager Decision:</strong> All loan submissions are reviewed by bank staff and require final approval decision from the Branch Manager.
            </div>

            <button disabled={busy}>{busy ? 'Submitting…' : 'Review CRIB Terms & Submit Application'}</button>
          </form>
        </Panel>

        {/* YOUR APPLICATIONS LIST */}
        <Panel title="Your Applications History">
          {result.loading ? (
            <Loading />
          ) : (
            result.data && (
              <>
                {result.data.content.map(l => (
                  <div key={l.loanId} style={{ marginBottom: '1rem', border: l.status === 'MORE_INFORMATION_REQUIRED' ? '1px solid rgba(245,158,11,0.5)' : '1px solid var(--border)', borderRadius: '12px', padding: '1rem', background: l.status === 'MORE_INFORMATION_REQUIRED' ? 'rgba(245,158,11,0.08)' : 'var(--card-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Link to={`/app/loans/${l.loanId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{l.loanType} · {l.loanNumber || `#${l.loanId}`}</h3>
                        <p style={{ margin: '0.25rem 0', fontWeight: 600 }}>{money(l.amount)}{role !== 'CUSTOMER' ? ` (CIF: ${l.cifNumber || '0000000'})` : ''}</p>
                        <small>{date(l.applyDate)}</small>
                      </Link>
                      <StatusBadge status={l.status} />
                    </div>
                    {l.status === 'MORE_INFORMATION_REQUIRED' && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed rgba(245,158,11,0.3)' }}>
                        <div style={{ fontSize: '0.85rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
                          <strong>⚠️ Staff Request:</strong> {l.additionalInformation || 'Please refill and resubmit application.'}
                        </div>
                        <button
                          className="button primary"
                          style={{ width: '100%', padding: '0.5rem' }}
                          onClick={() => setRefillLoan(l)}
                        >
                          📝 Refill &amp; Resubmit Application
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {!result.data.content.length && <Empty>No loan applications submitted yet.</Empty>}
                <Pagination data={result.data} onPage={setPage} />
              </>
            )
          )}
        </Panel>
      </div>

      {refillLoan && (
        <RefillLoanModal
          loan={refillLoan}
          onClose={() => setRefillLoan(null)}
          onSuccess={() => {
            setRefillLoan(null);
            setRevision(r => r + 1);
            alert('Refilled loan application resubmitted successfully!');
          }}
        />
      )}

      <TermsModal
        type="LOANS"
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={submitApplication}
      />

      {/* LOAN INSTALLMENT PAYMENT MODAL */}
      {payingLoan && (
        <div className="modal-backdrop" onClick={() => setPayingLoan(null)}>
          <div className="glass-card-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <button className="close" onClick={() => setPayingLoan(null)} aria-label="Close">×</button>
            <div className="glass-modal-header">
              <div className="glass-modal-icon debit">💳</div>
              <div>
                <h2>Pay Loan Installment</h2>
                <p>{payingLoan.loanType} · Facility: {payingLoan.loanNumber || `#${payingLoan.loanId}`}</p>
              </div>
            </div>

            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '0.85rem', borderRadius: '8px', margin: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Facility Amount:</span> <strong>{money(payingLoan.amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Paid Amount:</span> <strong style={{ color: '#10b981' }}>{money(payingLoan.paidAmount || '0')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Remaining Balance:</span> <strong style={{ color: '#f59e0b' }}>{money(payingLoan.remainingAmount || payingLoan.amount)}</strong>
              </div>
            </div>

            <form onSubmit={submitLoanPayment} className="glass-modal-form">
              <Field label="Pay From Account *">
                <select
                  required
                  value={payAccountId ?? ''}
                  onChange={e => setPayAccountId(Number(e.target.value))}
                >
                  <option value="">-- Select Source Account --</option>
                  {userAccounts.data?.content.map(a => (
                    <option key={a.accountId} value={a.accountId}>
                      {a.accountNumber} ({a.accountType}) - Balance: LKR {money(a.balance)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Installment Payment Amount (LKR) *">
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="Enter repayment amount..."
                />
              </Field>

              <div className="actions" style={{ marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button type="button" className="secondary" onClick={() => setPayingLoan(null)}>Cancel</button>
                <button type="submit" disabled={payingBusy || !payAmount || !payAccountId}>
                  {payingBusy ? 'Processing Payment…' : 'Confirm Loan Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function LoanDetailsPage() {
  const { id } = useParams();
  const [revision, setRevision] = useState(0);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [refillLoan, setRefillLoan] = useState<Loan | null>(null);

  const result = useApi<Loan>(`/api/loans/${id}`, revision);

  async function action(kind: string) {
    if (kind === 'cancel' && !confirm('Cancel this loan application?')) return;
    setBusy(true);
    setError(null);
    try {
      await send(`/api/loans/${id}/${kind}`, kind === 'information' ? { reason } : undefined, kind === 'cancel' ? 'PUT' : 'POST');
      setReason('');
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading title={`Loan application ${result.data?.loanNumber || `#${id}`}`} actions={<Link className="button secondary" to="/app/loans">All applications</Link>} />
      <ErrorMessage error={error || result.error} />
      {result.loading ? (
        <Loading />
      ) : (
        result.data && (
          <>
            <LoanDetails loan={result.data} />
            {result.data.status === 'MORE_INFORMATION_REQUIRED' && (
              <Panel title="⚠️ Document Corrections / Refill Requested by Bank Officer">
                <div style={{ background: 'rgba(245,158,11,0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #f59e0b' }}>
                  <strong style={{ color: '#f59e0b' }}>Officer Request Notes:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap' }}>{result.data.additionalInformation || 'Staff requested updated documents or corrections.'}</p>
                </div>
                <button className="button primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }} onClick={() => setRefillLoan(result.data)}>
                  📝 Refill &amp; Resubmit Loan Application
                </button>
              </Panel>
            )}
            {['SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED', 'PENDING_MANAGER_REVIEW'].includes(result.data.status) && (
              <button className="secondary danger" disabled={busy} onClick={() => action('cancel')}>
                Cancel application
              </button>
            )}
            {refillLoan && (
              <RefillLoanModal
                loan={refillLoan}
                onClose={() => setRefillLoan(null)}
                onSuccess={() => {
                  setRefillLoan(null);
                  setRevision(r => r + 1);
                  alert('Refilled loan application resubmitted successfully!');
                }}
              />
            )}
          </>
        )
      )}
    </>
  );
}

export function LoanDetails({ loan: l }: { loan: Loan }) {
  const { role } = useAuth();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const userAccounts = useApi<Page<Account>>('/api/accounts');

  // Repayment state inside LoanDetails
  const [paying, setPaying] = useState(false);
  const [payAccountId, setPayAccountId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState(l.remainingAmount || l.amount);
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState<unknown>(null);

  useEffect(() => {
    if (!payAccountId && userAccounts.data?.content.length) {
      setPayAccountId(userAccounts.data.content[0].accountId);
    }
  }, [userAccounts.data, payAccountId]);

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payAccountId || !payAmount) return;
    setPayBusy(true);
    setPayError(null);
    try {
      await send(`/api/loans/${l.loanId}/pay`, {
        accountId: payAccountId,
        amount: Number(payAmount)
      });
      setPaying(false);
      window.location.reload();
    } catch (err) {
      setPayError(err);
    } finally {
      setPayBusy(false);
    }
  }

  return (
    <Panel title={`Facility ${l.loanNumber || `#${l.loanId}`}`}>
      <ErrorMessage error={payError} />
      <div className="details-grid">
        {role !== 'CUSTOMER' && <Detail label="CIF Number">{l.cifNumber || '0000000'}</Detail>}
        <Detail label="Facility Number">{l.loanNumber || `700000${l.loanId}`}</Detail>
        <Detail label="Customer">{l.customer}</Detail>
        <Detail label="Disbursement Account">{l.targetAccountNumber || 'Bank Account'}</Detail>
        <Detail label="Facility Amount">{money(l.amount)}</Detail>
        <Detail label="Paid Amount">{money(l.paidAmount || '0')}</Detail>
        <Detail label="Remaining Balance">{money(l.remainingAmount || l.amount)}</Detail>
        <Detail label="Type">{l.loanType}</Detail>
        <Detail label="Annual rate">{l.interestRate}%</Detail>
        <Detail label="Approved Officer ID">{l.approvedByOfficerId || 'EMP-001 (Bank Officer)'}</Detail>
        {l.approvedByManagerId && <Detail label="Approved Manager ID">{l.approvedByManagerId}</Detail>}
        <Detail label="Status"><StatusBadge status={l.status} /></Detail>
      </div>

      {l.riskLevel && (
        <div style={{
          background: l.riskLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.12)' : l.riskLevel === 'MEDIUM' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          borderLeft: `4px solid ${l.riskLevel === 'HIGH' ? '#ef4444' : l.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981'}`,
          padding: '1rem',
          borderRadius: '12px',
          margin: '1.25rem 0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>🛡️ Advisory Credit Risk Assessment: {l.riskLevel} RISK ({l.riskScore}/100)</strong>
            <span style={{
              background: l.riskLevel === 'HIGH' ? '#ef4444' : l.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>{l.riskLevel}</span>
          </div>
          {l.riskLevel === 'HIGH' && (
            <div style={{ color: '#ef4444', fontWeight: 700, marginTop: '0.5rem' }}>
              ⚠️ HIGH RISK WARNING: Approving a HIGH risk application requires explicit acknowledgement &amp; recorded justification.
            </div>
          )}
          {l.riskFactors && l.riskFactors.length > 0 && (
            <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.9rem' }}>
              {l.riskFactors.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          )}
        </div>
      )}

      <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="button secondary" onClick={() => setShowPdfModal(true)}>
          🖨️ View &amp; Print Application (.PDF)
        </button>

        {l.status === 'APPROVED' && role === 'CUSTOMER' && (
          <button className="button primary" onClick={() => setPaying(true)}>
            💳 Pay Installment / Repay Loan
          </button>
        )}
      </div>

      {paying && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#34d399', marginTop: 0 }}>💳 Pay Loan Installment</h3>
          <form onSubmit={submitPayment}>
            <div className="two-column">
              <Field label="Source Payment Account *">
                <select
                  required
                  value={payAccountId ?? ''}
                  onChange={e => setPayAccountId(Number(e.target.value))}
                >
                  <option value="">-- Select Source Account --</option>
                  {userAccounts.data?.content.map(a => (
                    <option key={a.accountId} value={a.accountId}>
                      {a.accountNumber} ({a.accountType}) - Balance: LKR {money(a.balance)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Payment Amount (LKR) *">
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                />
              </Field>
            </div>

            <div className="actions" style={{ marginTop: '1rem' }}>
              <button disabled={payBusy}>{payBusy ? 'Processing…' : 'Submit Installment Payment'}</button>
              <button type="button" className="secondary" onClick={() => setPaying(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <h3>Application Information &amp; Purpose</h3>
      <p className="preserve-lines">{l.information}</p>

      {l.scrutinyData && (
        <ApplicationDetails data={l.scrutinyData} kind="loan" loanType={l.loanType} />
      )}

      <h3>Decision History &amp; Governance</h3>
      <div className="timeline">
        {l.decisions.map((d, i) => (
          <article key={i}>
            <strong>{d.action.replaceAll('_', ' ')}</strong>
            <small>{d.actor} · {date(d.createdAt)}</small>
            <p>{d.reason}</p>
          </article>
        ))}
      </div>

      {showPdfModal && (
        <ApplicationPdfModal
          loan={l}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </Panel>
  );
}

function loanActions(l: Loan | null, manager: boolean): string[] {
  if (!l) return [];
  if (manager) return l.status === 'PENDING_MANAGER_REVIEW' ? ['approve', 'reject'] : [];
  if (l.status === 'SUBMITTED') return ['review'];
  if (l.status === 'UNDER_REVIEW') return ['request-information', 'recommend', 'reject'];
  return [];
}

export function StaffLoansPage({ manager = false }: { manager?: boolean }) {
  const base = manager ? '/api/manager/loans' : '/api/employee/loans';
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState(manager ? 'PENDING_MANAGER_REVIEW' : 'SUBMITTED');
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<Loan | null>(null);
  const [action, setAction] = useState(manager ? 'approve' : 'review');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  // Open Loan Facility State
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [nicSearch, setNicSearch] = useState('');
  const [searchingNic, setSearchingNic] = useState(false);
  const [searchResult, setSearchResult] = useState<CustomerSearchResult | null>(null);
  const [cifNumber, setCifNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loanType, setLoanType] = useState('SpeedDraft Personal Credit Line');
  const [amount, setAmount] = useState('100000');
  const [termMonths, setTermMonths] = useState('24');
  const [interestRate, setInterestRate] = useState('12.00');
  const [information, setInformation] = useState('');
  const [pdfLoan, setPdfLoan] = useState<Loan | null>(null);

  const result = useApi<Page<Loan>>(`${base}?${query({ page, status })}`, revision);
  const allowed = loanActions(selected, manager);
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

  async function handleProvisionLoan(e: React.FormEvent) {
    e.preventDefault();
    if (!nicSearch.trim()) {
      setError('Please search Customer NIC Number first.');
      return;
    }
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
        amount: Number(amount) || 100000,
        termMonths: Number(termMonths) || 24,
        interestRate: Number(interestRate) || 10.5,
        information: information || 'Credit facility opened by bank staff'
      };
      const createdLoan = await send<Loan>('/api/employee/loans/open', payload, 'POST');
      setShowLoanForm(false);
      setNicSearch('');
      setSearchResult(null);
      setCifNumber('');
      setFullName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setDateOfBirth('');
      setInformation('');
      setRevision(r => r + 1);
      setPdfLoan(createdLoan);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function decide(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!confirm(`Record this ${action.replaceAll('-', ' ')} decision?`)) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await send<Loan>(`${base}/${selected.loanId}/${action}`, { reason });
      setSelected(updated);
      setAction(loanActions(updated, manager)[0] || '');
      setReason('');
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
        title={manager ? 'Loan decisions' : 'Loan review'}
        subtitle={manager ? 'Final decisions on staff-recommended applications.' : 'Review submissions, request information, and make recommendations.'}
        actions={
          <button
            className="button"
            style={{ background: showLoanForm ? '#64748b' : '#059669' }}
            onClick={() => setShowLoanForm(!showLoanForm)}
          >
            {showLoanForm ? 'Close Form' : '+ Open Loan / Credit Facility for Customer'}
          </button>
        }
      />

      <ErrorMessage error={error || result.error} />

      {/* LOAN PROVISIONING FORM WITH NIC SEARCH */}
      {showLoanForm && (
        <Panel title="Loan & Credit Facility Provisioning Form" className="glass-card">
          <form onSubmit={handleProvisionLoan}>
            {/* STEP 1: NIC SEARCH */}
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

            {/* STEP 2: CUSTOMER CIF & DETAILS */}
            <div className="glass-card" style={{ background: 'var(--surface-primary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--ink)', fontSize: '1.05rem' }}>Step 2: Customer CIF &amp; Identification Data</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <Field label="Customer CIF Number *">
                  <input
                    type="text"
                    required
                    readOnly
                    value={cifNumber}
                    style={{ background: 'var(--card-subtle)', color: 'var(--color-gold-primary)', fontWeight: 700, fontFamily: 'monospace' }}
                  />
                </Field>
                <Field label="Full Name (Letters and spaces only) *">
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value.replace(/[^a-zA-Z\s.'-]/g, ''))} />
                </Field>
                <Field label="Registered Email *">
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                </Field>
                <Field label="Mobile Phone (Digits only) *">
                  <input type="text" required value={phone} onChange={e => setPhone(e.target.value.replace(/[a-zA-Z]/g, '').replace(/[^0-9+]/g, ''))} />
                </Field>
                <Field label="Date of Birth *">
                  <input type="date" required max={todayStr} value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                </Field>
                <Field label="Address *">
                  <input type="text" required value={address} onChange={e => setAddress(e.target.value)} />
                </Field>
              </div>
            </div>

            {/* STEP 3: LOAN DETAILS */}
            <div className="glass-card" style={{ background: 'var(--surface-primary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--ink)', fontSize: '1.05rem' }}>Step 3: Credit Facility Terms</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <Field label="Loan Type Tier">
                  <select value={loanType} onChange={e => setLoanType(e.target.value)}>
                    {['SpeedDraft Personal Credit Line', 'Serendib Home Premium Loan', 'Nena Haras Higher Education Loan', 'Serendib Agri Enterprise Growth Loan', 'Viyaparika Diriya SME Business Expansion Loan', 'GreenDrive EV & Solar Vehicle Loan'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Facility Amount (LKR) *">
                  <input type="number" step="any" min="0.01" required placeholder="Enter any numerical loan amount" value={amount} onChange={e => setAmount(e.target.value)} />
                </Field>
                <Field label="Tenure Period (Months) *">
                  <input type="number" min="6" max="360" required value={termMonths} onChange={e => setTermMonths(e.target.value)} />
                </Field>
                <Field label="Interest Rate (%) *">
                  <input type="number" min="1.0" max="30.0" step="0.25" required value={interestRate} onChange={e => setInterestRate(e.target.value)} />
                </Field>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Facility Scrutiny Notes">
                    <textarea value={information} onChange={e => setInformation(e.target.value)} placeholder="Enter assessment or income evaluation notes..." />
                  </Field>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button disabled={busy} className="button" style={{ background: '#059669' }}>
                {busy ? 'Processing...' : 'Complete Loan Facility Opening'}
              </button>
              <button type="button" className="button secondary" onClick={() => setShowLoanForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      )}

      <Field label="Queue">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); setSelected(null); }}>
          {['SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED', 'PENDING_MANAGER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>

      {result.loading ? (
        <Loading />
      ) : (
        result.data && (
          <Panel className="glass-card">
            {result.data.content.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Application</th>
                      <th>CIF No</th>
                      <th><Text value={"Customer"} /></th>
                      <th><Text value={"Amount"} /></th>
                      <th><Text value={"Status"} /></th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.content.map(l => (
                      <tr key={l.loanId}>
                        <td>{l.loanNumber || `#${l.loanId}`} · {l.loanType}</td>
                        <td><strong>{l.cifNumber || '0000000'}</strong></td>
                        <td>{l.customer}</td>
                        <td>{money(l.amount)}</td>
                        <td><StatusBadge status={l.status} /></td>
                        <td>
                          <button className="secondary" onClick={() => { setSelected(l); setReason(''); setAction(loanActions(l, manager)[0] || ''); }}>
                            <Text value={"Open"} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No applications in this queue.</Empty>
            )}
            <Pagination data={result.data} onPage={setPage} />
          </Panel>
        )
      )}

      {selected && (
        <>
          <LoanDetails loan={selected} />
          <Panel title="Record a decision" className="glass-card">
            <form onSubmit={decide}>
              <Field label="Action">
                <select value={action} onChange={e => setAction(e.target.value)}>
                  {allowed.map(a => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </Field>
              <Field label="Reason / message to customer">
                <textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} />
              </Field>
              <button disabled={busy}>{busy ? 'Recording…' : 'Record decision'}</button>
            </form>
            <p className="fine-print">
              Only valid workflow transitions are allowed. A staff reviewer cannot make the manager’s final decision on the same application.
            </p>
          </Panel>
        </>
      )}

      {pdfLoan && <ApplicationPdfModal loan={pdfLoan} onClose={() => setPdfLoan(null)} />}
    </>
  );
}
