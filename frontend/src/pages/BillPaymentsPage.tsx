import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { send, money, date } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { useApi, Heading, Panel, Field, ErrorMessage, StatusBadge, Pagination, Loading, Empty } from '../components/ui';
import { OtpDialog } from '../components/OtpDialog';
import { ReceiptModal } from '../components/ReceiptModal';
import { BILL_CATEGORIES, SRI_LANKAN_BILLERS, SriLankanBiller } from '../data/sriLankanBillers';
import type { Account, Bill, Page, FavouriteBiller, Transaction } from '../types/api';
import { autoScrollTo } from '../utils/scrollHelper';

export function BillPaymentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const key = useRef(crypto.randomUUID());

  const favStorageKey = user?.userId ? `sb_favourite_billers_${user.userId}` : 'sb_favourite_billers';

  // API Data
  const accounts = useApi<Page<Account>>('/api/accounts?size=100');
  const favApi = useApi<FavouriteBiller[]>('/api/favourite-billers');
  
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBiller, setSelectedBiller] = useState<SriLankanBiller | null>(SRI_LANKAN_BILLERS[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Form State
  const [accountId, setAccountId] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [saveAsFav, setSaveAsFav] = useState<boolean>(false);
  const [favNickname, setFavNickname] = useState<string>('');

  // Local Storage Favourites Fallback (Scoped to Customer User ID)
  const [localFavs, setLocalFavs] = useState<FavouriteBiller[]>(() => {
    try {
      const saved = localStorage.getItem(favStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(favStorageKey);
      setLocalFavs(saved ? JSON.parse(saved) : []);
    } catch {
      setLocalFavs([]);
    }
  }, [favStorageKey]);

  // Combine API & Local Favourites
  const favourites: FavouriteBiller[] = (favApi.data && favApi.data.length > 0) ? favApi.data : localFavs;

  // Transaction / OTP & Receipt Modal State
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [otpId, setOtpId] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [selectedTxnForReceipt, setSelectedTxnForReceipt] = useState<Transaction | null>(null);
  const [favModalBiller, setFavModalBiller] = useState<SriLankanBiller | null>(null);
  const [quickNickInput, setQuickNickInput] = useState('');

  useEffect(() => {
    if (!accountId && accounts.data?.content) {
      const active = accounts.data.content.filter((a) => a.status === 'ACTIVE');
      const primary = active.find((a) => a.isPrimary) || active[0];
      if (primary) {
        setAccountId(String(primary.accountId));
      }
    }
  }, [accounts.data, accountId]);

  // Filtered Billers
  const filteredBillers = SRI_LANKAN_BILLERS.filter((b) => {
    const matchCat = selectedCategory === 'ALL' || b.category === selectedCategory;
    const matchSearch = searchQuery.trim() === '' || b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Handle Biller Selection
  const selectBiller = (biller: SriLankanBiller) => {
    setSelectedBiller(biller);
    setReferenceNumber(biller.sampleRef || '');
    if (formRef.current) {
      autoScrollTo(formRef.current, 95, 600);
    }
  };

  // Handle Category Selection with Auto-Scroll to Payment Details Area
  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    if (catId !== 'ALL') {
      const firstBiller = SRI_LANKAN_BILLERS.find((b) => b.category === catId);
      if (firstBiller) {
        setSelectedBiller(firstBiller);
        setReferenceNumber(firstBiller.sampleRef || '');
      }
    }
    // Smooth scroll to the New Bill Payment section
    setTimeout(() => {
      if (formRef.current) {
        autoScrollTo(formRef.current, 95, 600);
      }
    }, 40);
  };

  // Quick Pay from Favourite Biller
  const handleQuickPay = (fav: FavouriteBiller) => {
    const matchedBiller = SRI_LANKAN_BILLERS.find(b => b.name.toLowerCase() === fav.billerName.toLowerCase()) || 
                          SRI_LANKAN_BILLERS.find(b => b.category === fav.billerCategory) ||
                          SRI_LANKAN_BILLERS[0];
    setSelectedBiller(matchedBiller);
    setSelectedCategory(fav.billerCategory);
    setReferenceNumber(fav.referenceNumber);
    if (fav.defaultAmount) setAmount(fav.defaultAmount);
    if (formRef.current) {
      autoScrollTo(formRef.current, 95, 600);
    }
  };

  // Add Favourite Biller
  const handleSaveFavourite = async (billerName: string, category: string, refNum: string, nickname: string, defaultAmt?: string) => {
    const newFav: FavouriteBiller = {
      favouriteId: Date.now(),
      billerCategory: category,
      billerName: billerName,
      nickname: nickname || billerName,
      referenceNumber: refNum,
      defaultAmount: defaultAmt || null,
      createdAt: new Date().toISOString()
    };

    try {
      await send('/api/favourite-billers', {
        billerCategory: category,
        billerName: billerName,
        nickname: nickname || billerName,
        referenceNumber: refNum,
        defaultAmount: defaultAmt ? Number(defaultAmt) : null
      });
      // Saved to backend
    } catch {
      // Local fallback
      const updated = [newFav, ...localFavs];
      setLocalFavs(updated);
      localStorage.setItem(favStorageKey, JSON.stringify(updated));
    }
  };

  // Delete Favourite Biller
  const handleDeleteFavourite = async (favId: number) => {
    try {
      await send(`/api/favourite-billers/${favId}`, {}, 'DELETE');
    } catch {
      const updated = localFavs.filter(f => f.favouriteId !== favId);
      setLocalFavs(updated);
      localStorage.setItem(favStorageKey, JSON.stringify(updated));
    }
  };

  // Submit Bill Payment
  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBiller) return;
    setBusy(true);
    setError(null);

    try {
      const bType = selectedBiller.category || 'UTILITY';
      const result = await send<Bill>('/api/bill-payments', {
        accountId: Number(accountId),
        billType: bType,
        referenceNumber: referenceNumber.trim(),
        amount: amount
      }, 'POST', key.current);

      // Save as favourite if checked
      if (saveAsFav) {
        await handleSaveFavourite(selectedBiller.name, selectedBiller.category, referenceNumber.trim(), favNickname || selectedBiller.name, amount);
      }

      setOtpId(result.transactionId);
      setReferenceNumber('');
      setAmount('');
      setFavNickname('');
      setSaveAsFav(false);
      setRevision((r) => r + 1);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="bill-payments-dashboard">
      <Heading
        title="Sri Lankan Bill Payments & Recurring Services"
        subtitle="Pay electricity, water, telecom, insurance, taxes & university fees instantly with 2FA verification."
        icon="/images/page-icons/bill_payment.png"
      />

      <div 
        className="welcome-banner glass-card"
        style={{
          '--banner-bg-img': "url('/images/financial_chart_banner.jpeg')",
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          marginBottom: '2rem'
        } as React.CSSProperties}
      >
        <span className="eyebrow">INSTANT UTILITY & INSTITUTIONAL SETTLEMENTS</span>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'Playfair Display', margin: '0.35rem 0 0.5rem 0' }}>
          Sri Lanka Payment Network &amp; CEFT Gateway
        </h2>
        <p style={{ margin: 0, maxWidth: '620px', opacity: 0.9, fontSize: '0.95rem' }}>
          Settle CEB, LECO, NWSDB, Dialog, SLT, and inland revenue obligations with real-time OTP confirmation and downloadable official PDF payment vouchers.
        </p>
      </div>

      {/* SECTION 1: 11 BILL CATEGORY TILES */}
      <div className="category-section">
        <div className="section-title-bar">
          <div>
            <h3>Categories</h3>
            <small>Select a category to explore Sri Lankan billers</small>
          </div>
          {selectedCategory !== 'ALL' && (
            <button className="button secondary small-btn" onClick={() => handleCategorySelect('ALL')}>
              Show All Categories (11)
            </button>
          )}
        </div>

        <div className="category-tiles-grid">
          {BILL_CATEGORIES.map((cat) => {
            const count = SRI_LANKAN_BILLERS.filter((b) => b.category === cat.id).length;
            const isActive = selectedCategory === cat.id;

            return (
              <div
                key={cat.id}
                className={`category-tile-card ${isActive ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat.id)}
              >
                <div className="tile-icon-wrap">{cat.icon}</div>
                <div className="tile-info">
                  <strong>{cat.name}</strong>
                  <small>{count} Biller{count === 1 ? '' : 's'}</small>
                </div>
                {isActive && <span className="active-dot">●</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: FAVOURITE BILLERS LIST */}
      <div className="favourites-section-panel">
        <div className="section-title-bar">
          <div>
            <h3>⭐ Favourite Billers ({favourites.length})</h3>
            <small>Quick recurring payments with saved reference numbers</small>
          </div>
        </div>

        {favourites.length > 0 ? (
          <div className="favourites-cards-grid">
            {favourites.map((fav) => {
              const matchedBiller = SRI_LANKAN_BILLERS.find(b => b.name.toLowerCase() === fav.billerName.toLowerCase());

              return (
                <div key={fav.favouriteId} className="favourite-biller-card">
                  <div className="fav-card-top">
                    {matchedBiller?.logoUrl ? (
                      <img src={matchedBiller.logoUrl} alt={fav.billerName} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain', background: '#fff', padding: '2px', border: '1px solid rgba(255,255,255,0.2)' }} />
                    ) : matchedBiller?.logoSvg ? (
                      <div className="biller-logo-sm" dangerouslySetInnerHTML={{ __html: matchedBiller.logoSvg }} />
                    ) : (
                      <span className="fav-generic-icon">⭐</span>
                    )}
                    <div>
                      <strong>{fav.nickname}</strong>
                      <span className="fav-biller-tag">{fav.billerName}</span>
                    </div>
                  </div>
                  <div className="fav-ref-box">
                    <small>Ref / Account No.</small>
                    <code>{fav.referenceNumber}</code>
                  </div>
                  {fav.defaultAmount && (
                    <div className="fav-amount-tag">
                      Default: LKR {fav.defaultAmount}
                    </div>
                  )}
                  <div className="fav-card-actions">
                    <button className="button primary small-btn" onClick={() => handleQuickPay(fav)}>
                      ⚡ Quick Pay
                    </button>
                    <button className="button secondary danger small-btn" onClick={() => handleDeleteFavourite(fav.favouriteId)}>
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-favs-box">
            <p>No saved favourite billers yet. You can save your frequent billers (CEB, SLT, NWSDB, etc.) for 1-click recurring payments!</p>
          </div>
        )}
      </div>

      {/* SECTION 3: SRI LANKAN BILLERS SELECTION GRID & PAYMENT FORM */}
      <div className="two-column bill-payment-main-grid">
        {/* Left Column: Sri Lankan Billers Catalog */}
        <Panel title={`Sri Lankan Billers ${selectedCategory !== 'ALL' ? `(${selectedCategory})` : ''}`}>
          <div className="biller-search-bar">
            <input
              type="text"
              placeholder="🔍 Search biller by name or keyword (e.g. CEB, Dialog, SLT, SLIIT, IRD)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="billers-catalog-list">
            {filteredBillers.map((biller) => {
              const isSelected = selectedBiller?.id === biller.id;
              const isFav = favourites.some((f) => f.billerName.toLowerCase() === biller.name.toLowerCase());

              return (
                <div key={biller.id} className={`biller-catalog-item ${isSelected ? 'selected' : ''}`}>
                  <div className="biller-item-left">
                    {biller.logoUrl ? (
                      <img src={biller.logoUrl} alt={biller.name} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'contain', background: '#fff', padding: '3px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }} />
                    ) : (
                      <div className="biller-logo-md" dangerouslySetInnerHTML={{ __html: biller.logoSvg }} />
                    )}
                    <div>
                      <div className="biller-header-line">
                        <strong>{biller.name}</strong>
                        {biller.popular && <span className="popular-badge">POPULAR</span>}
                      </div>
                      <small className="biller-ref-hint">Format: {biller.refLabel}</small>
                    </div>
                  </div>

                  <div className="biller-item-actions">
                    <button className="button primary small-btn" onClick={() => selectBiller(biller)}>
                      {isSelected ? '✓ Selected' : 'Pay Now'}
                    </button>
                    <button
                      className={`button secondary small-btn ${isFav ? 'active-fav' : ''}`}
                      title={isFav ? 'Already in Favourites' : 'Add to Favourites'}
                      onClick={() => {
                        setFavModalBiller(biller);
                        setQuickNickInput(biller.name);
                      }}
                    >
                      {isFav ? '★ Saved' : '☆ Save'}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredBillers.length === 0 && (
              <Empty>No Sri Lankan billers found for the selected category or search filter.</Empty>
            )}
          </div>
        </Panel>

        {/* Right Column: Payment Form */}
        <div ref={formRef}>
          <Panel title="New Bill Payment">
            {selectedBiller && (
              <div className="selected-biller-banner">
                {selectedBiller.logoUrl ? (
                  <img src={selectedBiller.logoUrl} alt={selectedBiller.name} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'contain', background: '#fff', padding: '3px', border: '1px solid rgba(255,255,255,0.2)' }} />
                ) : (
                  <div className="biller-logo-md" dangerouslySetInnerHTML={{ __html: selectedBiller.logoSvg }} />
                )}
                <div>
                  <small>Selected Biller</small>
                  <h4>{selectedBiller.name}</h4>
                  <span className="cat-badge">{selectedBiller.category}</span>
                </div>
              </div>
            )}

            <ErrorMessage error={error || accounts.error} />

            <form onSubmit={submitPayment}>
              <Field label="From Source Account">
                <select required value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  <option value="">Choose your funding account</option>
                  {accounts.data?.content
                    .filter((a) => a.status === 'ACTIVE')
                    .map((a) => (
                      <option key={a.accountId} value={a.accountId}>
                        {a.accountNumber} ({a.accountType}) {a.isPrimary ? '⭐ (Primary)' : ''} · {money(a.balance)}
                      </option>
                    ))}
                </select>
              </Field>

              <Field label={selectedBiller ? selectedBiller.refLabel : 'Bill Reference Number'}>
                <input
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="[A-Za-z0-9 /\-]{3,50}"
                  placeholder={selectedBiller ? selectedBiller.refPlaceholder : 'e.g. 10-digit Account / Meter No.'}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </Field>

              <Field label="Amount (LKR)">
                <input
                  required
                  type="number"
                  min="0.01"
                  max="9999999999.99"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>

              {/* Save to Favourites Option */}
              <div className="save-fav-checkbox-box">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={saveAsFav}
                    onChange={(e) => setSaveAsFav(e.target.checked)}
                  />
                  <span>⭐ Save this biller & reference to my Favourite List</span>
                </label>

                {saveAsFav && (
                  <Field label="Custom Nickname (e.g. Home Electricity, My SLT Fibre)">
                    <input
                      type="text"
                      maxLength={50}
                      placeholder={selectedBiller ? selectedBiller.name : 'My Biller'}
                      value={favNickname}
                      onChange={(e) => setFavNickname(e.target.value)}
                    />
                  </Field>
                )}
              </div>

              <button className="button primary full-width" disabled={busy || !accountId}>
                {busy ? 'Preparing Transaction…' : 'Continue to Verification'}
              </button>
            </form>
          </Panel>
        </div>
      </div>

      {/* SECTION 4: PAYMENT HISTORY & RECEIPT GENERATOR */}
      <BillPaymentHistory
        revision={revision}
        page={historyPage}
        setPage={setHistoryPage}
        onOpenReceipt={(b) => {
          // Construct simulated transaction object for ReceiptModal
          const simulatedTxn: Transaction & { billerName?: string; billerCategory?: string; referenceNumber?: string } = {
            transactionId: b.transactionId,
            fromAccountId: b.accountId,
            toAccountId: null,
            amount: b.amount,
            transactionType: 'BILL_PAYMENT',
            status: b.status,
            description: `${b.billType} Bill Payment - Ref: ${b.referenceNumber}`,
            createdAt: b.createdAt,
            completedAt: b.createdAt,
            authorizationExpiresAt: null,
            canAuthorize: false,
            failureCode: null,
            billerName: b.billType,
            billerCategory: b.billType,
            referenceNumber: b.referenceNumber
          };
          setSelectedTxnForReceipt(simulatedTxn);
        }}
      />

      {/* OTP Dialog */}
      {otpId && (
        <OtpDialog
          id={otpId}
          onClose={() => {
            setOtpId(null);
            key.current = crypto.randomUUID();
            setRevision((r) => r + 1);
            window.dispatchEvent(new Event('bank-transaction-completed'));
            navigate(`/app/transactions/${otpId}`);
          }}
          onComplete={() => {
            key.current = crypto.randomUUID();
            const currentOtpId = otpId;
            setOtpId(null);
            window.dispatchEvent(new Event('bank-transaction-completed'));
            navigate(`/app/transactions/${currentOtpId}`);
          }}
        />
      )}

      {/* Quick Add Favourite Modal */}
      {favModalBiller && (
        <div className="modal-backdrop" onClick={() => setFavModalBiller(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Save {favModalBiller.name} to Favourites</h3>
            <p>Save this biller to your account for quick 1-click recurring payments.</p>
            <Field label="Reference / Account Number">
              <input
                type="text"
                value={referenceNumber || favModalBiller.sampleRef}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </Field>
            <Field label="Nickname">
              <input
                type="text"
                value={quickNickInput}
                onChange={(e) => setQuickNickInput(e.target.value)}
              />
            </Field>
            <div className="modal-actions">
              <button
                className="button primary"
                onClick={async () => {
                  await handleSaveFavourite(favModalBiller.name, favModalBiller.category, referenceNumber || favModalBiller.sampleRef, quickNickInput);
                  setFavModalBiller(null);
                }}
              >
                Save Favourite
              </button>
              <button className="button secondary" onClick={() => setFavModalBiller(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedTxnForReceipt && (
        <ReceiptModal
          transaction={selectedTxnForReceipt}
          onClose={() => setSelectedTxnForReceipt(null)}
        />
      )}
    </div>
  );
}

function BillPaymentHistory({
  revision,
  page,
  setPage,
  onOpenReceipt
}: {
  revision: number;
  page: number;
  setPage: (p: number) => void;
  onOpenReceipt: (b: Bill) => void;
}) {
  const { data, error, loading } = useApi<Page<Bill>>(`/api/bill-payments?page=${page}`, revision);

  return (
    <Panel title="Bill Payment History & Electronic Receipts">
      <ErrorMessage error={error} />
      {loading ? (
        <Loading />
      ) : data ? (
        <>
          {data.content.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Biller / Category</th>
                    <th>Bill Reference</th>
                    <th>Amount (LKR)</th>
                    <th>Requested Date</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((b) => (
                    <tr key={b.paymentId}>
                      <td>
                        <strong>{b.billType}</strong>
                      </td>
                      <td>
                        <code>{b.referenceNumber}</code>
                      </td>
                      <td>{money(b.amount)}</td>
                      <td>{date(b.createdAt)}</td>
                      <td>
                        <StatusBadge status={b.status} />
                      </td>
                      <td>
                        {b.status === 'COMPLETED' ? (
                          <button className="button secondary small-btn" onClick={() => onOpenReceipt(b)}>
                            📄 Receipt (PDF/PNG)
                          </button>
                        ) : (
                          <Link to={`/app/transactions/${b.transactionId}`}>View</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No bill payments recorded yet.</Empty>
          )}
          <Pagination data={data} onPage={setPage} />
        </>
      ) : null}
    </Panel>
  );
}
