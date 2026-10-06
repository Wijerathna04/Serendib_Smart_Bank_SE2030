import { useState } from 'react';
import { useApi } from './ui';
import { useLanguage } from '../i18n';

type Rates = { base: string; rates: Record<string, number>; updatedAt: string; stale: boolean };

const CURRENCY_INFO: Record<string, { name: string; symbol: string; flag: string }> = {
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺' },
  GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  AUD: { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  INR: { name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  JPY: { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  CHF: { name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  CNY: { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  AED: { name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  SAR: { name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  MYR: { name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  THB: { name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  KRW: { name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  QAR: { name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦' },
  KWD: { name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
  BHD: { name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭' },
  OMR: { name: 'Omani Rial', symbol: '﷼', flag: '🇴🇲' },
  ZAR: { name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  SEK: { name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' }
};

export default function ExchangeRates() {
  const [revision, setRevision] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data, loading, error } = useApi<Rates>('/api/exchange-rates', revision);
  const { t, language } = useLanguage();

  const valid = data && ['LKR', 'USD', 'EUR', 'GBP', 'AUD', 'INR'].every(code => Number.isFinite(data.rates?.[code]) && data.rates[code] > 0);

  // All available currency codes from API except LKR
  const availableCodes = data?.rates
    ? Object.keys(data.rates).filter(c => c !== 'LKR' && Number.isFinite(data.rates[c]) && data.rates[c] > 0)
    : [];

  // Filtered currency codes for "See more" modal
  const filteredCodes = availableCodes.filter(code => {
    const info = CURRENCY_INFO[code];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return code.toLowerCase().includes(q) || (info && info.name.toLowerCase().includes(q));
  });

  return (
    <section
      className="exchange-section exchange-rates-card"
      aria-labelledby="exchange-title"
    >
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="eyebrow">GLOBAL TELEMETRY &amp; FOREX RATES</span>
          <h2 id="exchange-title" style={{ fontSize: '1.6rem', fontFamily: 'Playfair Display', margin: '0.3rem 0' }}>
            {t('Exchange rates')}
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            {t('Indicative rates · 1 foreign currency unit in LKR')}
          </p>
        </div>
      </div>

      {loading ? (
        <p role="status" style={{ opacity: 0.8 }}>{t('Exchange rates')}…</p>
      ) : error || !valid ? (
        <div className="alert" role="alert">
          {t('Rates are unavailable. Please try again.')}{' '}
          <button className="button secondary small-btn" onClick={() => setRevision(v => v + 1)}>
            {t('Retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="rate-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {(['USD', 'EUR', 'GBP', 'AUD', 'INR'] as const).map(code => (
              <article
                className="rate-tile exchange-rate-tile"
                key={code}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem' }}>
                  <span className="currency-symbol" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-gold-primary)' }}>
                    {({ USD: '$', EUR: '€', GBP: '£', AUD: 'A$', INR: '₹' } as Record<string, string>)[code]}
                  </span>
                  <small style={{ fontWeight: 700, letterSpacing: '0.08em' }}>1 {code}</small>
                </div>
                <strong style={{ fontSize: '1.5rem', fontFamily: 'JetBrains Mono', display: 'block', margin: '0.25rem 0' }}>
                  {new Intl.NumberFormat(language === 'en' ? 'en-LK' : `${language}-LK`, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(data.rates.LKR / data.rates[code])}
                </strong>
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--color-gold-primary)', fontWeight: 700 }}>LKR</span>
              </article>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <button
              className="button secondary"
              onClick={() => setShowModal(true)}
              style={{
                fontSize: '0.8rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--color-gold-primary)',
                border: '1px solid var(--gold-border)'
              }}
            >
              See more ({availableCodes.length} currencies)
            </button>

            <small style={{ fontSize: '0.8rem', opacity: 0.75 }}>
              {t('Updated')}: {new Date(data.updatedAt).toLocaleString(language === 'en' ? 'en-LK' : `${language}-LK`)}
              {data.stale && <> · {t('Previously available rates. Refresh pending.')}</>}
            </small>
          </div>
        </>
      )}

      {/* SEE MORE - ALL EXCHANGE RATES MODAL */}
      {showModal && data && (
        <div
          className="modal-backdrop"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 11, 16, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="glass-card-modal exchange-directory-modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '820px',
              width: '100%',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <span className="eyebrow" style={{ color: 'var(--color-gold-primary)' }}>GLOBAL CURRENCY DIRECTORY</span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem' }}>All Foreign Exchange Rates in LKR</h3>
              </div>
              <button
                className="button secondary"
                onClick={() => setShowModal(false)}
                style={{ borderRadius: '50%', padding: '0.4rem 0.8rem' }}
              >
                ✕
              </button>
            </div>

            {/* Search Input inside modal */}
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="Search currency by code or name (e.g. JPY, CAD, Swiss Franc, Dirham)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'var(--card-subtle)',
                  border: '1px solid var(--border)',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            {/* Grid of all currencies */}
            {filteredCodes.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {filteredCodes.map(code => {
                  const info = CURRENCY_INFO[code] || { name: code, symbol: code, flag: '🌐' };
                  const lkrRate = data.rates.LKR / data.rates[code];
                  return (
                    <div
                      key={code}
                      className="exchange-modal-tile"
                      style={{
                        borderRadius: '16px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{info.flag} {info.symbol}</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--color-gold-primary)' }}>1 {code}</strong>
                      </div>
                      <small style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.8 }}>
                        {info.name}
                      </small>
                      <div>
                        <strong style={{ fontSize: '1.35rem', fontFamily: 'JetBrains Mono' }}>
                          {new Intl.NumberFormat(language === 'en' ? 'en-LK' : `${language}-LK`, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }).format(lkrRate)}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-gold-primary)', fontWeight: 700, marginLeft: '4px' }}>LKR</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textTransform: 'none', textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
                No exchange rates found matching "{searchQuery}".
              </div>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'right', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button className="button primary" onClick={() => setShowModal(false)}>
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
