import { useState, useEffect, useCallback, useRef } from 'react';
import ExchangeRates from '../components/ExchangeRates';
import { Text } from '../i18n';
import { BankStaffDashboard, BranchManagerDashboard, SystemAdministratorDashboard } from './StaffDashboards';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useApi, Heading, Panel, ErrorMessage, Loading, StatusBadge, Empty } from '../components/ui';
import { api, money, date } from '../api/client';
import type { Page, Account, Transaction, SpendingSummaryView } from '../types/api';

export default function DashboardPage() {
  const { role } = useAuth();
  if (role === 'EMPLOYEE') return <BankStaffDashboard />;
  if (role === 'MANAGER') return <BranchManagerDashboard />;
  if (role === 'ADMIN') return <SystemAdministratorDashboard />;
  return (
    <>
      <Heading title="Customer dashboard" subtitle="A clear view of what matters today." />
      <CustomerOverview />
    </>
  );
}

function Quick({ to, title, text }: { to: string; title: string; text: string }) {
  return (
    <Link className="quick-card" to={`/app/${to}`}>
      <h3><Text value={title} /></h3>
      <p><Text value={text} /></p>
    </Link>
  );
}

function CustomerOverview() {
  const accounts = useApi<Page<Account>>('/api/accounts?size=3');
  const transactions = useApi<Page<Transaction>>('/api/transactions?size=5');

  return (
    <>
      <div className="welcome-banner glass-card">
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px' }}>
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h2 style={{ fontSize: '1.8rem', margin: '0.4rem 0 0.6rem 0', fontFamily: 'Playfair Display' }}>
            <Text value={"Make room for tomorrow."} />
          </h2>
          <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '1.25rem' }}>
            <Text value={"Explore fixed deposits with clear terms, high yields and simulated returns."} />
          </p>
          <Link className="button" to="/app/fixed-deposits/new">
            Explore fixed deposits ↗
          </Link>
        </div>
        <span className="banner-symbol" style={{ opacity: 0.15, fontSize: '6rem', position: 'absolute', right: '1.5rem', bottom: '-1rem' }}>◇</span>
      </div>

      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'Playfair Display' }}><Text value={"Your accounts"} /></h2>
        <Link to="/app/accounts" style={{ fontSize: '0.9rem', fontWeight: 600 }}><Text value={"View all"} /></Link>
      </div>

      <ErrorMessage error={accounts.error} />
      {accounts.loading ? (
        <Loading />
      ) : (
        <div className="account-grid">
          {accounts.data?.content.map(a => (
            <Link className="account-card glass-card" key={a.accountId} to={`/app/accounts/${a.accountId}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.accountType}</span>
                <StatusBadge status={a.status} />
              </div>
              <strong style={{ fontSize: '1.75rem', fontFamily: 'Playfair Display', margin: '0.75rem 0 0.25rem 0', display: 'block' }}>{money(a.balance)}</strong>
              <small className="mono">{a.accountNumber}</small>
            </Link>
          ))}
          {accounts.data?.totalElements === 0 && <Empty>No accounts have been provisioned yet.</Empty>}
        </div>
      )}

      <div className="quick-grid" style={{ margin: '2rem 0' }}>
        <Quick to="transfers" title="Send money" text="Transfer to a saved beneficiary with instant verification" />
        <Quick to="bill-payments" title="Pay a bill" text="Take care of utility and everyday provider payments" />
        <Quick to="beneficiaries" title="Your people" text="Manage saved recipients and fast-transfer contacts" />
      </div>

      <ExchangeRates />

      <MonthlySpendingChartTile />

      <PersonalBankingNotesTile />

      <Panel title="Recent activity">
        <ErrorMessage error={transactions.error} />
        {transactions.loading ? (
          <Loading />
        ) : transactions.data?.content.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th><Text value={"Transaction"} /></th>
                  <th><Text value={"Date"} /></th>
                  <th><Text value={"Amount"} /></th>
                  <th><Text value={"Status"} /></th>
                </tr>
              </thead>
              <tbody>
                {transactions.data.content.map(t => (
                  <tr key={t.transactionId}>
                    <td>
                      <Link to={`/app/transactions/${t.transactionId}`}>{t.description}</Link>
                      <small className="mono">#{t.transactionId} · {t.transactionType}</small>
                    </td>
                    <td>{date(t.createdAt)}</td>
                    <td style={{ fontWeight: 600, fontFamily: 'JetBrains Mono' }}>{money(t.amount)}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Your transaction activity will appear here.</Empty>
        )}
      </Panel>
    </>
  );
}

function PersonalBankingNotesTile() {
  const { user } = useAuth();
  const notesStorageKey = user?.userId ? `sb_customer_personal_notes_${user.userId}` : 'sb_customer_personal_notes';

  const [notes, setNotes] = useState<{ id: string; title: string; text: string; date: string }[]>(() => {
    try {
      const saved = localStorage.getItem(notesStorageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(notesStorageKey);
      setNotes(saved ? JSON.parse(saved) : []);
    } catch (e) {
      console.error(e);
    }
  }, [notesStorageKey]);

  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;
    const updated = [
      {
        id: Date.now().toString(),
        title: newTitle.trim(),
        text: newText.trim(),
        date: new Date().toLocaleDateString()
      },
      ...notes
    ];
    setNotes(updated);
    try {
      localStorage.setItem(notesStorageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setNewTitle('');
    setNewText('');
    setShowAddForm(false);
  }

  function handleDeleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    try {
      localStorage.setItem(notesStorageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="glass-card" style={{ padding: '1.5rem', margin: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', margin: 0, fontFamily: 'Playfair Display', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📝 My Personal Banking Notes
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
            Save financial reminders, bill notes, and targets directly on your dashboard.
          </p>
        </div>
        <button
          className="button secondary"
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ New Note'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSaveNote} style={{ marginBottom: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Note Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Salary Allocation / FD Target"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'inherit' }}
            />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Note Details</label>
            <textarea
              required
              rows={3}
              placeholder="Write your note details here..."
              value={newText}
              onChange={e => setNewText(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'inherit', resize: 'vertical' }}
            />
          </div>
          <button className="button" type="submit" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
            Save Note
          </button>
        </form>
      )}

      {notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', opacity: 0.6, fontSize: '0.9rem' }}>
          No personal notes saved yet. Click "+ New Note" above to write one.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {notes.map(n => (
            <div key={n.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong style={{ fontSize: '0.95rem', color: '#38bdf8' }}>{n.title}</strong>
                <button
                  onClick={() => handleDeleteNote(n.id)}
                  title="Delete note"
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', opacity: 0.8 }}
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: '0.5rem 0', fontSize: '0.88rem', opacity: 0.9, lineHeight: '1.4' }}>{n.text}</p>
              <small style={{ fontSize: '0.75rem', opacity: 0.5, display: 'block' }}>Saved: {n.date}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  UTILITY_BILLS: { icon: '⚡', color: '#10b981' },
  MONEY_TRANSFERS: { icon: '💸', color: '#3b82f6' },
  CARD_PURCHASES: { icon: '💳', color: '#8b5cf6' },
  LOANS_INVESTMENTS: { icon: '🏦', color: '#f59e0b' },
  OTHER: { icon: '📦', color: '#64748b' }
};

function MonthlySpendingChartTile() {
  const [summary, setSummary] = useState<SpendingSummaryView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayTotal, setDisplayTotal] = useState<number>(0);
  const [displayCategoryAmounts, setDisplayCategoryAmounts] = useState<Record<string, number>>({});
  
  const animRef = useRef<number | null>(null);
  const prevMonthKeyRef = useRef<string | null>(null);
  const summaryRef = useRef<SpendingSummaryView | null>(null);
  const displayTotalRef = useRef<number>(0);
  const displayCategoryAmountsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  useEffect(() => {
    displayTotalRef.current = displayTotal;
  }, [displayTotal]);

  useEffect(() => {
    displayCategoryAmountsRef.current = displayCategoryAmounts;
  }, [displayCategoryAmounts]);

  const animateValues = useCallback((
    fromTotal: number,
    fromCats: Record<string, number>,
    toTotal: number,
    toCats: Record<string, number>,
    duration: number,
    onComplete?: () => void
  ) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const curTotal = fromTotal + (toTotal - fromTotal) * easeOut;
      setDisplayTotal(curTotal);

      const curCats: Record<string, number> = {};
      const keys = new Set([...Object.keys(fromCats), ...Object.keys(toCats)]);
      keys.forEach(k => {
        const start = fromCats[k] || 0;
        const end = toCats[k] || 0;
        curCats[k] = start + (end - start) * easeOut;
      });
      setDisplayCategoryAmounts(curCats);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null;
        if (onComplete) onComplete();
      }
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  const fetchSummary = useCallback(async (isBackground = false) => {
    if (!isBackground && !summaryRef.current) {
      setLoading(true);
    }
    try {
      const data = await api<SpendingSummaryView>('/api/customers/me/spending-summary');
      setError(null);

      const newTotal = parseFloat(data.total) || 0;
      const newCatAmounts: Record<string, number> = {};
      data.categories.forEach(c => {
        newCatAmounts[c.key] = parseFloat(c.amount) || 0;
      });

      const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prevMonthKeyRef.current && prevMonthKeyRef.current !== data.monthKey) {
        if (prefersReduced) {
          setDisplayTotal(newTotal);
          setDisplayCategoryAmounts(newCatAmounts);
        } else {
          animateValues(displayTotalRef.current, displayCategoryAmountsRef.current, 0, {}, 400, () => {
            animateValues(0, {}, newTotal, newCatAmounts, 600);
          });
        }
      } else {
        if (prefersReduced) {
          setDisplayTotal(newTotal);
          setDisplayCategoryAmounts(newCatAmounts);
        } else {
          const startTotal = summaryRef.current ? displayTotalRef.current : 0;
          const startCatAmounts = summaryRef.current ? { ...displayCategoryAmountsRef.current } : {};
          animateValues(startTotal, startCatAmounts, newTotal, newCatAmounts, summaryRef.current ? 600 : 900);
        }
      }

      prevMonthKeyRef.current = data.monthKey;
      setSummary(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to update spending analytics');
    } finally {
      setLoading(false);
    }
  }, [animateValues]);

  useEffect(() => {
    fetchSummary();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchSummary(true);
      }
    }, 15000);

    const handleFocus = () => {
      fetchSummary(true);
    };

    const handleRefresh = () => {
      fetchSummary(true);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('sb:refresh-spending', handleRefresh);
    window.addEventListener('bank-transaction-completed', handleRefresh);

    return () => {
      clearInterval(interval);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('sb:refresh-spending', handleRefresh);
      window.removeEventListener('bank-transaction-completed', handleRefresh);
    };
  }, [fetchSummary]);

  const totalSpentNum = parseFloat(summary?.total || '0') || 0;
  const isEmpty = totalSpentNum === 0;
  const circumference = 2 * Math.PI * 40;
  let cumulativeOffset = 0;

  return (
    <div className="spend-tile">
      <div className="spend-header">
        <div>
          <h3 className="spend-title">
            📊 <Text value="Monthly Spending Analytics" />
          </h3>
          <span className="spend-reset-badge">
            🔄 {summary?.monthLabel || 'Current Month'} (Resets in {summary?.daysUntilReset ?? 0} days)
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <small className="spend-total-label"><Text value="Total Spending" /></small>
          <strong className="spend-total-amount">
            LKR {displayTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.5rem 0.75rem', marginBottom: '1rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && !summary ? (
        <div className="spend-rows">
          <div className="spend-skeleton" />
          <div className="spend-skeleton" />
          <div className="spend-skeleton" />
        </div>
      ) : (
        <div className="spend-grid">
          {/* Round SVG Donut Chart */}
          <div className="spend-donut-container">
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                strokeWidth="12"
                className="spend-track"
              />
              {!isEmpty && summary?.categories.map((item) => {
                const meta = CATEGORY_META[item.key] || { icon: '📦', color: '#64748b' };
                const catAmount = displayCategoryAmounts[item.key] ?? parseFloat(item.amount);
                const pct = totalSpentNum > 0 ? (catAmount / totalSpentNum) * 100 : item.percent;
                const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativeOffset;
                cumulativeOffset += (pct / 100) * circumference;

                return (
                  <circle
                    key={item.key}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={meta.color}
                    strokeWidth="12"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dasharray 0.3s ease, stroke-dashoffset 0.3s ease', cursor: 'pointer' }}
                  >
                    <title>{`${item.label}: LKR ${catAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${item.percent}%)`}</title>
                  </circle>
                );
              })}
            </svg>
            <div className="spend-donut-center">
              <span className="spend-center-sub">Monthly</span>
              <strong className="spend-center-title">
                {isEmpty ? '0' : summary?.categories.filter(c => parseFloat(c.amount) > 0).length || 0} Sectors
              </strong>
              <small style={{ fontSize: '0.65rem', color: isEmpty ? 'var(--ink-soft)' : 'var(--success)' }}>
                {isEmpty ? 'Inactive' : 'Active'}
              </small>
            </div>
          </div>

          {/* Categories Breakdown Legend */}
          <div className="spend-rows">
            {isEmpty ? (
              <div className="spend-empty-state">
                <p style={{ margin: 0, fontWeight: 500 }}><Text value="No spending yet this month" /></p>
                <small style={{ fontSize: '0.78rem', opacity: 0.8 }}><Text value="Completed payments and transfers will appear here automatically." /></small>
              </div>
            ) : (
              summary?.categories.map((item) => {
                const meta = CATEGORY_META[item.key] || { icon: '📦', color: '#64748b' };
                const catAmount = displayCategoryAmounts[item.key] ?? parseFloat(item.amount);
                return (
                  <div
                    key={item.key}
                    className="spend-row"
                    style={{ borderLeftColor: meta.color }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span>
                      <div>
                        <span className="spend-label"><Text value={item.label} /></span>
                        <small className="spend-sub">{item.percent}% <Text value="% of this month's spending" /></small>
                      </div>
                    </div>
                    <strong className="spend-amount">
                      LKR {catAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

