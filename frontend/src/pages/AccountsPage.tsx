import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useApi, Heading, Panel, Field, ErrorMessage, Loading, StatusBadge, Pagination, Detail, Empty } from '../components/ui';
import { money, date, send, downloadPdf } from '../api/client';
import type { Account, Page } from '../types/api';
import { TermsModal } from '../components/TermsModal';
import { ApplicationPdfModal } from '../components/ApplicationPdfModal';
import { ApplicationDetails } from '../components/ApplicationDetails';
import { useAuth } from '../auth/AuthProvider';

const ACCOUNT_TYPES = [
  'Serendib Prime Investor Savings',
  'YouthWave Digital Account',
  'Ranbima Senior Citizens Scheme',
  'Serendib Personal RFC',
  'Liya Saviya Ladies Savings Account',
  'Serendib Dynamic Corporate Current Account',
  'SmartBiz Sole Proprietor Current Account'
];

export function AccountsPage() {
  const { role } = useAuth();
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [settingPrimary, setSettingPrimary] = useState<number | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Form State
  const [accountType, setAccountType] = useState(ACCOUNT_TYPES[0]);
  const [fullName, setFullName] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('Sri Lankan');
  const [gender, setGender] = useState('Male');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [occupationType, setOccupationType] = useState('Salaried');
  const [employerName, setEmployerName] = useState('');
  const [monthlyAverageIncome, setMonthlyAverageIncome] = useState('100K-500K');
  const [sourceOfFunds, setSourceOfFunds] = useState('Salary');
  const [fatcaCompliance, setFatcaCompliance] = useState(false);
  const [pepDeclaration, setPepDeclaration] = useState(false);
  const [nicFront, setNicFront] = useState('');
  const [nicBack, setNicBack] = useState('');
  const [addressDoc, setAddressDoc] = useState('');

  const { data, error: loadError, loading } = useApi<Page<Account>>(`/api/accounts?page=${page}`, revision);

  async function handleSetPrimary(id: number, e?: React.MouseEvent) {
    e?.stopPropagation();
    e?.preventDefault();
    setSettingPrimary(id);
    setError(null);
    try {
      await send(`/api/accounts/${id}/primary`, undefined, 'POST');
      setRevision(r => r + 1);
    } catch (err) {
      setError(err);
    } finally {
      setSettingPrimary(null);
    }
  }

  function resetFormFields() {
    setAccountType(ACCOUNT_TYPES[0]);
    setFullName('');
    setNicNumber('');
    setDateOfBirth('');
    setNationality('Sri Lankan');
    setGender('Male');
    setPermanentAddress('');
    setCurrentAddress('');
    setMobileNumber('');
    setEmailAddress('');
    setOccupationType('Salaried');
    setEmployerName('');
    setMonthlyAverageIncome('100K-500K');
    setSourceOfFunds('Salary');
    setFatcaCompliance(false);
    setPepDeclaration(false);
    setNicFront('');
    setNicBack('');
    setAddressDoc('');
  }

  function openTerms(e: React.FormEvent) {
    e.preventDefault();
    if (dateOfBirth && dateOfBirth > todayStr) {
      setError('Date of birth cannot be in the future.');
      return;
    }
    if (/[0-9]/.test(fullName) || (fullName.trim() && !/^[a-zA-Z\s.'-]+$/.test(fullName.trim()))) {
      setError('Full name cannot contain numbers or special characters.');
      return;
    }
    if (/[a-zA-Z]/.test(mobileNumber)) {
      setError('Mobile phone number cannot contain letters.');
      return;
    }
    if (!nicFront.trim() || !nicBack.trim() || !addressDoc.trim()) {
      setError('Must add all three required documents (NIC Front, NIC Back, and Address Verification document) to proceed.');
      return;
    }
    setError(null);
    setShowTerms(true);
  }

  async function submitApplication() {
    setBusy(true);
    setError(null);
    try {
      await send('/api/accounts/apply', {
        accountType,
        fullName,
        nicNumber,
        dateOfBirth,
        nationality,
        gender,
        permanentAddress,
        currentAddress,
        mobileNumber,
        emailAddress,
        occupationType,
        employerName,
        monthlyAverageIncome,
        sourceOfFunds,
        fatcaCompliance,
        pepDeclaration,
        nicFrontUpload: nicFront,
        nicBackUpload: nicBack,
        addressDocUpload: addressDoc
      });
      
      resetFormFields();
      setShowForm(false);
      setRevision(r => r + 1);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const isCurrentAccount = accountType.includes('Current') || accountType.includes('Corporate') || accountType.includes('SmartBiz');

  return (
    <>
      <Heading
        title="Your accounts"
        subtitle="Manage your active accounts and apply for new savings or corporate current accounts."
        icon="/images/page-icons/accounts.png"
        actions={
          <button className="button" onClick={() => {
            if (!showForm) resetFormFields();
            setShowForm(!showForm);
          }}>
            {showForm ? 'Close form' : '+ Apply for new account'}
          </button>
        }
      />

      <ErrorMessage error={error || loadError} />

      {showForm && (
        <Panel title="Customer Account Opening Application Form">
          <form onSubmit={openTerms}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#10b981' }}>
              1. Product Selection
            </h3>
            <Field label="Account product tier">
              <select value={accountType} onChange={e => setAccountType(e.target.value)}>
                {ACCOUNT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>

            {isCurrentAccount && (
              <div className="callout" style={{ background: 'rgba(245,158,11,0.15)', borderLeft: '4px solid #f59e0b', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.25rem' }}>
                <strong>Branch Manager Approval Required:</strong> Under CBSL guidelines, all Corporate and SmartBiz Current Account applications require final approval from the Branch Manager before becoming active.
              </div>
            )}

            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: '1.5rem 0 1rem', color: '#10b981' }}>
              2. Core Identity & KYC Block
            </h3>
            <div className="two-column">
              <Field label="Full name (Letters and spaces only, no numbers)">
                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value.replace(/[^a-zA-Z\s.'-]/g, ''))} placeholder="e.g. Tharindu Lakshan Wijerathna" />
              </Field>
              <Field label="NIC number (9-digit+V or 12-digit max)">
                <input required type="text" maxLength={12} value={nicNumber} onChange={e => setNicNumber(e.target.value.slice(0, 12))} placeholder="e.g. 199812345678 or 981234567V" />
              </Field>
            </div>

            <div className="two-column">
              <Field label="Date of birth (Future dates blocked)">
                <input
                  required
                  type="date"
                  max={todayStr}
                  value={dateOfBirth}
                  onChange={e => {
                    if (e.target.value > todayStr) {
                      setError('Date of birth cannot be in the future.');
                    } else {
                      setError(null);
                      setDateOfBirth(e.target.value);
                    }
                  }}
                />
              </Field>
              <Field label="Nationality">
                <select value={nationality} onChange={e => setNationality(e.target.value)}>
                  <option value="Sri Lankan">Sri Lankan</option>
                  <option value="Dual Citizen">Dual Citizen</option>
                  <option value="Foreign National">Foreign National</option>
                </select>
              </Field>
            </div>

            <div className="two-column">
              <Field label="Gender">
                <select value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Mobile number (Digits only, no letters)">
                <input required type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value.replace(/[a-zA-Z]/g, '').replace(/[^0-9+]/g, ''))} placeholder="+94771234567" />
              </Field>
            </div>

            <Field label="Email address (Verification required)">
              <input required type="email" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} placeholder="name@example.com" />
            </Field>

            <Field label="Permanent address">
              <input required type="text" value={permanentAddress} onChange={e => setPermanentAddress(e.target.value)} placeholder="No. 123, Main Street, Colombo 03" />
            </Field>

            <Field label="Current residential address">
              <input required type="text" value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} placeholder="Same as above or temporary residence" />
            </Field>

            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: '1.5rem 0 1rem', color: '#10b981' }}>
              3. Employment & Source of Funds
            </h3>
            <div className="two-column">
              <Field label="Occupation type">
                <select value={occupationType} onChange={e => setOccupationType(e.target.value)}>
                  <option value="Salaried">Salaried Employee</option>
                  <option value="Self-Employed">Self-Employed Entrepreneur</option>
                  <option value="Student">Student</option>
                  <option value="Unemployed">Unemployed / Homemaker</option>
                  <option value="Retired">Retired</option>
                </select>
              </Field>
              <Field label="Employer / business name">
                <input type="text" value={employerName} onChange={e => setEmployerName(e.target.value)} placeholder="e.g. Virtusa / Self Business" />
              </Field>
            </div>

            <div className="two-column">
              <Field label="Monthly average income">
                <select value={monthlyAverageIncome} onChange={e => setMonthlyAverageIncome(e.target.value)}>
                  <option value="< LKR 50K">&lt; LKR 50,000</option>
                  <option value="50K-100K">LKR 50,000 - 100,000</option>
                  <option value="100K-500K">LKR 100,000 - 500,000</option>
                  <option value="> 500K">&gt; LKR 500,000</option>
                </select>
              </Field>
              <Field label="Primary source of funds">
                <select value={sourceOfFunds} onChange={e => setSourceOfFunds(e.target.value)}>
                  <option value="Salary">Salary / Employment Income</option>
                  <option value="Business Profit">Business Profit</option>
                  <option value="Remittance">Foreign Remittance</option>
                  <option value="Inheritance">Inheritance / Investments</option>
                </select>
              </Field>
            </div>

            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: '1.5rem 0 1rem', color: '#10b981' }}>
              4. KYC Document Verification Files (All 3 Documents Required)
            </h3>
            <div className="two-column">
              <Field label="NIC Front Image / PDF *">
                <input required type="file" onChange={e => setNicFront(e.target.files?.[0]?.name || '')} />
              </Field>
              <Field label="NIC Back Image / PDF *">
                <input required type="file" onChange={e => setNicBack(e.target.files?.[0]?.name || '')} />
              </Field>
            </div>

            <Field label="Address Verification Document (Utility bill within 3 months) *">
              <input required type="file" onChange={e => setAddressDoc(e.target.files?.[0]?.name || '')} />
            </Field>

            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: '1.5rem 0 1rem', color: '#10b981' }}>
              5. Regulatory Declarations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={fatcaCompliance} onChange={e => setFatcaCompliance(e.target.checked)} />
                <span><strong>FATCA Compliance:</strong> I certify that I am NOT a US citizen or US tax resident.</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={pepDeclaration} onChange={e => setPepDeclaration(e.target.checked)} />
                <span><strong>PEP Declaration:</strong> I declare that I am NOT a Politically Exposed Person.</span>
              </label>
            </div>

            <button disabled={busy}>Proceed to Review Terms & Submit</button>
          </form>
        </Panel>
      )}

      {loading ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="account-grid">
              {data.content.map(a => (
                <Link className="account-card" key={a.accountId} to={`/app/accounts/${a.accountId}`}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span>{a.accountType}</span>
                    <StatusBadge status={a.status} />
                    {a.isPrimary && (
                      <span className="badge" style={{ background: 'var(--color-primary-bg, #e0e7ff)', color: 'var(--color-primary, #3730a3)', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginLeft: 'auto' }}>
                        ⭐ Primary
                      </span>
                    )}
                  </div>
                  <strong>{a.status === 'ACTIVE' ? money(a.balance) : '—'}</strong>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <small style={{ display: 'block' }}>Account No: <strong>{a.accountNumber || 'Pending Provisioning'}</strong></small>
                    {role !== 'CUSTOMER' && (
                      <small style={{ display: 'block', color: '#38bdf8' }}>CIF No: <strong>{a.cifNumber || '0000000'}</strong></small>
                    )}
                  </div>
                  {a.rejectionReason && (
                    <small style={{ color: '#ef4444', display: 'block', marginTop: '0.4rem' }}>
                      Rejection Reason: {a.rejectionReason}
                    </small>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span className="account-arrow">View details</span>
                    {a.status === 'ACTIVE' && !a.isPrimary && (
                      <button
                        type="button"
                        className="button secondary small-btn"
                        disabled={settingPrimary === a.accountId}
                        onClick={e => handleSetPrimary(a.accountId, e)}
                        style={{ fontSize: '0.9rem', padding: '6px 14px' }}
                      >
                        {settingPrimary === a.accountId ? 'Setting…' : 'Set as Primary'}
                      </button>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {!data.content.length && (
              <Empty>No accounts are linked to your profile. Click "+ Apply for new account" above to request a new account.</Empty>
            )}

            <Pagination data={data} onPage={setPage} />
          </>
        )
      )}

      <TermsModal
        type="ACCOUNTS"
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={submitApplication}
      />
    </>
  );
}

export function AccountDetailsPage() {
  const { role } = useAuth();
  const { id } = useParams();
  const { data: a, error, loading } = useApi<Account>(`/api/accounts/${id}`);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [settingPrimary, setSettingPrimary] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  async function handleSetPrimary() {
    if (!a) return;
    setSettingPrimary(true);
    setUpdateMsg(null);
    try {
      await send(`/api/accounts/${a.accountId}/primary`, undefined, 'POST');
      setUpdateMsg('Account set as Primary Account successfully.');
      a.isPrimary = true;
    } catch (err) {
      console.error(err);
    } finally {
      setSettingPrimary(false);
    }
  }

  return (
    <>
      <Heading title="Account details" actions={<Link className="button secondary" to="/app/accounts">All accounts</Link>} />
      <ErrorMessage error={error} />
      {updateMsg && (
        <div className="callout" style={{ background: 'var(--color-success-bg, #e6f4ea)', color: 'var(--color-success, #137333)', marginBottom: '16px', padding: '12px' }}>
          ✓ {updateMsg}
        </div>
      )}
      {loading ? (
        <Loading />
      ) : (
        a && (
          <>
            <Panel>
              <div className="balance-hero">
                <span>Available balance</span>
                <h2>{a.status === 'ACTIVE' ? money(a.availableBalance) : 'Pending Approval'}</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <StatusBadge status={a.status} />
                  {a.isPrimary && (
                    <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.8rem' }}>
                      ⭐ Primary Account
                    </span>
                  )}
                </div>
              </div>

              <div className="details-grid">
                {role !== 'CUSTOMER' && <Detail label="CIF Number">{a.cifNumber || '0000000'}</Detail>}
                <Detail label="Account number">{a.accountNumber || 'Pending Provisioning'}</Detail>
                <Detail label="Account type">{a.accountType}</Detail>
                <Detail label="Current balance">{a.status === 'ACTIVE' ? money(a.balance) : '—'}</Detail>
                <Detail label="Opened">{a.openDate ? date(a.openDate) : 'Pending'}</Detail>
                <Detail label="Approved Officer ID">{a.approvedByOfficerId || 'EMP-001 (Bank Officer)'}</Detail>
                {a.approvedByManagerId && <Detail label="Approved Manager ID">{a.approvedByManagerId}</Detail>}
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button className="button secondary" onClick={() => setShowPdfModal(true)}>
                  🖨️ View & Print Application (.PDF)
                </button>
                <button
                  type="button"
                  className="button secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => downloadPdf(`/api/accounts/${a.accountId}/statement.pdf`, `statement-${a.accountId}.pdf`, `Serendib Smart Bank Account Statement for Account #${a.accountNumber}`)}
                >
                  📄 Download Monthly Statement (.PDF)
                </button>
                {a.status === 'ACTIVE' && !a.isPrimary && (
                  <button className="button secondary" disabled={settingPrimary} onClick={handleSetPrimary}>
                    {settingPrimary ? 'Setting…' : '⭐ Set as Primary Account'}
                  </button>
                )}
              </div>

              {a.kycData && (
                <ApplicationDetails data={a.kycData} kind="account" title="Submitted Application Information" />
              )}

              {a.status === 'ACTIVE' && (
                <div className="actions" style={{ marginTop: '1.5rem' }}>
                  <Link className="button" to="/app/transfers">Make a transfer</Link>
                  <Link className="button secondary" to="/app/transactions">View transactions</Link>
                </div>
              )}
            </Panel>

            {showPdfModal && (
              <ApplicationPdfModal
                account={a}
                onClose={() => setShowPdfModal(false)}
              />
            )}
          </>
        )
      )}
    </>
  );
}

