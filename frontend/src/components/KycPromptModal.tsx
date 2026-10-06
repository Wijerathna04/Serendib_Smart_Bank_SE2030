import React, { useState, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { send } from '../api/client';
import { Field, ErrorMessage } from './ui';
import { compressImage } from '../utils/imageCompressor';

interface KycPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KycPromptModal({ isOpen, onClose }: KycPromptModalProps) {
  const { user, refresh } = useAuth();
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [nicFrontImage, setNicFrontImage] = useState(user?.nicFrontImage || '');
  const [nicBackImage, setNicBackImage] = useState(user?.nicBackImage || '');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const profileRef = useRef<HTMLInputElement>(null);
  const nicFrontRef = useRef<HTMLInputElement>(null);
  const nicBackRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  async function handleFileRead(file: File, setter: (val: string) => void) {
    try {
      const compressed = await compressImage(file);
      setter(compressed);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to process image file.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send('/api/customers/me/kyc-documents', {
        profileImage,
        nicFrontImage,
        nicBackImage
      }, 'PATCH');
      await refresh();
      setSuccessMsg('KYC documents and profile picture updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`;
  const defaultFrontDoc = "https://dummyimage.com/600x380/e2e8f0/1e293b.png&text=NIC+Front+Document+Card";
  const defaultBackDoc = "https://dummyimage.com/600x380/e2e8f0/1e293b.png&text=NIC+Back+Document+Card";

  return (
    <div className="modal-backdrop" style={{ zIndex: 9999 }}>
      <div
        className="glass-card modal-content"
        style={{
          maxWidth: '680px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          borderRadius: '24px',
          border: '1.5px solid var(--color-gold-primary)',
          background: 'var(--card)',
          color: 'var(--ink)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--color-gold-primary)', letterSpacing: '0.08em' }}>
              PROFILE SETUP &amp; VERIFICATION
            </span>
            <h2 style={{ margin: '0.25rem 0 0 0', fontFamily: 'Playfair Display', fontSize: '1.65rem', color: 'var(--ink)' }}>
              Complete Customer KYC Verification
            </h2>
          </div>
          <button
            onClick={onClose}
            className="secondary close"
            style={{ padding: '4px 10px', fontSize: '1.2rem', lineHeight: 1 }}
            title="Close"
          >
            ✕
          </button>
        </div>

        <p style={{ color: 'var(--soft-ink)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Welcome to Serendib Smart Bank Online Banking! Please upload your <strong>Profile Picture</strong>, <strong>NIC Front Card Image</strong>, and <strong>NIC Back Card Image</strong> to complete your profile identity verification.
        </p>

        <ErrorMessage error={error} />
        {successMsg && <div className="alert success">{successMsg}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* SECTION 1: PROFILE PICTURE */}
          <div style={{ background: 'var(--card-subtle)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-gold-primary)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📷 1. Profile Picture
            </h4>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <img
                src={profileImage || defaultAvatar}
                alt="Profile Preview"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--color-gold-primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              />
              <div style={{ flex: 1, minWidth: '220px' }}>
                <Field label="Upload Profile Image File (PNG/JPG)">
                  <input
                    ref={profileRef}
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleFileRead(f, setProfileImage);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* SECTION 2: NIC FRONT IMAGE */}
          <div style={{ background: 'var(--card-subtle)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-gold-primary)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🪪 2. NIC Front Image
            </h4>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <img
                src={nicFrontImage || defaultFrontDoc}
                alt="NIC Front Preview"
                style={{
                  width: '120px',
                  height: '75px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  border: '1.5px solid var(--color-gold-primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              />
              <div style={{ flex: 1, minWidth: '220px' }}>
                <Field label="Upload NIC Front Side Photo">
                  <input
                    ref={nicFrontRef}
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleFileRead(f, setNicFrontImage);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* SECTION 3: NIC BACK IMAGE */}
          <div style={{ background: 'var(--card-subtle)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-gold-primary)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💳 3. NIC Back Image
            </h4>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <img
                src={nicBackImage || defaultBackDoc}
                alt="NIC Back Preview"
                style={{
                  width: '120px',
                  height: '75px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  border: '1.5px solid var(--color-gold-primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              />
              <div style={{ flex: 1, minWidth: '220px' }}>
                <Field label="Upload NIC Back Side Photo">
                  <input
                    ref={nicBackRef}
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleFileRead(f, setNicBackImage);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" className="secondary" onClick={onClose} disabled={busy}>
              Remind Me Later
            </button>
            <button type="submit" disabled={busy || (!profileImage && !nicFrontImage && !nicBackImage)}>
              {busy ? 'Saving Verification Documents...' : 'Save & Submit KYC Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
