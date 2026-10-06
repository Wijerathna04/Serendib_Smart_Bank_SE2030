import { Text } from '../i18n';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, send, money, date } from '../api/client';
import { useApi, Heading, Panel, Field, ErrorMessage, Loading, StatusBadge, Pagination, Detail, Empty } from '../components/ui';
import { OtpDialog } from '../components/OtpDialog';
import type { Account, Deposit, Product, Page } from '../types/api';
import { TermsModal } from '../components/TermsModal';
import { ApplicationDetails } from '../components/ApplicationDetails';
import { FIXED_DEPOSITS_CATALOG } from '../data/productCatalog';

export function FixedDepositsPage() {
  const [page, setPage] = useState(0);
  const { data, error, loading } = useApi<Page<Deposit>>(`/api/fixed-deposits?page=${page}`);

  return (
    <>
      <Heading
        title="Fixed deposits"
        subtitle="Make room for your future financial goals with high-yield term placements."
        icon="/images/page-icons/fixed_deposit.png"
        actions={<Link className="button" to="/app/fixed-deposits/new">+ Create fixed deposit</Link>}
      />

      <div 
        className="welcome-banner glass-card"
        style={{
          '--banner-bg-img': "url('/images/accounting_desk_banner.jpeg')",
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          marginBottom: '2rem'
        } as React.CSSProperties}
      >
        <span className="eyebrow">GUARANTEED WEALTH ACCUMULATION</span>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'Playfair Display', margin: '0.35rem 0 0.5rem 0' }}>
          High-Yield Fixed Term Placements
        </h2>
        <p style={{ margin: 0, maxWidth: '620px', opacity: 0.9, fontSize: '0.95rem' }}>
          Lock in guaranteed returns with flexible maturity periods (3 to 60 months), monthly or at-maturity payout options, and CBSL-regulated security seals.
        </p>
      </div>

      <div className="callout">
        Under Sri Lankan regulatory framework, fixed deposit placements exceeding LKR 1,000,000 (1 Million) require Branch Manager review and approval before funding activation.
      </div>
      <ErrorMessage error={error} />
      {loading ? (
        <Loading />
      ) : (
        data && (
          <Panel>
            {data.content.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Deposit</th>
                      <th>Principal</th>
                      <th>Term / annual rate</th>
                      <th>Maturity</th>
                      <th><Text value={"Status"} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map(f => (
                      <tr key={f.fixedDepositId}>
                        <td>
                          <Link to={`/app/fixed-deposits/${f.fixedDepositId}`}>FD #{f.fixedDepositId}</Link>
                          <small>{f.accountNumber}</small>
                        </td>
                        <td>{money(f.principalAmount)}</td>
                        <td>{f.termMonths} months · {f.interestRate}%</td>
                        <td>{f.maturityDate ? date(f.maturityDate) : 'Pending Approval'}</td>
                        <td><StatusBadge status={f.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>You have no fixed deposits yet.</Empty>
            )}
            <Pagination data={data} onPage={setPage} />
          </Panel>
        )
      )}
    </>
  );
}

export function CreateFixedDepositPage() {
  const accounts = useApi<Page<Account>>('/api/accounts?size=100');
  const products = useApi<Product[]>('/api/fixed-deposits/products');

  const [accountId, setAccountId] = useState('');
  const [fdProduct, setFdProduct] = useState(FIXED_DEPOSITS_CATALOG[0].name);
  const [principal, setPrincipal] = useState('');
  const [term, setTerm] = useState('12');
  const [payoutFrequency, setPayoutFrequency] = useState('On Maturity');
  const [maturityInstruction, setMaturityInstruction] = useState('Auto-Renew Principal & Interest');
  const [fatcaCompliance, setFatcaCompliance] = useState(false);
  const [pepDeclaration, setPepDeclaration] = useState(false);

  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Deposit | null>(null);

  const key = useRef(crypto.randomUUID());
  const navigate = useNavigate();

  const isOverOneMillion = Number(principal) > 1000000;

  function openTerms(e: React.FormEvent) {
    e.preventDefault();
    setShowTerms(true);
  }

  function resetFormFields() {
    setAccountId('');
    setFdProduct(FIXED_DEPOSITS_CATALOG[0].name);
    setPrincipal('');
    setTerm('12');
    setPayoutFrequency('On Maturity');
    setMaturityInstruction('Auto-Renew Principal & Interest');
    setFatcaCompliance(false);
    setPepDeclaration(false);
  }

  async function submitDeposit() {
    setError(null);
    setBusy(true);
    try {
      const res = await send<Deposit>(
        '/api/fixed-deposits',
        {
          accountId: Number(accountId),
          principalAmount: principal,
          termMonths: Number(term),
          interestPayoutFrequency: payoutFrequency,
          maturityInstruction,
          fatcaCompliance,
          pepDeclaration
        },
        'POST',
        key.current
      );

      resetFormFields();
      setCreated(res);
      if (res.status === 'PENDING_MANAGER_APPROVAL') {
        alert('Fixed deposit exceeding LKR 1 Million submitted! It is now in PENDING_MANAGER_APPROVAL status awaiting Branch Manager authorization.');
        navigate(`/app/fixed-deposits/${res.fixedDepositId}`);
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const productInfo = products.data?.find(p => p.termMonths === Number(term));

  return (
    <>
      <Heading
        title="Create a fixed deposit"
        subtitle="Choose your preferred term and maturity options. Principal over LKR 1M requires Manager approval."
      />
      <div className="two-column">
        <Panel title="Deposit details">
          <ErrorMessage error={error || accounts.error || products.error} />
          <form onSubmit={openTerms}>
            <Field label="FD Product Scheme">
              <select
                value={fdProduct}
                onChange={e => {
                  setFdProduct(e.target.value);
                  if (e.target.value.includes('Flexi')) setTerm('3');
                  else if (e.target.value.includes('Monthly Income')) setTerm('24');
                  else setTerm('12');
                }}
              >
                {FIXED_DEPOSITS_CATALOG.map(p => (
                  <option key={p.id} value={p.name}>{p.name} - {p.tagline}</option>
                ))}
              </select>
            </Field>

            <Field label="Funding account">
              <select required value={accountId} onChange={e => setAccountId(e.target.value)}>
                <option value="">Choose an account</option>
                {accounts.data?.content.filter(a => a.status === 'ACTIVE').map(a => (
                  <option key={a.accountId} value={a.accountId}>
                    {a.accountNumber} · Balance: {money(a.balance)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Principal amount (LKR)">
              <input
                type="number"
                step="0.01"
                min="25000.00"
                max="9999999999.99"
                required
                placeholder="e.g. 100000"
                value={principal}
                onChange={e => setPrincipal(e.target.value)}
              />
            </Field>

            {isOverOneMillion && (
              <div className="callout" style={{ background: 'rgba(245,158,11,0.15)', borderLeft: '4px solid #f59e0b', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.25rem' }}>
                <strong>Branch Manager Approval Required:</strong> Deposit amount exceeds LKR 1,000,000. It will be routed to the Branch Manager for approval before funding OTP verification.
              </div>
            )}

            <Field label="Tenure period">
              <select required value={term} onChange={e => setTerm(e.target.value)}>
                {products.data?.map(p => (
                  <option key={p.termMonths} value={p.termMonths}>
                    {p.termMonths} months · {p.annualRate}% annual interest rate
                  </option>
                ))}
              </select>
            </Field>

            <div className="two-column">
              <Field label="Interest payout frequency">
                <select value={payoutFrequency} onChange={e => setPayoutFrequency(e.target.value)}>
                  <option value="On Maturity">On Maturity</option>
                  <option value="Monthly">Monthly Disbursement (to savings)</option>
                </select>
              </Field>
              <Field label="Maturity instruction">
                <select value={maturityInstruction} onChange={e => setMaturityInstruction(e.target.value)}>
                  <option value="Auto-Renew Principal & Interest">Auto-Renew Principal & Interest</option>
                  <option value="Auto-Renew Principal Only">Auto-Renew Principal Only</option>
                  <option value="Close and Transfer Funds">Close and Transfer Funds to Savings</option>
                </select>
              </Field>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0 1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={fatcaCompliance} onChange={e => setFatcaCompliance(e.target.checked)} />
                <span>FATCA Declaration: Non-US citizen or resident.</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={pepDeclaration} onChange={e => setPepDeclaration(e.target.checked)} />
                <span>PEP Declaration: Not a Politically Exposed Person.</span>
              </label>
            </div>

            {productInfo && (
              <div className="callout" style={{ marginBottom: '1.5rem' }}>
                Minimum {money(productInfo.minimumAmount)}. {productInfo.disclosure}.
              </div>
            )}

            <button disabled={busy || accounts.loading || products.loading}>
              {busy ? 'Processing…' : isOverOneMillion ? 'Review Terms & Submit for Manager Approval' : 'Review Terms & Continue to Verification'}
            </button>
          </form>
        </Panel>

        <Panel title="Fixed Deposit Rules">
          <ol className="steps">
            <li>Select your funding account and structured FD scheme.</li>
            <li>Deposits over LKR 1M are forwarded to the Branch Manager for approval.</li>
            <li>Verify funding with OTP confirmation once approved/ready.</li>
            <li>Upon maturity, perform settlement closure to receive principal and accrued yield.</li>
          </ol>
          <p>Early termination penalties apply per standard CBSL guidelines (standard savings rate recalculated minus 1.0% penalty).</p>
          <Link to="/app/fixed-deposits">View existing deposits</Link>
        </Panel>
      </div>

      <TermsModal
        type="FIXED_DEPOSITS"
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={submitDeposit}
      />

      {created && created.status === 'PENDING' && created.openingTransactionId && (
        <OtpDialog
          id={created.openingTransactionId}
          onClose={() => {
            window.dispatchEvent(new Event('bank-transaction-completed'));
            navigate(`/app/fixed-deposits/${created.fixedDepositId}`);
          }}
          onComplete={() => {
            window.dispatchEvent(new Event('bank-transaction-completed'));
            navigate(`/app/fixed-deposits/${created.fixedDepositId}`);
          }}
        />
      )}
    </>
  );
}

export function FixedDepositDetailsPage() {
  const { id } = useParams();
  const [revision, setRevision] = useState(0);
  const [otpId, setOtpId] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const key = useRef(crypto.randomUUID());

  const { data: f, error: loadError, loading } = useApi<Deposit>(`/api/fixed-deposits/${id}`, revision);

  async function close() {
    if (!confirm('Request closure and settlement of this matured fixed deposit?')) return;
    setBusy(true);
    setError(null);
    try {
      const result = await send<Deposit>(`/api/fixed-deposits/${id}/close`, undefined, 'PUT', key.current);
      setOtpId(result.closingTransactionId);
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm('Cancel this pending fixed deposit?')) return;
    setBusy(true);
    try {
      await send(`/api/fixed-deposits/${id}/cancel`, undefined, 'PUT');
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function resumeClosure() {
    if (!f?.closingTransactionId) return;
    try {
      const t = await api<{ canAuthorize: boolean }>(`/api/transactions/${f.closingTransactionId}`);
      if (t.canAuthorize) setOtpId(f.closingTransactionId);
      else {
        key.current = crypto.randomUUID();
        await close();
      }
    } catch (e) {
      setError(e);
    }
  }

  return (
    <>
      <Heading title={`Fixed deposit #${id}`} actions={<Link className="button secondary" to="/app/fixed-deposits">All deposits</Link>} />
      <ErrorMessage error={error || loadError} />
      {loading ? (
        <Loading />
      ) : (
        f && (
          <Panel>
            <div className="balance-hero">
              <span>Principal</span>
              <h2>{money(f.principalAmount)}</h2>
              <StatusBadge status={f.status} />
            </div>

            {f.status === 'PENDING_MANAGER_APPROVAL' && (
              <div className="callout" style={{ background: 'rgba(245,158,11,0.15)', borderLeft: '4px solid #f59e0b', margin: '1rem 0' }}>
                <strong>Awaiting Branch Manager Approval:</strong> Because this deposit exceeds LKR 1 Million, a Branch Manager must approve the request before you can complete the funding OTP verification.
              </div>
            )}

            <div className="details-grid">
              <Detail label="Funding account">{f.accountNumber}</Detail>
              <Detail label="Annual rate">{f.interestRate}%</Detail>
              <Detail label="Term">{f.termMonths} months</Detail>
              <Detail label="Start date">{f.startDate ? date(f.startDate) : 'Pending'}</Detail>
              <Detail label="Maturity date">{f.maturityDate ? date(f.maturityDate) : 'Pending'}</Detail>
              <Detail label="Maturity amount">{f.maturityAmount ? money(f.maturityAmount) : '—'}</Detail>
            </div>

            {f.fdDetails && (
              <ApplicationDetails data={f.fdDetails} kind="fd" title="Deposit Parameters & Instructions" />
            )}

            <div className="actions" style={{ marginTop: '1.5rem' }}>
              {f.status === 'PENDING' && f.openingTransactionId && (
                <>
                  <button disabled={busy} onClick={() => setOtpId(f.openingTransactionId)}>Verify funding with OTP</button>
                  <button disabled={busy} className="danger secondary" onClick={cancel}>Cancel request</button>
                </>
              )}
              {f.status === 'MATURED' && (
                <button disabled={busy} onClick={f.closingTransactionId ? resumeClosure : close}>
                  Close and receive maturity amount
                </button>
              )}
              {f.openingTransactionId && (
                <Link to={`/app/transactions/${f.openingTransactionId}`}>Funding transaction</Link>
              )}
            </div>
          </Panel>
        )
      )}

      {otpId && (
        <OtpDialog
          id={otpId}
          onClose={() => {
            setOtpId(null);
            setRevision(r => r + 1);
          }}
          onComplete={() => {
            setOtpId(null);
            key.current = crypto.randomUUID();
            setRevision(r => r + 1);
          }}
        />
      )}
    </>
  );
}
