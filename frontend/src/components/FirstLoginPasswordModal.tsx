import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { send } from '../api/client';
import { Field, ErrorMessage, PasswordInput } from './ui';

export function FirstLoginPasswordModal() {
  const { user, refresh } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState('');

  // Only render if logged in user must change password
  if (!user || !user.mustChangePassword) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await send('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setSuccess('Your password has been changed successfully! Refreshing session...');
      await refresh();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: 10000, background: 'rgba(10, 11, 16, 0.88)' }}>
      <div
        className="glass-card modal-content"
        style={{
          maxWidth: '540px',
          width: '92%',
          padding: '2.25rem',
          borderRadius: '24px',
          border: '1.5px solid var(--color-gold-primary)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.99) 100%)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <span className="eyebrow" style={{ color: 'var(--color-gold-primary)' }}>FIRST LOGIN SECURITY STEP</span>
          <h2 style={{ margin: '0.25rem 0 0 0', fontFamily: 'Playfair Display', fontSize: '1.6rem' }}>
            Change Your Temporary Password
          </h2>
        </div>

        <p style={{ color: 'var(--soft-ink)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Your online banking account was provisioned by bank staff with a system-generated password. Please create your personal secure password before accessing your accounts.
        </p>

        <ErrorMessage error={error} />
        {success && <div className="alert success">{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="System-Generated Temporary Password *">
            <PasswordInput
              required
              placeholder="Enter temporary password sent to your email"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
          </Field>

          <Field label="New Secure Password *">
            <PasswordInput
              required
              minLength={8}
              maxLength={72}
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </Field>

          <Field label="Confirm New Password *">
            <PasswordInput
              required
              minLength={8}
              maxLength={72}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </Field>

          <button type="submit" disabled={busy} style={{ marginTop: '0.5rem', width: '100%' }}>
            {busy ? 'Updating Password...' : 'Set New Password & Access Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
