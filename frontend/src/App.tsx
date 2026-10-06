import AdminOperationsPage from './pages/AdminOperationsPage';
import { Component, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, Link } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { AppLayout } from './components/AppLayout';
import { AuthPage } from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import GuestPage from './pages/GuestPage';
import { AccountsPage, AccountDetailsPage } from './pages/AccountsPage';
import { FixedDepositsPage, CreateFixedDepositPage, FixedDepositDetailsPage } from './pages/FixedDepositPages';
import NotificationsPage from './pages/NotificationsPage';
import { TransfersPage, BillPaymentsPage } from './pages/PaymentPages';
import { TransactionsPage, TransactionDetailsPage } from './pages/TransactionPages';
import BeneficiariesPage from './pages/BeneficiariesPage';
import { LoansPage, LoanDetailsPage, StaffLoansPage } from './pages/LoanPages';
import { CardsPage, StaffCardsPage } from './pages/CardPages';
import { FeedbackPage, ReviewsPage, StaffFeedbackPage } from './pages/FeedbackPages';
import ProfilePage from './pages/ProfilePage';
import { AdminUsersPage, AdminAuditLogsPage } from './pages/AdminPages';
import { StaffCustomersPage } from './pages/StaffCustomersPage';
import { StaffAccountsPage } from './pages/StaffAccountsPage';
import AssistantPage from './pages/AssistantPage';
import { ManagerApprovalsPage } from './pages/ManagerApprovalsPage';
import { ManagerAllAccountsPage } from './pages/ManagerAllAccountsPage';
import type { Role } from './types/api';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--canvas)', color: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '2rem', color: 'var(--color-gold-primary)', marginBottom: '1rem' }}>
            Serendib Smart Bank
          </h2>
          <p style={{ maxWidth: '500px', margin: '0 auto 1.5rem auto', opacity: 0.9 }}>
            An unexpected application error occurred. Click below to reload your workspace.
          </p>
          <button onClick={() => window.location.href = '/app'}>
            Reload Application Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RequireRole({ roles }: { roles?: Role[] }) {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && (!role || !roles.includes(role)))
    return (
      <div className="empty">
        <h1>Access restricted</h1>
        <p>Your role cannot open this workspace.</p>
        <Link to="/app">Return to overview</Link>
      </div>
    );
  return <Outlet />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<GuestPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage key="register" register />} />
        <Route path="/reviews" element={<ReviewsPage publicPage />} />

        <Route element={<RequireRole />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* CUSTOMER ROUTES */}
            <Route element={<RequireRole roles={['CUSTOMER']} />}>
              <Route path="assistant" element={<AssistantPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="accounts/:id" element={<AccountDetailsPage />} />
              <Route path="fixed-deposits" element={<FixedDepositsPage />} />
              <Route path="fixed-deposits/new" element={<CreateFixedDepositPage />} />
              <Route path="fixed-deposits/:id" element={<FixedDepositDetailsPage />} />
              <Route path="transfers" element={<TransfersPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="transactions/:id" element={<TransactionDetailsPage />} />
              <Route path="beneficiaries" element={<BeneficiariesPage />} />
              <Route path="bill-payments" element={<BillPaymentsPage />} />
              <Route path="loans" element={<LoansPage />} />
              <Route path="loans/:id" element={<LoanDetailsPage />} />
              <Route path="cards" element={<CardsPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
            </Route>

            {/* STAFF & MANAGER ROUTES */}
            <Route element={<RequireRole roles={['EMPLOYEE', 'MANAGER', 'ADMIN']} />}>
              <Route path="employee/customers" element={<StaffCustomersPage />} />
              <Route path="employee/accounts" element={<StaffAccountsPage />} />
              <Route path="employee/loans" element={<StaffLoansPage />} />
              <Route path="employee/cards" element={<StaffCardsPage />} />
              <Route path="employee/feedback" element={<StaffFeedbackPage />} />
            </Route>

            <Route element={<RequireRole roles={['MANAGER', 'ADMIN']} />}>
              <Route path="manager/all-accounts" element={<ManagerAllAccountsPage />} />
              <Route path="manager/approvals" element={<ManagerApprovalsPage />} />
              <Route path="manager/loans" element={<StaffLoansPage manager />} />
            </Route>

            {/* ADMIN ROUTES */}
            <Route element={<RequireRole roles={['ADMIN']} />}>
              <Route path="admin/operations" element={<AdminOperationsPage />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/audit" element={<AdminAuditLogsPage />} />
            </Route>

            <Route
              path="*"
              element={
                <div className="empty">
                  <h1>Page not found</h1>
                  <Link to="/app">Return to overview</Link>
                </div>
              }
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <div className="empty">
              <h1>Page not found</h1>
              <Link to="/login">Go to sign in</Link>
            </div>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
