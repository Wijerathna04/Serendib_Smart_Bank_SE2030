import { LanguageButtons, Text } from '../i18n';
import { staffTools, managerTools, adminTools } from '../pages/StaffDashboards';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { AiChatbotAssistant } from './AiChatbotAssistant';
import { WhatsAppAgentButton } from './WhatsAppAgentButton';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';
import { autoScrollTo } from '../utils/scrollHelper';
import { KycPromptModal } from './KycPromptModal';
import { FirstLoginPasswordModal } from './FirstLoginPasswordModal';
import ThemeToggle from './ThemeToggle';
import type { Role } from '../types/api';

const TAB_ICONS: Record<string, ReactNode> = {
  'overview': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  'accounts': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  'fixed-deposits': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  'transfers': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><line x1="3" y1="5" x2="21" y2="5"/><polyline points="7 23 3 19 7 15"/><line x1="21" y1="19" x2="3" y2="19"/></svg>,
  'transactions': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  'beneficiaries': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  'bill-payments': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  'loans': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="12 3 2 10 22 10"/><line x1="6" y1="10" x2="6" y2="21"/><line x1="10" y1="10" x2="10" y2="21"/><line x1="14" y1="10" x2="14" y2="21"/><line x1="18" y1="10" x2="18" y2="21"/></svg>,
  'cards': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  'feedback': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  'employee/customers': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
  'employee/accounts': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  'employee/loans': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><polyline points="9 14 11 16 15 12"/></svg>,
  'employee/cards': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>,
  'employee/feedback': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  'manager/all-accounts': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  'manager/approvals': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  'manager/loans': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  'admin/operations': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  'admin/users': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  'admin/audit': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  'notifications': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  'reviews': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  'profile': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
};

const links: Record<Role, [string, string, ReactNode][]> = {
  CUSTOMER: [
    ['accounts', 'Accounts', TAB_ICONS['accounts']],
    ['fixed-deposits', 'Fixed deposits', TAB_ICONS['fixed-deposits']],
    ['transfers', 'Transfers', TAB_ICONS['transfers']],
    ['transactions', 'History', TAB_ICONS['transactions']],
    ['beneficiaries', 'Beneficiaries', TAB_ICONS['beneficiaries']],
    ['bill-payments', 'Bill payments', TAB_ICONS['bill-payments']],
    ['loans', 'Loans', TAB_ICONS['loans']],
    ['cards', 'Cards', TAB_ICONS['cards']],
    ['feedback', 'Feedback', TAB_ICONS['feedback']]
  ],
  EMPLOYEE: staffTools.map(([path, label]) => [path, label, TAB_ICONS[path] || TAB_ICONS['accounts']]),
  MANAGER: managerTools.map(([path, label]) => [path, label, TAB_ICONS[path] || TAB_ICONS['accounts']]),
  ADMIN: adminTools.map(([path, label]) => [path, label, TAB_ICONS[path] || TAB_ICONS['accounts']])
};

export function AppLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);

  // Prompt logged-in customer to upload NIC front/back images and profile picture if incomplete
  useEffect(() => {
    if (role === 'CUSTOMER' && user) {
      const isMissingNicFront = !user.nicFrontImage || user.nicFrontImage.includes('dummyimage');
      const isMissingNicBack = !user.nicBackImage || user.nicBackImage.includes('dummyimage');
      const isMissingAvatar = !user.profileImage || user.profileImage.includes('avataaars');
      if (isMissingNicFront || isMissingNicBack || isMissingAvatar) {
        const key = `kyc_modal_prompted_${user.userId}`;
        if (!sessionStorage.getItem(key)) {
          setShowKycModal(true);
          sessionStorage.setItem(key, 'true');
        }
      }
    }
  }, [role, user]);

  useEffect(() => {
    let active = true;
    const load = () => api<{ count: number }>('/api/notifications/unread-count').then(v => { if (active) setCount(v.count); }).catch(() => {});
    load();
    const timer = window.setInterval(load, 60000);
    window.addEventListener('notifications-changed', load);
    return () => { active = false; clearInterval(timer); window.removeEventListener('notifications-changed', load); };
  }, []);

  // Smooth scroll to top on route change
  useEffect(() => {
    autoScrollTo(null, 0, 500);
  }, [location.pathname]);

  // Global smooth liquid scroll to related target when tiles/buttons/links are clicked
  useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest<HTMLElement>(
        'button, a, .tile, .card, .tab, .category-tile-card, .bank-card-button, .quick-card, .account-card, .list-item, [role="button"]'
      );
      if (clickable) {
        if (
          clickable.classList.contains('close') ||
          clickable.classList.contains('dialog-close') ||
          clickable.classList.contains('ai-chat-close-btn') ||
          clickable.classList.contains('ai-bot-floating-trigger') ||
          clickable.classList.contains('theme-toggle') ||
          clickable.textContent?.trim() === '✕' ||
          clickable.textContent?.trim() === '×'
        ) {
          return;
        }

        window.setTimeout(() => {
          const focusElement = document.querySelector<HTMLElement>(
            '.modal-backdrop, .glass-card-modal, .receipt-modal-card, .product-dialog, .details-grid, .panel:focus-within, .panel, main'
          );
          if (focusElement) {
            const rect = focusElement.getBoundingClientRect();
            if (rect.top < 70 || rect.top > window.innerHeight * 0.75) {
              autoScrollTo(focusElement, 85, 550);
            }
          }
        }, 90);
      }
    }
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="%23C9A227"><circle cx="12" cy="8" r="4"/><path d="M12 14c-4.42 0-8 2.69-8 6v1h16v-1c0-3.31-3.58-6-8-6z"/></svg>`;
  const avatarSrc = user?.profileImage || defaultAvatar;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link className="brand" to="/app">
          <img className="brand-mark" src="/images/logo.jpeg" alt="Serendib Smart Bank Logo" />
          <span>serendib<small>SMART BANK</small></span>
        </Link>
        <div className="sidebar-label">YOUR WORKSPACE</div>
        <nav onClick={() => setOpen(false)}>
          <NavLink end to="/app"><span className="nav-icon">{TAB_ICONS['overview']}</span> <Text value="Overview" /></NavLink>
          {(role && links[role] ? links[role] : []).map(([path, label, icon]) => (
            <NavLink key={path} to={`/app/${path}`}><span className="nav-icon">{icon}</span><Text value={label} /></NavLink>
          ))}
          <NavLink to="/app/notifications"><span className="nav-icon">{TAB_ICONS['notifications']}</span><Text value="Notifications" />{count > 0 && <b className="nav-count">{count}</b>}</NavLink>
          <NavLink to="/app/reviews"><span className="nav-icon">{TAB_ICONS['reviews']}</span><Text value="Customer reviews" /></NavLink>
          <NavLink to="/app/profile"><span className="nav-icon">{TAB_ICONS['profile']}</span><Text value="My profile" /></NavLink>
        </nav>
        <div className="sidebar-footer">
          <span className="online-dot" /> Academic banking simulation<small>LKR · No real financial transactions</small>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="mobile-menu secondary" onClick={() => setOpen(!open)} aria-label="Toggle navigation">☰</button>
          <span className="breadcrumb" style={{ color: 'var(--soft-ink)' }}>Your bank. Within reach.</span>
          <div className="topbar-user" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <ThemeToggle />
            <LanguageButtons />
            <Link className="notification-link" to="/app/notifications"><Text value="Notifications" /> {count > 0 && <b>{count}</b>}</Link>

            <Link
              to="/app/profile"
              className="topbar-profile-btn"
              title="View & Edit Profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: 'rgba(201, 162, 39, 0.08)',
                border: '1px solid rgba(201, 162, 39, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <img
                src={avatarSrc}
                alt={user?.username || 'User profile'}
                className="avatar"
                style={{
                  objectFit: 'cover',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1.5px solid var(--color-gold-primary)',
                  background: 'var(--surface-secondary)'
                }}
              />
              <span style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                <strong style={{ color: 'var(--ink)', fontSize: '13px', fontWeight: 600 }}>{user?.username}</strong>
                <small style={{ color: 'var(--color-gold-primary)', fontSize: '10px', fontWeight: 600, textTransform: 'capitalize' }}>{role?.toLowerCase()}</small>
              </span>
            </Link>

            <button className="link-button" style={{ marginLeft: '10px', paddingLeft: '12px', borderLeft: '1px solid var(--border)' }} onClick={async () => { try { await logout(); } finally { navigate('/login'); } }}><Text value="Sign out" /></button>
          </div>
        </header>

        <main><Outlet /></main>

        <footer className="page-footer" style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', fontSize: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.25rem', textAlign: 'left' }}>
            <div>
              <strong style={{ color: 'var(--color-gold-primary)', fontSize: '1rem', display: 'block', marginBottom: '0.4rem', fontFamily: 'Playfair Display' }}>
                Serendib Smart Bank
              </strong>
              <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.4, color: 'var(--soft-ink)' }}>
                Licensed Commercial Bank regulated by the Central Bank of Sri Lanka.
              </p>
            </div>

            <div>
              <strong style={{ color: 'var(--ink)', fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>24/7 Hotline &amp; Support</strong>
              <div style={{ color: 'var(--color-gold-primary)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                📞 Hotline: <a href="tel:1991" style={{ color: 'var(--color-gold-primary)', textDecoration: 'underline' }}>1991</a>
              </div>
              <div style={{ color: 'var(--soft-ink)' }}>
                ✉️ <a href="mailto:wijerathna.dev.2004@gmail.com" style={{ color: 'var(--color-gold-primary)', textDecoration: 'underline', fontWeight: 600 }}>info@serendibbank.lk</a>
              </div>
            </div>

            <div>
              <strong style={{ color: 'var(--ink)', fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>Contact Numbers</strong>
              <div style={{ color: 'var(--soft-ink)' }}>☎️ <a href="tel:+94117123456" style={{ color: 'inherit', textDecoration: 'underline' }}>+94 11 712 3456</a></div>
              <div style={{ color: 'var(--soft-ink)' }}>☎️ <a href="tel:+94117890123" style={{ color: 'inherit', textDecoration: 'underline' }}>+94 11 789 0123</a></div>
            </div>

            <div>
              <strong style={{ color: 'var(--ink)', fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>Headquarters Address</strong>
              <p style={{ margin: 0, color: 'var(--soft-ink)', lineHeight: 1.4 }}>
                Serendib Smart Bank Towers,<br />
                No. 452, Baseline Road,<br />
                Colombo 09, Sri Lanka
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)', color: 'var(--soft-ink)' }}>
            Serendib Smart Bank <span>SE2030 · Group 2026-Y2-S1-MLB-B5G1-02</span>
          </div>
        </footer>
      </div>
      <WhatsAppAgentButton />
      <AiChatbotAssistant />
      <KycPromptModal isOpen={showKycModal} onClose={() => setShowKycModal(false)} />
      <FirstLoginPasswordModal />
    </div>
  );
}
