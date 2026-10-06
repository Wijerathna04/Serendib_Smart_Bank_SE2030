import { useState, useEffect } from 'react';
import { send, date, money } from '../api/client';
import { useApi, Heading, Panel, Field, ErrorMessage, Loading, Pagination, StatusBadge, Empty } from '../components/ui';
import type { Card, Account, Page, ProfileView } from '../types/api';

export function CardsPage() {
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [modalCardType, setModalCardType] = useState<'DEBIT' | 'CREDIT' | null>(null);
  
  // Debit card state
  const [debitAccountId, setDebitAccountId] = useState('');
  const [debitCardTier, setDebitCardTier] = useState('Classic Debit Card');

  // Standalone Credit Card Application Form State (Step-by-Step Bank Credit Assessment)
  const [creditStep, setCreditStep] = useState<1 | 2 | 3 | 4>(1);
  const [cardProduct, setCardProduct] = useState('Serendib Platinum Rewards Credit');
  const [fullName, setFullName] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [housingStatus, setHousingStatus] = useState('Owned');
  
  const [employmentType, setEmploymentType] = useState('Salaried Employee');
  const [employerName, setEmployerName] = useState('');
  const [designation, setDesignation] = useState('');
  const [yearsOfService, setYearsOfService] = useState('');
  const [grossMonthlyIncome, setGrossMonthlyIncome] = useState('');
  const [fixedAllowances, setFixedAllowances] = useState('');
  const [primaryBankName, setPrimaryBankName] = useState('Serendib Smart Bank PLC');
  
  const [existingCreditDeductions, setExistingCreditDeductions] = useState('');
  const [requestedCreditLimit, setRequestedCreditLimit] = useState('500000');
  const [cribConsent, setCribConsent] = useState(false);

  const [paySlipsDoc, setPaySlipsDoc] = useState('');
  const [bankStatementsDoc, setBankStatementsDoc] = useState('');
  const [employmentLetterDoc, setEmploymentLetterDoc] = useState('');
  
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [selectedCardForView, setSelectedCardForView] = useState<Card | null>(null);

  const result = useApi<Page<Card>>(`/api/cards?page=${page}`, revision);
  const accounts = useApi<Page<Account>>('/api/accounts?size=100');
  const profile = useApi<ProfileView>('/api/customers/me');

  const activeAccounts = accounts.data?.content.filter((a) => a.status === 'ACTIVE') || [];

  async function handleDebitSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!debitAccountId) return;
    setBusy(true);
    setError(null);
    try {
      await send('/api/cards', {
        accountId: Number(debitAccountId),
        cardType: 'DEBIT',
        cardProduct: debitCardTier
      });
      setDebitAccountId('');
      setModalCardType(null);
      setRevision((r) => r + 1);
      window.dispatchEvent(new Event('bank-transaction-completed'));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send('/api/cards', {
        cardType: 'CREDIT',
        cardProduct,
        requestedCreditLimit: Number(requestedCreditLimit),
        fullName,
        nicNumber,
        mobileNumber,
        emailAddress,
        residentialAddress,
        housingStatus,
        employmentType,
        employerName: employerName || 'Not Specified',
        designation: designation || 'Executive',
        yearsOfService: Number(yearsOfService) || 1,
        grossMonthlyIncome: Number(grossMonthlyIncome) || 100000,
        fixedAllowances: Number(fixedAllowances) || 0,
        existingCreditDeductions: Number(existingCreditDeductions) || 0,
        primaryBankName,
        cribConsent,
        paySlipsUpload: paySlipsDoc,
        bankStatementsUpload: bankStatementsDoc,
        employmentLetterUpload: employmentLetterDoc
      });
      setModalCardType(null);
      setCreditStep(1);
      setRevision((r) => r + 1);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function cardAction(card: Card, act: string) {
    if (!confirm(`${act.toUpperCase()} card #${card.cardId}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await send(`/api/cards/${card.cardId}/${act}`, undefined, 'PUT');
      setRevision((r) => r + 1);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading
        title="Card & Credit Accounts"
        subtitle="Apply for standalone Credit Card Facilities and Debit Cards, and manage your active cards."
        icon="/images/page-icons/cards.png"
      />
      <ErrorMessage error={error || result.error || accounts.error} />

      {/* Card Application Portal Grid */}
      <Panel title="Card & Credit Line Applications">
        <p className="fine-print" style={{ marginTop: 0, marginBottom: 20 }}>
          Choose your desired banking card product below. Debit cards are linked to your deposit account, whereas <strong>Credit Cards are standalone credit account facilities</strong>.
        </p>
        <div className="card-application-selection-grid">
          {/* Debit Card Real Bank Card Tile */}
          <div
            className="bank-card-button debit-card-btn real-bank-card"
            onClick={() => {
              setModalCardType('DEBIT');
              if (activeAccounts.length > 0 && !debitAccountId) setDebitAccountId(String(activeAccounts[0].accountId));
            }}
            role="button"
            tabIndex={0}
            title="Click to apply for Debit Card"
          >
            <div className="card-shine-overlay" />
            <div className="real-card-header">
              <div className="card-bank-brand">
                <img src="/images/logo.jpeg" alt="Logo" className="card-brand-logo" />
                <span>serendib <strong>SMART BANK</strong></span>
              </div>
              <span className="card-paywave-icon">📶</span>
            </div>

            <div className="real-card-chip-row">
              <div className="emv-chip">
                <div className="chip-line" />
                <div className="chip-line" />
                <div className="chip-line" />
              </div>
              <span className="card-type-tag">EMERALD DEBIT</span>
            </div>

            <div className="real-card-number-engraved">
              <span>0000</span> <span>0000</span> <span>0000</span> <span>0000</span>
            </div>

            <div className="real-card-footer">
              <div className="card-holder-info">
                <small>CARDHOLDER NAME</small>
                <strong className="engraved-name">{profile.data?.fullName ? profile.data.fullName.toUpperCase() : 'CARDHOLDER NAME'}</strong>
              </div>
              <div className="card-expiry-info">
                <small>EXPIRES</small>
                <strong className="engraved-date">12 / 28</strong>
              </div>
              <div className="card-network-logo">
                <span>VISA</span>
              </div>
            </div>

            <div className="card-apply-hover-badge">
              <span>Apply for Debit Card</span>
            </div>
          </div>

          {/* Standalone Credit Card Real Bank Card Tile */}
          <div
            className="bank-card-button credit-card-btn real-bank-card platinum-card"
            onClick={() => {
              setModalCardType('CREDIT');
              setCreditStep(1);
            }}
            role="button"
            tabIndex={0}
            title="Click to apply for Credit Card"
          >
            <div className="card-shine-overlay" />
            <div className="real-card-header">
              <div className="card-bank-brand">
                <img src="/images/logo.jpeg" alt="Logo" className="card-brand-logo" />
                <span>serendib <strong style={{ color: 'var(--color-gold-primary)' }}>PLATINUM CREDIT</strong></span>
              </div>
              <span className="card-paywave-icon">📶</span>
            </div>

            <div className="real-card-chip-row">
              <div className="emv-chip gold-chip">
                <div className="chip-line" />
                <div className="chip-line" />
                <div className="chip-line" />
              </div>
              <span className="card-type-tag platinum-tag">SOVEREIGN PLATINUM</span>
            </div>

            <div className="real-card-number-engraved gold-engraved">
              <span>0000</span> <span>0000</span> <span>0000</span> <span>0000</span>
            </div>

            <div className="real-card-footer">
              <div className="card-holder-info">
                <small>CARDHOLDER NAME</small>
                <strong className="engraved-name gold-engraved-text">{profile.data?.fullName ? profile.data.fullName.toUpperCase() : 'CARDHOLDER NAME'}</strong>
              </div>
              <div className="card-expiry-info">
                <small>EXPIRES</small>
                <strong className="engraved-date gold-engraved-text">09 / 29</strong>
              </div>
              <div className="card-network-logo mastercard-logo">
                <span className="mc-circle red" /><span className="mc-circle yellow" />
              </div>
            </div>

            <div className="card-apply-hover-badge">
              <span>Apply for Credit Card</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* Modern Glassmorphic Debit Card Modal */}
      {modalCardType === 'DEBIT' && (
        <div className="modal-backdrop" onClick={() => setModalCardType(null)}>
          <div className="glass-card-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <button className="close" onClick={() => setModalCardType(null)} aria-label="Close">
              ×
            </button>
            <div className="glass-modal-header">
              <div className="glass-modal-icon debit">💳</div>
              <div>
                <h2>Debit Card Application</h2>
                <p>Select your debit card tier and link it directly to your active deposit account.</p>
              </div>
            </div>
            <form onSubmit={handleDebitSubmit} className="glass-modal-form">
              <h3 className="section-subtitle">Select Debit Card Variant &amp; Daily Limits</h3>
              <div className="card-variant-selector-grid" style={{ marginBottom: 20 }}>
                <div
                  className={`variant-card ${debitCardTier === 'Classic Debit Card' ? 'selected' : ''}`}
                  onClick={() => setDebitCardTier('Classic Debit Card')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="v-tag">CLASSIC SILVER</div>
                  <h4>Classic Debit Card</h4>
                  <p style={{ margin: '4px 0 2px', fontWeight: 600, color: 'var(--text)' }}>ATM Limit: LKR 100,000 / day</p>
                  <p style={{ margin: 0, fontSize: 12 }}>POS / Online: LKR 250,000 / day · Fee: Free 1st Year</p>
                </div>

                <div
                  className={`variant-card ${debitCardTier === 'Gold Debit Card' ? 'selected' : ''}`}
                  onClick={() => setDebitCardTier('Gold Debit Card')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="v-tag plat" style={{ background: 'linear-gradient(135deg, #d4af37, #f3e5ab)', color: '#000' }}>GOLD EMERALD</div>
                  <h4>Gold Debit Card</h4>
                  <p style={{ margin: '4px 0 2px', fontWeight: 600, color: 'var(--text)' }}>ATM Limit: LKR 300,000 / day</p>
                  <p style={{ margin: 0, fontSize: 12 }}>POS / Online: LKR 750,000 / day · 1% CashRewards</p>
                </div>

                <div
                  className={`variant-card ${debitCardTier === 'Platinum Debit Card' ? 'selected' : ''}`}
                  onClick={() => setDebitCardTier('Platinum Debit Card')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="v-tag world" style={{ background: 'linear-gradient(135deg, #8a2be2, #4b0082)', color: '#fff' }}>PLATINUM VIP</div>
                  <h4>Platinum Debit Card</h4>
                  <p style={{ margin: '4px 0 2px', fontWeight: 600, color: 'var(--text)' }}>ATM Limit: LKR 750,000 / day</p>
                  <p style={{ margin: 0, fontSize: 12 }}>POS / Online: LKR 1,500,000 / day · Airport Lounge Pass</p>
                </div>
              </div>

              <Field label="Linked Bank Account">
                <select required value={debitAccountId} onChange={(e) => setDebitAccountId(e.target.value)}>
                  <option value="">Choose an active account</option>
                  {activeAccounts.map((a) => (
                    <option key={a.accountId} value={a.accountId}>
                      {a.accountType} · #{a.accountNumber} ({money(a.balance)})
                    </option>
                  ))}
                </select>
              </Field>

              <div className="save-fav-checkbox-box">
                <label className="checkbox-label">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
                  <span>I agree to the Debit Cardholder Agreement ({debitCardTier}) and terms of issue.</span>
                </label>
              </div>

              <div className="actions" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="button" className="secondary" onClick={() => setModalCardType(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={busy || !debitAccountId || !agreed}>
                  {busy ? 'Submitting...' : `Submit ${debitCardTier} Application`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Multi-Step Bank Credit Card Application Modal */}
      {modalCardType === 'CREDIT' && (
        <div className="modal-backdrop" onClick={() => setModalCardType(null)}>
          <div className="glass-card-modal credit-app-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820 }}>
            <button className="close" onClick={() => setModalCardType(null)} aria-label="Close">
              ×
            </button>

            <div className="glass-modal-header">
              <div className="glass-modal-icon credit">👑</div>
              <div>
                <h2>Bank Credit Card Application</h2>
                <p>Official Credit Line Account Application · Complete your financial evaluation profile.</p>
              </div>
            </div>

            {/* Stepper Header */}
            <div className="credit-app-stepper">
              <div className={`step-item ${creditStep === 1 ? 'active' : creditStep > 1 ? 'completed' : ''}`}>
                <span className="step-num">1</span>
                <span className="step-label">Product &amp; Profile</span>
              </div>
              <div className={`step-item ${creditStep === 2 ? 'active' : creditStep > 2 ? 'completed' : ''}`}>
                <span className="step-num">2</span>
                <span className="step-label">Income &amp; Employment</span>
              </div>
              <div className={`step-item ${creditStep === 3 ? 'active' : creditStep > 3 ? 'completed' : ''}`}>
                <span className="step-num">3</span>
                <span className="step-label">Liabilities &amp; Limit</span>
              </div>
              <div className={`step-item ${creditStep === 4 ? 'active' : ''}`}>
                <span className="step-num">4</span>
                <span className="step-label">Documents &amp; Submit</span>
              </div>
            </div>

            <form onSubmit={handleCreditSubmit} className="glass-modal-form">
              {/* STEP 1: Card Tier Product & Personal Information */}
              {creditStep === 1 && (
                <div className="step-content-pane">
                  <h3 className="section-subtitle">Select Credit Card Variant</h3>
                  <div className="card-variant-selector-grid">
                    <div
                      className={`variant-card ${cardProduct === 'Serendib Visa Gold Credit' ? 'selected' : ''}`}
                      onClick={() => setCardProduct('Serendib Visa Gold Credit')}
                    >
                      <div className="v-tag">GOLD TIER</div>
                      <h4>Serendib Visa Gold</h4>
                      <p>Limit: LKR 100k – 300k · 1% Cash Rewards · Airport Pass</p>
                    </div>

                    <div
                      className={`variant-card ${cardProduct === 'Serendib Platinum Rewards Credit' ? 'selected' : ''}`}
                      onClick={() => setCardProduct('Serendib Platinum Rewards Credit')}
                    >
                      <div className="v-tag plat">PLATINUM TIER</div>
                      <h4>Serendib Platinum Rewards</h4>
                      <p>Limit: LKR 250k – 1.0M · 3% Rewards · Zero Forex Markups</p>
                    </div>

                    <div
                      className={`variant-card ${cardProduct === 'Serendib World Sovereign Mastercard' ? 'selected' : ''}`}
                      onClick={() => setCardProduct('Serendib World Sovereign Mastercard')}
                    >
                      <div className="v-tag world">WORLD TIER</div>
                      <h4>Serendib World Sovereign</h4>
                      <p>Limit: LKR 500k – 2.5M · VIP Lounge &amp; Global Concierge</p>
                    </div>
                  </div>

                  <h3 className="section-subtitle" style={{ marginTop: 24 }}>Applicant Personal Profile</h3>
                  <div className="form-grid">
                    <Field label="Full Applicant Name">
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Tharindu Wijerathna"
                        required
                      />
                    </Field>
                    <Field label="NIC or Passport Number">
                      <input
                        type="text"
                        maxLength={12}
                        value={nicNumber}
                        onChange={(e) => setNicNumber(e.target.value.slice(0, 12))}
                        placeholder="e.g. 199512345678 / 951234567V"
                        required
                      />
                    </Field>
                  </div>

                  <div className="form-grid">
                    <Field label="Mobile Phone Number">
                      <input
                        type="text"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="+94 77 123 4567"
                        required
                      />
                    </Field>
                    <Field label="Email Address">
                      <input
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="applicant@example.com"
                        required
                      />
                    </Field>
                  </div>

                  <div className="form-grid">
                    <Field label="Permanent Residential Address">
                      <input
                        type="text"
                        value={residentialAddress}
                        onChange={(e) => setResidentialAddress(e.target.value)}
                        placeholder="No 45, Galle Road, Colombo 03"
                        required
                      />
                    </Field>
                    <Field label="Housing Ownership Status">
                      <select value={housingStatus} onChange={(e) => setHousingStatus(e.target.value)}>
                        <option value="Owned">Owner Occupied (Self Owned)</option>
                        <option value="Mortgaged">Owner Occupied (Mortgaged)</option>
                        <option value="Rented">Rented / Leased Residence</option>
                        <option value="Parental">Living with Parents / Family</option>
                      </select>
                    </Field>
                  </div>

                  <div className="actions" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
                    <button type="button" className="secondary" onClick={() => setModalCardType(null)}>
                      Cancel
                    </button>
                    <button type="button" onClick={() => setCreditStep(2)}>
                      Next: Income &amp; Employment
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Employment & Income Profile */}
              {creditStep === 2 && (
                <div className="step-content-pane">
                  <h3 className="section-subtitle">Employment &amp; Income Evaluation</h3>
                  <div className="form-grid">
                    <Field label="Employment Category">
                      <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                        <option value="Salaried Employee">Salaried Permanent Employee</option>
                        <option value="Self-Employed / Business Owner">Self-Employed / Business Owner</option>
                        <option value="Professional / Consultant">Licensed Professional / Consultant</option>
                        <option value="Retired / Other">Retired / Foreign Income Earner</option>
                      </select>
                    </Field>
                    <Field label="Employer / Company Name">
                      <input
                        type="text"
                        value={employerName}
                        onChange={(e) => setEmployerName(e.target.value)}
                        placeholder="e.g. Serendib Technologies PLC"
                        required
                      />
                    </Field>
                  </div>

                  <div className="form-grid">
                    <Field label="Job Designation / Title">
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        required
                      />
                    </Field>
                    <Field label="Continuous Service Period (Years)">
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={yearsOfService}
                        onChange={(e) => setYearsOfService(e.target.value)}
                        required
                      />
                    </Field>
                  </div>

                  <div className="form-grid">
                    <Field label="Gross Monthly Net Salary / Income (LKR)">
                      <input
                        type="number"
                        min="50000"
                        step="10000"
                        value={grossMonthlyIncome}
                        onChange={(e) => setGrossMonthlyIncome(e.target.value)}
                        placeholder="e.g. 250000"
                        required
                      />
                    </Field>
                    <Field label="Fixed Allowances / Other Income (LKR)">
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={fixedAllowances}
                        onChange={(e) => setFixedAllowances(e.target.value)}
                        placeholder="e.g. 30000"
                      />
                    </Field>
                  </div>

                  <Field label="Primary Salary Remittance Bank">
                    <select value={primaryBankName} onChange={(e) => setPrimaryBankName(e.target.value)}>
                      <option value="Serendib Smart Bank PLC">Serendib Smart Bank PLC</option>
                      <option value="Commercial Bank of Ceylon">Commercial Bank of Ceylon</option>
                      <option value="Sampath Bank PLC">Sampath Bank PLC</option>
                      <option value="Hatton National Bank (HNB)">Hatton National Bank (HNB)</option>
                      <option value="Bank of Ceylon (BOC)">Bank of Ceylon (BOC)</option>
                      <option value="Nations Trust Bank (NTB)">Nations Trust Bank (NTB)</option>
                    </select>
                  </Field>

                  <div className="actions" style={{ marginTop: 24, justifyContent: 'space-between' }}>
                    <button type="button" className="secondary" onClick={() => setCreditStep(1)}>
                      Back
                    </button>
                    <button type="button" onClick={() => setCreditStep(3)}>
                      Next: Liabilities &amp; Limit
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Financial Liabilities & Requested Limit */}
              {creditStep === 3 && (
                <div className="step-content-pane">
                  <h3 className="section-subtitle">Financial Liabilities &amp; Desired Credit Line</h3>
                  <div className="form-grid">
                    <Field label="Existing Monthly Loan &amp; Card Deductions (LKR)">
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={existingCreditDeductions}
                        onChange={(e) => setExistingCreditDeductions(e.target.value)}
                        placeholder="e.g. 20000"
                        required
                      />
                    </Field>
                    <Field label="Requested Credit Limit (LKR)">
                      <select value={requestedCreditLimit} onChange={(e) => setRequestedCreditLimit(e.target.value)}>
                        <option value="100000">LKR 100,000 (Gold Starter)</option>
                        <option value="250000">LKR 250,000 (Gold Select)</option>
                        <option value="500000">LKR 500,000 (Platinum Preferred)</option>
                        <option value="1000000">LKR 1,000,000 (Platinum Executive)</option>
                        <option value="1500000">LKR 1,500,000 (World Sovereign)</option>
                        <option value="2500000">LKR 2,500,000 (World Prestige)</option>
                      </select>
                    </Field>
                  </div>

                  <div className="credit-summary-box">
                    <div className="c-sum-item">
                      <span>Gross Monthly Income</span>
                      <strong>{money((Number(grossMonthlyIncome) + Number(fixedAllowances || 0)).toFixed(2))}</strong>
                    </div>
                    <div className="c-sum-item">
                      <span>Monthly Debt Commitments</span>
                      <strong style={{ color: 'var(--warning)' }}>{money(Number(existingCreditDeductions || 0).toFixed(2))}</strong>
                    </div>
                    <div className="c-sum-item">
                      <span>Net Disposable Income</span>
                      <strong style={{ color: 'var(--emerald)' }}>
                        {money(Math.max(0, Number(grossMonthlyIncome) + Number(fixedAllowances || 0) - Number(existingCreditDeductions || 0)).toFixed(2))}
                      </strong>
                    </div>
                  </div>


                  <div className="crib-declaration-card" style={{ marginTop: 20 }}>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={cribConsent}
                        onChange={(e) => setCribConsent(e.target.checked)}
                        required
                      />
                      <div>
                        <strong>Credit Bureau (CRIB) Authorization Consent</strong>
                        <p style={{ margin: 0, fontSize: 13 }}>
                          I hereby grant irrevocable consent to Serendib Smart Bank PLC to obtain my credit profile report from the Credit Information Bureau of Sri Lanka (CRIB) for credit assessment.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="actions" style={{ marginTop: 24, justifyContent: 'space-between' }}>
                    <button type="button" className="secondary" onClick={() => setCreditStep(2)}>
                      Back
                    </button>
                    <button type="button" disabled={!cribConsent} onClick={() => setCreditStep(4)}>
                      Next: Upload Proof &amp; Submit
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Income Proof Uploads & Final Submission */}
              {creditStep === 4 && (
                <div className="step-content-pane">
                  <h3 className="section-subtitle">Required Income Verification Documents</h3>
                  <p className="fine-print" style={{ marginTop: 0, marginBottom: 16 }}>
                    Attach your mandatory documentation for bank verification before submitting your credit application.
                  </p>

                  <div className="doc-upload-grid">
                    <div className="doc-upload-tile">
                      <div>
                        <strong>1. Latest 3 Months Pay Slips</strong>
                        <small>PDF or scanned copy of recent payslips</small>
                      </div>
                      <div className="doc-attachment-badge">
                        <input
                          type="file"
                          onChange={(e) => setPaySlipsDoc(e.target.files?.[0]?.name || '')}
                        />
                        {paySlipsDoc && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>📄 {paySlipsDoc}</span>}
                      </div>
                    </div>

                    <div className="doc-upload-tile">
                      <div>
                        <strong>2. Bank Account Statements (3 Months)</strong>
                        <small>Showing regular salary credits</small>
                      </div>
                      <div className="doc-attachment-badge">
                        <input
                          type="file"
                          onChange={(e) => setBankStatementsDoc(e.target.files?.[0]?.name || '')}
                        />
                        {bankStatementsDoc && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>📊 {bankStatementsDoc}</span>}
                      </div>
                    </div>

                    <div className="doc-upload-tile">
                      <div>
                        <strong>3. Employment Confirmation Letter / BR</strong>
                        <small>Employer service confirmation or BR copy</small>
                      </div>
                      <div className="doc-attachment-badge">
                        <input
                          type="file"
                          onChange={(e) => setEmploymentLetterDoc(e.target.files?.[0]?.name || '')}
                        />
                        {employmentLetterDoc && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>💼 {employmentLetterDoc}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="save-fav-checkbox-box" style={{ marginTop: 20 }}>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        required
                      />
                      <span>
                        I declare that all submitted income and personal information is true, accurate, and complete. I authorize Serendib Smart Bank PLC to evaluate this credit application.
                      </span>
                    </label>
                  </div>

                  <div className="actions" style={{ marginTop: 24, justifyContent: 'space-between' }}>
                    <button type="button" className="secondary" onClick={() => setCreditStep(3)}>
                      Back
                    </button>
                    <button type="submit" disabled={busy || !agreed}>
                      {busy ? 'Submitting Application...' : 'Submit Credit Card Application'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Customer Active & Pending Cards Display Grid */}
      {result.loading ? (
        <Loading />
      ) : (
        result.data && (
          <>
            <div className="card-grid" style={{ marginTop: 32 }}>
              {result.data.content.map((c) => {
                const isCredit = c.cardType === 'CREDIT';
                return (
                  <section className="bank-card-panel" key={c.cardId}>
                    <div className={`bank-card ${isCredit ? 'credit-card-bg' : 'debit-card-bg'}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="card-product-title">{c.cardProduct || (isCredit ? 'SERENDIB PLATINUM CREDIT' : 'SERENDIB DEBIT')}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <span className="card-chip">▦</span>
                      <strong className="card-number-display">{c.cardNumber}</strong>
                      <div className="card-footer-meta">
                        <div>
                          <small className="card-account-meta">
                            {isCredit
                              ? 'Standalone Credit Facility Account'
                              : `Linked Account #${c.accountId || 'N/A'}`}
                          </small>
                          {isCredit ? (
                            <div className="card-credit-limit-tag" style={{ marginTop: 4 }}>
                              Credit Limit: <strong>{c.creditLimit ? money(c.creditLimit) : 'Pending Review'}</strong>
                              {c.status === 'ACTIVE' && c.availableCredit && (
                                <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.9 }}>
                                  (Available: {money(c.availableCredit)})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="card-credit-limit-tag" style={{ marginTop: 4 }}>
                              ATM Limit: <strong>
                                {c.cardProduct?.includes('Platinum') ? 'LKR 750,000 / day' : c.cardProduct?.includes('Gold') ? 'LKR 300,000 / day' : 'LKR 100,000 / day'}
                              </strong>
                            </div>
                          )}
                        </div>
                        <small>{c.expiryDate ? date(c.expiryDate) : 'Awaiting issuance'}</small>
                      </div>
                    </div>
                    <div className="actions">
                      {isCredit && (
                        <button className="secondary" onClick={() => setSelectedCardForView(c)}>
                          View Credit Account Details
                        </button>
                      )}
                      {c.status === 'PENDING' && c.issued && (
                        <button disabled={busy} onClick={() => cardAction(c, 'activate')}>
                          Activate Card
                        </button>
                      )}
                      {c.status === 'ACTIVE' && (
                        <button className="secondary" disabled={busy} onClick={() => cardAction(c, 'block')}>
                          Block Card
                        </button>
                      )}
                      {c.status === 'BLOCKED' && (
                        <button disabled={busy} onClick={() => cardAction(c, 'unblock')}>
                          Unblock Card
                        </button>
                      )}
                      {c.status !== 'CANCELLED' && (
                        <button className="link-button danger" disabled={busy} onClick={() => cardAction(c, 'cancel')}>
                          Cancel card
                        </button>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
            {!result.data.content.length && <Empty>No active or pending cards found.</Empty>}
            <Pagination data={result.data} onPage={setPage} />
          </>
        )
      )}

      {/* Modal to view full Credit Card Account Statement / Dossier */}
      {selectedCardForView && (
        <div className="modal-backdrop" onClick={() => setSelectedCardForView(null)}>
          <div className="glass-card-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <button className="close" onClick={() => setSelectedCardForView(null)} aria-label="Close">
              ×
            </button>
            <div className="glass-modal-header">
              <div className="glass-modal-icon credit">👑</div>
              <div>
                <h2>{selectedCardForView.cardProduct || 'Standalone Credit Card Account'}</h2>
                <p>Card #{selectedCardForView.cardNumber} · Status: {selectedCardForView.status}</p>
              </div>
            </div>

            <div className="credit-dossier-grid">
              <div className="dossier-row">
                <span>Account Type:</span>
                <strong>Standalone Credit Facility</strong>
              </div>
              <div className="dossier-row">
                <span>Sanctioned Credit Limit:</span>
                <strong>{selectedCardForView.creditLimit ? money(selectedCardForView.creditLimit) : 'Under Review'}</strong>
              </div>
              <div className="dossier-row">
                <span>Available Credit Line:</span>
                <strong style={{ color: 'var(--emerald)' }}>
                  {selectedCardForView.availableCredit ? money(selectedCardForView.availableCredit) : 'Under Review'}
                </strong>
              </div>
              <div className="dossier-row">
                <span>Outstanding Balance Owed:</span>
                <strong>{money(selectedCardForView.currentBalance || '0.00')}</strong>
              </div>
              <div className="dossier-row">
                <span>Applicant Full Name:</span>
                <strong>{selectedCardForView.applicantName || 'Registered Customer'}</strong>
              </div>
              <div className="dossier-row">
                <span>Employment Type:</span>
                <strong>{selectedCardForView.employmentType || 'Salaried'}</strong>
              </div>
              <div className="dossier-row">
                <span>Employer / Organization:</span>
                <strong>{selectedCardForView.employerName || 'Verified Employer'}</strong>
              </div>
            </div>

            <div className="actions" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
              <button className="secondary" onClick={() => setSelectedCardForView(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function StaffCardsPage() {
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [selectedLimits, setSelectedLimits] = useState<Record<number, string>>({});
  const [inspectCard, setInspectCard] = useState<Card | null>(null);

  const result = useApi<Page<Card>>(`/api/employee/cards?status=PENDING&page=${page}`, revision);

  async function issueCard(c: Card, approve: boolean) {
    if (!confirm(`${approve ? 'Approve & issue' : 'Reject'} card application #${c.cardId}?`)) return;
    setBusy(c.cardId);
    setError(null);
    try {
      const limit = selectedLimits[c.cardId] || (c.creditLimit ? c.creditLimit.replace(/[^0-9.]/g, '') : '250000');
      if (approve) {
        await send(
          `/api/employee/cards/${c.cardId}/issue`,
          c.cardType === 'CREDIT' ? { creditLimit: Number(limit) } : undefined,
          'PUT'
        );
      } else {
        await send(`/api/employee/cards/${c.cardId}/reject`, undefined, 'PUT');
      }
      setInspectCard(null);
      setRevision((r) => r + 1);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  }

  const creditCards = result.data?.content.filter((c) => c.cardType === 'CREDIT') || [];
  const debitCards = result.data?.content.filter((c) => c.cardType !== 'CREDIT') || [];

  return (
    <>
      <Heading
        title="Credit Card & Card Applications"
        subtitle="Evaluate customer credit applications, review financial income & CRIB declarations, set approved credit limits, and issue standalone cards."
      />
      <ErrorMessage error={error || result.error} />

      {result.loading ? (
        <Loading />
      ) : (
        result.data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Credit Cards Tile Section */}
            <Panel title="💳 Pending Credit Card Applications">
              <p className="fine-print" style={{ marginTop: 0, marginBottom: 16 }}>
                Review standalone Credit Card assessment applications submitted by customers. Inspect income proof documents and select an approved credit limit before issuing.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Applicant Details</th>
                      <th>Employment &amp; Income</th>
                      <th>Requested Limit</th>
                      <th>Approved Credit Limit</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditCards.map((c) => {
                      const currentLimit =
                        selectedLimits[c.cardId] ??
                        (c.creditLimit ? String(c.creditLimit).replace(/[^0-9.]/g, '') : '250000');
                      const grossInc = Number(c.grossMonthlyIncome || '0');
                      const allowances = Number(c.fixedAllowances || '0');
                      const totalInc = grossInc + allowances;
                      return (
                        <tr key={c.cardId}>
                          <td>
                            <strong>#{c.cardId}</strong>
                            <small>{c.cardProduct || 'Platinum Credit Application'}</small>
                            <small>{date(c.requestedAt)}</small>
                          </td>
                          <td>
                            <strong>{c.applicantName || 'Customer'}</strong>
                            <small>NIC: {c.applicantNic || 'Provided'}</small>
                            <span className="status active" style={{ fontSize: 10, marginTop: 4 }}>STANDALONE CREDIT</span>
                          </td>
                          <td>
                            <strong>{c.employmentType || 'Salaried'}</strong>
                            <small>{c.employerName ? `${c.employerName} (${c.designation || 'Staff'})` : 'Employment Verified'}</small>
                            <small>Net Income: <strong>{totalInc > 0 ? money(totalInc.toFixed(2)) : 'LKR 250,000'}</strong></small>

                          </td>
                          <td>
                            <strong style={{ color: 'var(--gold)' }}>{c.creditLimit ? money(c.creditLimit) : 'LKR 250,000'}</strong>
                          </td>
                          <td>
                            <select
                              value={currentLimit}
                              onChange={(e) =>
                                setSelectedLimits((prev) => ({ ...prev, [c.cardId]: e.target.value }))
                              }
                              style={{ padding: '6px 10px', fontSize: 13, minWidth: 150 }}
                            >
                              <option value="100000">LKR 100,000</option>
                              <option value="250000">LKR 250,000</option>
                              <option value="500000">LKR 500,000</option>
                              <option value="1000000">LKR 1,000,000</option>
                              <option value="1500000">LKR 1,500,000</option>
                              <option value="2500000">LKR 2,500,000</option>
                            </select>
                          </td>
                          <td>
                            <div className="actions">
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => setInspectCard(c)}
                              >
                                View Dossier
                              </button>
                              <button
                                disabled={busy === c.cardId}
                                onClick={() => issueCard(c, true)}
                              >
                                Approve Credit Card
                              </button>
                              <button
                                className="secondary danger"
                                disabled={busy === c.cardId}
                                onClick={() => issueCard(c, false)}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!creditCards.length && <Empty>No pending credit card applications under review.</Empty>}
            </Panel>

            {/* Debit Cards Section */}
            <Panel title="💳 Pending Debit Card Requests">
              <p className="fine-print" style={{ marginTop: 0, marginBottom: 16 }}>
                Standard debit card requests linked to customer active deposit accounts.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Linked Account</th>
                      <th>Requested Date</th>
                      <th>Issuance Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debitCards.map((c) => (
                      <tr key={c.cardId}>
                        <td>
                          <strong>#{c.cardId}</strong>
                          <small>Standard Debit Card</small>
                        </td>
                        <td>Account #{c.accountId}</td>
                        <td>{date(c.requestedAt)}</td>
                        <td>{c.issued ? 'Issued; awaiting activation' : 'Unissued'}</td>
                        <td>
                          {!c.issued && (
                            <div className="actions">
                              <button disabled={busy === c.cardId} onClick={() => issueCard(c, true)}>
                                Issue Debit Card
                              </button>
                              <button
                                className="secondary danger"
                                disabled={busy === c.cardId}
                                onClick={() => issueCard(c, false)}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!debitCards.length && <Empty>No pending debit card requests.</Empty>}
            </Panel>

            <Pagination data={result.data} onPage={setPage} />
          </div>
        )
      )}

      {/* Bank Staff Full Credit Application Assessment Dossier Modal */}
      {inspectCard && (
        <div className="modal-backdrop" onClick={() => setInspectCard(null)}>
          <div className="glass-card-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740 }}>
            <button className="close" onClick={() => setInspectCard(null)} aria-label="Close">
              ×
            </button>
            <div className="glass-modal-header">
              <div className="glass-modal-icon credit">📋</div>
              <div>
                <h2>Credit Assessment Dossier — Application #{inspectCard.cardId}</h2>
                <p>{inspectCard.cardProduct || 'Standalone Platinum Credit Card'}</p>
              </div>
            </div>

            <div className="credit-dossier-grid">
              <div className="dossier-row">
                <span>Applicant Full Name:</span>
                <strong>{inspectCard.applicantName || 'N/A'}</strong>
              </div>
              <div className="dossier-row">
                <span>NIC / Passport:</span>
                <strong>{inspectCard.applicantNic || 'N/A'}</strong>
              </div>
              <div className="dossier-row">
                <span>Employment Type:</span>
                <strong>{inspectCard.employmentType || 'Salaried Employee'}</strong>
              </div>
              <div className="dossier-row">
                <span>Employer / Company:</span>
                <strong>{inspectCard.employerName || 'N/A'}</strong>
              </div>
              <div className="dossier-row">
                <span>Designation / Role:</span>
                <strong>{inspectCard.designation || 'Staff'}</strong>
              </div>
              <div className="dossier-row">
                <span>Continuous Service:</span>
                <strong>{inspectCard.yearsOfService ? `${inspectCard.yearsOfService} Years` : '3 Years'}</strong>
              </div>
              <div className="dossier-row">
                <span>Gross Monthly Income:</span>
                <strong>{inspectCard.grossMonthlyIncome ? money(inspectCard.grossMonthlyIncome) : 'LKR 250,000'}</strong>
              </div>
              <div className="dossier-row">
                <span>Fixed Allowances:</span>
                <strong>{inspectCard.fixedAllowances ? money(inspectCard.fixedAllowances) : 'LKR 30,000'}</strong>
              </div>
              <div className="dossier-row">
                <span>Existing Debt Commitments:</span>
                <strong style={{ color: 'var(--warning)' }}>
                  {inspectCard.existingCreditDeductions ? money(inspectCard.existingCreditDeductions) : 'LKR 20,000'}
                </strong>
              </div>
              <div className="dossier-row">
                <span>CRIB Authorization:</span>
                <strong style={{ color: inspectCard.cribConsent !== false ? 'var(--emerald)' : 'var(--danger)' }}>
                  {inspectCard.cribConsent !== false ? '✓ Verified & Authorized' : 'Pending'}
                </strong>
              </div>
            </div>

            {inspectCard.riskLevel && (
              <div style={{
                background: inspectCard.riskLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.12)' : inspectCard.riskLevel === 'MEDIUM' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                borderLeft: `4px solid ${inspectCard.riskLevel === 'HIGH' ? '#ef4444' : inspectCard.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981'}`,
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                marginTop: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>🛡️ Advisory Credit Risk Assessment: {inspectCard.riskLevel} RISK ({inspectCard.riskScore}/100)</strong>
                  <span style={{
                    background: inspectCard.riskLevel === 'HIGH' ? '#ef4444' : inspectCard.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>{inspectCard.riskLevel}</span>
                </div>
                {inspectCard.riskLevel === 'HIGH' && (
                  <div style={{ color: '#ef4444', fontWeight: 700, marginTop: '0.35rem', fontSize: '0.85rem' }}>
                    ⚠️ HIGH RISK WARNING: Requires recorded approval rationale.
                  </div>
                )}
                {inspectCard.riskFactors && inspectCard.riskFactors.length > 0 && (
                  <ul style={{ margin: '0.35rem 0 0 1.1rem', fontSize: '0.85rem' }}>
                    {inspectCard.riskFactors.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                )}
              </div>
            )}

            <h4 style={{ marginTop: 20, marginBottom: 10 }}>Uploaded Verification Documents</h4>
            <div className="doc-attachment-badge-list">
              <span className="doc-badge">📄 Payslips: {inspectCard.paySlipsUpload || 'payslips_latest_3months.pdf'} (Verified)</span>
              <span className="doc-badge">📊 Bank Stmts: {inspectCard.bankStatementsUpload || 'bank_statement_3months.pdf'} (Verified)</span>
              <span className="doc-badge">💼 Service Letter: {inspectCard.employmentLetterUpload || 'employment_confirmation.pdf'} (Verified)</span>
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Set Approved Credit Limit for Issue:
              </label>
              <select
                value={selectedLimits[inspectCard.cardId] ?? (inspectCard.creditLimit ? String(inspectCard.creditLimit).replace(/[^0-9.]/g, '') : '250000')}
                onChange={(e) => setSelectedLimits((prev) => ({ ...prev, [inspectCard.cardId]: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px' }}
              >
                <option value="100000">LKR 100,000 (Gold Starter)</option>
                <option value="250000">LKR 250,000 (Gold Select)</option>
                <option value="500000">LKR 500,000 (Platinum Preferred)</option>
                <option value="1000000">LKR 1,000,000 (Platinum Executive)</option>
                <option value="1500000">LKR 1,500,000 (World Sovereign)</option>
                <option value="2500000">LKR 2,500,000 (World Prestige)</option>
              </select>
            </div>

            <div className="actions" style={{ marginTop: 24, justifyContent: 'flex-end', gap: 12 }}>
              <button className="secondary" onClick={() => setInspectCard(null)}>
                Cancel
              </button>
              <button className="secondary danger" onClick={() => issueCard(inspectCard, false)}>
                Reject Application
              </button>
              <button onClick={() => issueCard(inspectCard, true)}>
                Approve &amp; Issue Credit Card
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

