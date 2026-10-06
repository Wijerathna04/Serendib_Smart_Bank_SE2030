import { LanguageButtons, Text } from '../i18n';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { send } from '../api/client';
import { Field, ErrorMessage, PasswordInput } from '../components/ui';

export function AuthPage({ register = false }: { register?: boolean }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { success?: string; registeredUsername?: string } | null;

  const [username, setUsername] = useState(locationState?.registeredUsername || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(locationState?.success || '');

  if (auth.user) return <Navigate to="/app" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (register) {
        await send('/auth/register', { username: username.trim(), email: email.trim(), password });
        navigate('/login', {
          state: {
            success: 'Your customer profile is ready. Sign in to continue.',
            registeredUsername: username.trim(),
          },
        });
      } else {
        await auth.login(username, password);
        navigate('/app');
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-story">
        <Link className="brand" to="/">
          <img className="brand-mark" src="/images/logo.jpeg" alt="Serendib Smart Bank Logo" />
          <span>serendib<small>SMART BANK</small></span>
        </Link>
        <span className="eyebrow">A LITTLE CLOSER TO YOUR GOALS</span>
        <h1>Everyday banking.<br /><em>Thoughtfully simple.</em></h1>
        <p>A single place for your accounts, payments and future plans.</p>
        <div className="auth-art">
          <img src="/images/two_cards.png" alt="Serendib Sovereign Black & Gold Cards" className="auth-cards-img" />
        </div>
        <small><Text value={"Academic simulation · No real financial services"} /></small>
      </section>

      <section className="auth-form">
        <div className="auth-form-inner">
          <LanguageButtons />
          <Link className="subtle-link" to="/">Back to home</Link>
          <span className="eyebrow">WELCOME TO SERENDIB</span>
          <h2>{register ? <Text value="Start your journey" /> : <Text value="Welcome back" />}</h2>
          <p>
            {register
              ? <Text value="Create your customer profile to get started with Serendib Smart Bank." />
              : <Text value="One secure login for customers, bank staff, branch managers and system administrators. Your account determines your workspace." />
            }
          </p>

          {auth.notice && <div className="alert">{auth.notice}</div>}
          {success && (
            <div className="alert success">
              {success}
            </div>
          )}

          <ErrorMessage error={error} />

          <form onSubmit={submit}>
            <Field label="Username *">
              <input
                required
                minLength={3}
                maxLength={50}
                autoComplete="username"
                pattern={register ? '[A-Za-z0-9_.-]{3,50}' : undefined}
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </Field>

            {register && (
              <Field label="Email *">
                <input
                  required
                  type="email"
                  maxLength={100}
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </Field>
            )}

            <Field label="Password *">
              <PasswordInput
                required
                minLength={register ? 8 : undefined}
                maxLength={72}
                autoComplete={register ? 'new-password' : 'current-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </Field>

            <button className="full" disabled={busy}>
              <Text value={busy ? 'Please wait…' : (register ? 'Create customer profile' : 'Sign in')} />
            </button>
          </form>

          <p>
            <Text value={register ? 'Already a customer?' : 'New to Serendib?'} />{' '}
            <Link to={register ? '/login' : '/register'}>
              <Text value={register ? 'Sign in' : 'Register'} />
            </Link>
          </p>

          <Link className="subtle-link" to="/reviews">Read customer reviews</Link>
          <p className="fine-print">Accounts are provisioned separately for the academic demonstration. Never enter real banking credentials.</p>
        </div>
      </section>
    </div>
  );
}
