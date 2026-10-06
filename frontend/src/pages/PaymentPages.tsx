import { Text } from '../i18n';
import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { send, money, date } from '../api/client';
import { useApi, Heading, Panel, Field, ErrorMessage, StatusBadge, Pagination, Loading, Empty } from '../components/ui';
import { OtpDialog } from '../components/OtpDialog';
import type { Account, Beneficiary, Transaction, Bill, Page } from '../types/api';

export { BillPaymentsPage } from './BillPaymentsPage';

const BANK_OPTIONS = [
  'Serendib Bank',
  'Bank of Ceylon (BOC)',
  'Commercial Bank',
  'Hatton National Bank (HNB)',
  'Sampath Bank',
  'Seylan Bank',
  'Nations Trust Bank',
  'National Development Bank (NDB)',
  'People\'s Bank',
  'DFCC Bank',
  'Pan Asia Bank',
  'Union Bank',
  'National Savings Bank (NSB)'
];

export function TransfersPage() { return <PaymentPage />; }

function PaymentPage({ bill = false }: { bill?: boolean }) {
  const accounts = useApi<Page<Account>>('/api/accounts?size=100');
  const beneficiaries = useApi<Page<Beneficiary>>('/api/beneficiaries?size=100');

  const [transferOption, setTransferOption] = useState<'OWN' | 'OTHER' | 'SAVED'>('OWN');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [bankName, setBankName] = useState('Serendib Bank');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [billType, setBillType] = useState('ELECTRICITY');
  const [referenceNumber, setReference] = useState('');

  const [error, setError] = useState<unknown>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [otpId, setOtpId] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(0);

  const key = useRef(crypto.randomUUID());
  const navigate = useNavigate();

  function clearFields() {
    setAccountId('');
    setToAccountId('');
    setBankName('Serendib Bank');
    setBeneficiaryName('');
    setAccountNumber('');
    setBeneficiaryId('');
    setAmount('');
    setRemarks('');
    setReference('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccessMsg(null);

    if (!accountId) {
      setError(new Error('Please select a source account (From account).'));
      setBusy(false);
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError(new Error('Please enter a valid amount greater than 0.'));
      setBusy(false);
      return;
    }

    try {
      if (bill) {
        if (!referenceNumber.trim()) {
          setError(new Error('Please enter a valid bill reference number.'));
          setBusy(false);
          return;
        }
        const result = await send<Bill>('/api/bill-payments', {
          accountId: Number(accountId),
          billType,
          referenceNumber: referenceNumber.trim(),
          amount: String(amount)
        }, 'POST', key.current);
        setOtpId(result.transactionId);
        clearFields();
        setRevision(r => r + 1);
      } else {
        const formattedRemarks = remarks ? remarks.trim().slice(0, 20) : undefined;
        if (transferOption === 'OWN') {
          if (!toAccountId) {
            setError(new Error('Please select a destination account (To account).'));
            setBusy(false);
            return;
          }
          if (String(accountId) === String(toAccountId)) {
            setError(new Error('Source and destination accounts must be different.'));
            setBusy(false);
            return;
          }
          const result = await send<Transaction>('/api/transfers', {
            accountId: Number(accountId),
            toAccountId: Number(toAccountId),
            amount: String(amount),
            remarks: formattedRemarks
          }, 'POST', key.current);

          if (result.status === 'COMPLETED') {
            setSuccessMsg(`Instant transfer of ${money(String(amount))} completed successfully.`);
            clearFields();
            key.current = crypto.randomUUID();
            setRevision(r => r + 1);
            window.dispatchEvent(new Event('bank-transaction-completed'));
          }
        } else if (transferOption === 'OTHER') {
          if (!beneficiaryName.trim() || !accountNumber.trim()) {
            setError(new Error('Please fill in beneficiary name and account number.'));
            setBusy(false);
            return;
          }
          const result = await send<Transaction>('/api/transfers', {
            accountId: Number(accountId),
            bankName: bankName || 'Serendib Bank',
            beneficiaryName: beneficiaryName.trim(),
            accountNumber: accountNumber.trim(),
            amount: String(amount),
            remarks: formattedRemarks
          }, 'POST', key.current);

          setOtpId(result.transactionId);
          clearFields();
          key.current = crypto.randomUUID();
          setRevision(r => r + 1);
        } else {
          if (!beneficiaryId) {
            setError(new Error('Please select a saved beneficiary.'));
            setBusy(false);
            return;
          }
          const result = await send<Transaction>('/api/transfers', {
            accountId: Number(accountId),
            beneficiaryId: Number(beneficiaryId),
            amount: String(amount),
            remarks: formattedRemarks
          }, 'POST', key.current);

          setOtpId(result.transactionId);
          clearFields();
          key.current = crypto.randomUUID();
          setRevision(r => r + 1);
        }
      }
    } catch (e) {
      setError(e);
      key.current = crypto.randomUUID();
    } finally {
      setBusy(false);
    }
  }


  const selectedBeneficiary = beneficiaries.data?.content.find(b => b.beneficiaryId === Number(beneficiaryId));
  const activeAccounts = accounts.data?.content.filter(a => a.status === 'ACTIVE') || [];

  useEffect(() => {
    if (!accountId && activeAccounts.length > 0) {
      const primary = activeAccounts.find(a => a.isPrimary) || activeAccounts[0];
      if (primary) {
        setAccountId(String(primary.accountId));
      }
    }
  }, [activeAccounts, accountId]);

  return (
    <>
      <Heading
        title={bill ? 'Bill payments' : 'Send money'}
        subtitle={bill ? 'Take care of everyday payments with a secure confirmation.' : 'Choose your transfer option and send money easily.'}
        icon={bill ? '/images/page-icons/bill_payment.png' : '/images/page-icons/transfers.png'}
      />
      <div className="two-column">
        <Panel title={bill ? 'New bill payment' : 'New transfer'}>
          <ErrorMessage error={error || accounts.error || (!bill && beneficiaries.error)} />
          {successMsg && (
            <div className="callout" style={{ background: 'var(--color-success-bg, #e6f4ea)', color: 'var(--color-success, #137333)', marginBottom: '16px', padding: '12px' }}>
              ✓ {successMsg}
            </div>
          )}

          {!bill && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                className={`button ${transferOption === 'OWN' ? 'primary' : 'secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
                onClick={() => { setTransferOption('OWN'); setError(null); setSuccessMsg(null); }}
              >
                Own accounts
              </button>
              <button
                type="button"
                className={`button ${transferOption === 'OTHER' ? 'primary' : 'secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
                onClick={() => { setTransferOption('OTHER'); setError(null); setSuccessMsg(null); }}
              >
                Other accounts
              </button>
              <button
                type="button"
                className={`button ${transferOption === 'SAVED' ? 'primary' : 'secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
                onClick={() => { setTransferOption('SAVED'); setError(null); setSuccessMsg(null); }}
              >
                Saved
              </button>
            </div>
          )}

          <form onSubmit={submit}>
            <Field label="From account">
              <select required value={accountId} onChange={e => setAccountId(e.target.value)}>
                <option value="">Choose an account</option>
                {activeAccounts.map(a => (
                  <option key={a.accountId} value={a.accountId}>
                    {a.accountNumber} {a.isPrimary ? '⭐ (Primary)' : ''} · {money(a.balance)}
                  </option>
                ))}
              </select>
            </Field>

            {bill ? (
              <>
                <Field label="Biller">
                  <select value={billType} onChange={e => setBillType(e.target.value)}>
                    {['ELECTRICITY', 'WATER', 'TELEPHONE', 'INTERNET'].map(x => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Bill reference">
                  <input required minLength={3} maxLength={50} pattern="[A-Za-z0-9 /\-]{3,50}" value={referenceNumber} onChange={e => setReference(e.target.value)} />
                </Field>
              </>
            ) : transferOption === 'OWN' ? (
              <>
                <Field label="To account (Own account)">
                  <select required value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
                    <option value="">Choose destination account</option>
                    {activeAccounts.filter(a => String(a.accountId) !== accountId).map(a => (
                      <option key={a.accountId} value={a.accountId}>
                        {a.accountNumber} ({a.accountType}) · {money(a.balance)}
                      </option>
                    ))}
                  </select>
                </Field>
                <p className="fine-print" style={{ color: 'var(--color-primary, #0052cc)' }}>⚡ Own account transfers do not require OTP verification.</p>
              </>
            ) : transferOption === 'OTHER' ? (
              <>
                <Field label="Select bank">
                  <select required value={bankName} onChange={e => setBankName(e.target.value)}>
                    {BANK_OPTIONS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Beneficiary name">
                  <input required maxLength={100} value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} placeholder="Full name of beneficiary" />
                </Field>
                <Field label="Account number">
                  <input required inputMode="numeric" pattern="[0-9]{6,30}" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Recipient account number" />
                </Field>
              </>
            ) : (
              <>
                <Field label="Select saved beneficiary">
                  <select required value={beneficiaryId} onChange={e => setBeneficiaryId(e.target.value)}>
                    <option value="">Choose a saved recipient</option>
                    {beneficiaries.data?.content.map(b => (
                      <option key={b.beneficiaryId} value={b.beneficiaryId}>
                        {b.name} ({b.bankName})
                      </option>
                    ))}
                  </select>
                </Field>
                {selectedBeneficiary && (
                  <div style={{ padding: '12px', background: 'var(--color-bg-subtle, #f5f5f7)', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--color-border, #ddd)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Beneficiary details:</div>
                    <div style={{ marginTop: '4px', fontSize: '0.88rem' }}>
                      <div><strong>Beneficiary name:</strong> {selectedBeneficiary.name}</div>
                      <div><strong>Saved bank:</strong> {selectedBeneficiary.bankName}</div>
                      <div><strong>Account number:</strong> {selectedBeneficiary.accountNumber}</div>
                    </div>
                  </div>
                )}
                <Link to="/app/beneficiaries" style={{ display: 'inline-block', marginBottom: '16px' }}>Manage beneficiaries</Link>
              </>
            )}

            {!bill && (
              <Field label="Remarks (max 20 characters)">
                <input maxLength={20} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Short remarks (optional)" />
              </Field>
            )}

            <Field label="Amount (LKR)">
              <input required type="number" min="0.01" max="9999999999.99" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
            </Field>

            <button disabled={busy}>
              {busy ? 'Processing…' : (transferOption === 'OWN' && !bill) ? 'Transfer funds' : 'Continue to verification'}
            </button>
          </form>
        </Panel>

        <Panel title="A clear confirmation">
          <ol className="steps">
            <li>Choose your source account and recipient or biller.</li>
            <li>Check the amount and payment details.</li>
            <li>Confirm with your one-time verification code (for external & saved recipients).</li>
            <li>Find your confirmation in Transactions.</li>
          </ol>
          <div className="callout">No money moves until verification succeeds. Pending requests expire after 10 minutes.</div>
          <p className="fine-print">If a request times out, check your transaction history before starting a new payment.</p>
          <Link to="/app/transactions">Open transaction history</Link>
        </Panel>
      </div>

      {bill && <BillHistory revision={revision} page={page} setPage={setPage} />}
      {otpId && (
        <OtpDialog
          id={otpId}
          onClose={() => {
            clearFields();
            setOtpId(null);
            key.current = crypto.randomUUID();
            setRevision(r => r + 1);
            window.dispatchEvent(new Event('bank-transaction-completed'));
            navigate(`/app/transactions/${otpId}`);
          }}
          onComplete={() => {
            clearFields();
            setOtpId(null);
            key.current = crypto.randomUUID();
            setRevision(r => r + 1);
            window.dispatchEvent(new Event('bank-transaction-completed'));
            navigate(`/app/transactions/${otpId}`);
          }}
        />
      )}
    </>
  );
}

function BillHistory({ revision, page, setPage }: { revision: number; page: number; setPage: (page: number) => void }) {
  const { data, error, loading } = useApi<Page<Bill>>(`/api/bill-payments?page=${page}`, revision);
  return (
    <Panel title="Payment history">
      <ErrorMessage error={error} />
      {loading ? <Loading /> : data && (
        <>
          {data.content.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Biller / reference</th>
                    <th><Text value={"Amount"} /></th>
                    <th>Requested</th>
                    <th><Text value={"Status"} /></th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map(b => (
                    <tr key={b.paymentId}>
                      <td>{b.billType}<small>{b.referenceNumber}</small></td>
                      <td>{money(b.amount)}</td>
                      <td>{date(b.createdAt)}</td>
                      <td><StatusBadge status={b.status} /></td>
                      <td><Link to={`/app/transactions/${b.transactionId}`}>Transaction</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No bill payments yet.</Empty>
          )}
          <Pagination data={data} onPage={setPage} />
        </>
      )}
    </Panel>
  );
}

