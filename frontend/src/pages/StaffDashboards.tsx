import { Link } from 'react-router-dom';
import { Heading, Panel, useApi } from '../components/ui';
import { useLanguage } from '../i18n';
import type { Page } from '../types/api';

export const staffTools = [
  ['employee/customers', 'Customers', 'View customer profiles'],
  ['employee/accounts', 'Account Services', 'Open accounts & review applications'],
  ['employee/loans', 'Loan review', 'Review and recommend applications'],
  ['employee/cards', 'Card requests', 'Issue simulated cards'],
  ['employee/feedback', 'Feedback Moderation', 'Moderate & resolve customer complaints, service requests & reviews']
];

export const managerTools = [
  ...staffTools,
  ['manager/all-accounts', 'All Accounts & Transactions', 'Search accounts, view transactions, hold funds, or delete accounts'],
  ['manager/approvals', 'Current account approvals', 'Approve or reject pending Current & Corporate account applications, FDs > 1M & Loans'],
  ['manager/loans', 'Loan decisions', 'Make final decisions on recommended loans']
];

export const adminTools = [
  ['admin/operations', 'Bank operations', 'View bank-wide accounts, transactions, deposits and payments'],
  ['admin/users', 'User management', 'Create staff accounts and manage access'],
  ['admin/audit', 'Audit trail', 'Inspect recorded banking events'],
  ['employee/customers', 'Customers', 'View customer profiles'],
  ['manager/all-accounts', 'All Accounts & Transactions', 'Search accounts, view transactions, hold funds, or delete accounts'],
  ['manager/approvals', 'Current account approvals', 'Approve or reject pending Current & Corporate account applications, FDs > 1M & Loans'],
  ['manager/loans', 'Loan decisions', 'Make final decisions on recommended loans'],
  ['employee/feedback', 'Feedback Moderation', 'Moderate & resolve customer complaints, service requests & reviews']
];

function Metric({ label, path, to }: { label: string; path: string; to: string }) {
  const { data, error, loading } = useApi<Page<unknown>>(path);
  const { t } = useLanguage();
  return (
    <Panel className="glass-card">
      <Link to={`/app/${to}`} style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t(label)}</Link>
      <strong style={{ fontSize: '2rem', fontFamily: 'Playfair Display', display: 'block', marginTop: '0.5rem' }}>
        {loading ? '…' : error ? '—' : data?.totalElements ?? '—'}
      </strong>
      {Boolean(error) && <small style={{ color: 'var(--status-error-active)' }}>{t('Unable to load')}</small>}
    </Panel>
  );
}

function Workspace({ level }: { level: 'staff' | 'manager' | 'admin' }) {
  const { t } = useLanguage();
  const title = level === 'staff'
    ? 'Bank staff dashboard'
    : level === 'manager'
      ? 'Branch manager dashboard'
      : 'System administrator dashboard';

  const tools = level === 'staff' ? staffTools : level === 'manager' ? managerTools : adminTools;

  return (
    <>
      <Heading
        title={title}
        subtitle={
          level === 'staff'
            ? 'Manage daily service requests and review applications.'
            : level === 'manager'
              ? 'Oversee staff operations and make final loan decisions.'
              : 'Oversee bank operations, user access and the audit trail.'
        }
      />

      <div className="welcome-banner role-hero glass-card">
        <div>
          <span className="eyebrow">SERENDIB / {level.toUpperCase()}</span>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'Playfair Display', margin: '0.35rem 0 0.5rem 0' }}>
            {t(
              level === 'staff'
                ? 'Everyday service starts here.'
                : level === 'manager'
                  ? 'A wider view. A clear decision.'
                  : 'Your bank, in full view.'
            )}
          </h2>
          <p style={{ margin: '0 0 1rem 0', maxWidth: '620px', opacity: 0.9 }}>
            {t('Open an operation below to view live records and take action.')}
          </p>
          <div className="role-levels" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="status active">{t('Bank staff dashboard')}</span>
            {level !== 'staff' && <span className="status pending">{t('Branch manager dashboard')}</span>}
            {level === 'admin' && <span className="status info">{t('System administrator dashboard')}</span>}
          </div>
        </div>
      </div>

      <div className="role-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Metric label="Customers" path="/api/employee/customers?size=1" to="employee/customers" />
        <Metric label="Loan review" path="/api/employee/loans?status=SUBMITTED&size=1" to="employee/loans" />
        <Metric label="Card requests" path="/api/employee/cards?status=PENDING&size=1" to="employee/cards" />
        <Metric label="Feedback Moderation" path="/api/employee/feedback?size=1" to="employee/feedback" />
        {level !== 'staff' && <Metric label="Current account approvals" path="/api/manager/accounts/pending?size=1" to="manager/approvals" />}
        {level !== 'staff' && <Metric label="Loan decisions" path="/api/manager/loans?status=PENDING_MANAGER_REVIEW&size=1" to="manager/loans" />}
        {level === 'admin' && <Metric label="User management" path="/api/admin/users?size=1" to="admin/users" />}
      </div>

      <div className="quick-grid">
        {tools.map(([path, label, description]) => (
          <Link className="quick-card glass-card" to={`/app/${path}`} key={path}>
            <h3 style={{ fontFamily: 'Playfair Display', margin: '0 0 0.5rem 0' }}>{t(label)}</h3>
            <p style={{ margin: 0, opacity: 0.85, fontSize: '0.9rem' }}>{t(description)}</p>
          </Link>
        ))}
      </div>

      <p className="fine-print" style={{ marginTop: '1.5rem', opacity: 0.7, fontSize: '0.85rem' }}>
        {t('Loan reviewers cannot make the final decision on their own recommendations.')}
      </p>
    </>
  );
}

export const BankStaffDashboard = () => <Workspace level="staff" />;
export const BranchManagerDashboard = () => <Workspace level="manager" />;
export const SystemAdministratorDashboard = () => <Workspace level="admin" />;
