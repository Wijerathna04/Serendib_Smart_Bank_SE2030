import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { send } from '../api/client';
import { Heading, Panel, Field, ErrorMessage, Detail, PasswordInput } from '../components/ui';
import { compressImage } from '../utils/imageCompressor';

export default function ProfilePage() {
  const { user, role, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nic, setNic] = useState('');
  const [dob, setDob] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [nicFrontImage, setNicFrontImage] = useState('');
  const [nicBackImage, setNicBackImage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setNic(user.nic || '');
      setDob(user.dateOfBirth || '');
      setProfileImage(user.profileImage || '');
      setNicFrontImage(user.nicFrontImage || '');
      setNicBackImage(user.nicBackImage || '');
    }
  }, [user]);

  // Handle Image File Upload (compresses and converts file to Base64 data URL)
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setProfileImage(compressed);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to process profile image file.');
    }
  }

  async function handleSaveProfilePicture(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send('/api/customers/me/profile-image', { profileImage }, 'PATCH');
      await refresh();
      setNotice('Profile picture updated successfully.');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteProfilePicture() {
    setBusy(true);
    setError(null);
    try {
      await send('/api/customers/me/profile-image', {}, 'DELETE');
      setProfileImage('');
      await refresh();
      setNotice('Profile picture removed. Default avatar restored.');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send('/api/customers/me', {
        email,
        phone,
        address,
        nic,
        dateOfBirth: dob || null,
        profileImage,
        nicFrontImage,
        nicBackImage
      }, 'PATCH');
      await refresh();
      setNotice('Profile details and KYC documents saved.');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleNicFrontFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setNicFrontImage(compressed);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to process NIC front image file.');
    }
  }

  async function handleNicBackFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setNicBackImage(compressed);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to process NIC back image file.');
    }
  }

  const defaultFrontDoc = "https://dummyimage.com/600x380/e2e8f0/1e293b.png&text=NIC+Front+Document+Card";
  const defaultBackDoc = "https://dummyimage.com/600x380/e2e8f0/1e293b.png&text=NIC+Back+Document+Card";

  async function password(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send('/auth/change-password', { currentPassword, newPassword });
      try {
        await logout();
      } catch {}
      navigate('/login');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const avatarDisplayUrl = profileImage || user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;

  return (
    <>
      <Heading
        title="My profile"
        subtitle="Your personal details, profile picture, contact security and credentials."
        icon="/images/page-icons/my_profile.png"
      />

      <div
        className="welcome-banner glass-card"
        style={{
          '--banner-bg-img': "url('/images/human_digital_banking.jpg')",
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          flexWrap: 'wrap'
        } as React.CSSProperties}
      >
        <div style={{ position: 'relative' }}>
          <img
            src={avatarDisplayUrl}
            alt={`${user?.username}'s avatar`}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--color-gold-primary)',
              boxShadow: '0 0 20px rgba(201, 162, 39, 0.4)',
              background: 'var(--surface-secondary)'
            }}
          />
        </div>

        <div>
          <span className="eyebrow">MEMBER PROFILE &amp; AVATAR</span>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'Playfair Display', margin: '0.25rem 0 0.4rem 0' }}>
            {user?.username} ({role})
          </h2>
          <p style={{ margin: 0, maxWidth: '580px', opacity: 0.9, fontSize: '0.95rem' }}>
            Manage your profile picture, communication preferences, National Identity registration, and security credentials.
          </p>
        </div>
      </div>

      <ErrorMessage error={error} />
      {notice && <div className="alert success">{notice}</div>}

      <div className="two-column">
        {/* PROFILE PICTURE MANAGEMENT PANEL */}
        <Panel title="Profile picture management" className="glass-card">
          <form onSubmit={handleSaveProfilePicture}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <img
                src={avatarDisplayUrl}
                alt="Avatar preview"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--color-gold-primary)',
                  boxShadow: 'var(--shadow-card)',
                  background: 'var(--surface-secondary)'
                }}
              />
              <div>
                <strong style={{ display: 'block', fontSize: '1rem' }}>Avatar Preview</strong>
                <small style={{ color: 'var(--soft-ink)' }}>Upload an image file (PNG/JPG) or enter an image URL.</small>
              </div>
            </div>

            <Field label="Upload Image File">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ cursor: 'pointer' }}
              />
            </Field>

            <Field label="Or Profile Image URL">
              <input
                type="url"
                value={profileImage}
                onChange={e => setProfileImage(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </Field>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <button type="submit" disabled={busy}>Save Profile Picture</button>
              <button
                type="button"
                className="secondary"
                disabled={busy || !profileImage}
                onClick={handleDeleteProfilePicture}
              >
                Delete / Reset Picture
              </button>
            </div>
          </form>
        </Panel>

        {/* PERSONAL INFORMATION PANEL */}
        <Panel title="Personal information" className="glass-card">
          <form onSubmit={save}>
            <Field label="Email">
              <input required type="email" maxLength={100} value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone">
              <input maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+94 77 123 4567" />
            </Field>
            {role === 'CUSTOMER' && (
              <>
                <Field label="Address">
                  <input maxLength={255} value={address} onChange={e => setAddress(e.target.value)} />
                </Field>
                <Field label="NIC">
                  <input maxLength={12} value={nic} onChange={e => setNic(e.target.value.slice(0, 12))} />
                </Field>
                <Field label="Date of birth">
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={dob}
                    onChange={e => {
                      if (e.target.value > new Date().toISOString().slice(0, 10)) {
                        setError('Date of birth cannot be in the future.');
                      } else {
                        setError(null);
                        setDob(e.target.value);
                      }
                    }}
                  />
                </Field>
              </>
            )}
            <button disabled={busy}>Save Profile Details</button>
          </form>
        </Panel>
      </div>

      {role === 'CUSTOMER' && (
        <div style={{ marginTop: '2rem' }}>
          <Panel title="KYC Verification Documents (NIC Front / NIC Back)" className="glass-card">
            {user?.nicFrontImage && user?.nicBackImage ? (
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: '16px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <span style={{ fontSize: '2rem' }}>🛡️</span>
                <div>
                  <strong style={{ fontSize: '1.05rem', display: 'block', color: 'var(--ink)' }}>
                    ✓ KYC Verification Documents Submitted &amp; Verified
                  </strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: 'var(--soft-ink)' }}>
                    Your National Identity Card (NIC Front &amp; Back) photo documents have been securely saved and archived for institutional verification. Upload fields are hidden for your privacy.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={save}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* NIC FRONT */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-gold-primary)', fontSize: '1.05rem' }}>
                      🪪 NIC Front Side Image
                    </h4>
                    <img
                      src={nicFrontImage || defaultFrontDoc}
                      alt="NIC Front Document"
                      style={{
                        width: '100%',
                        height: '160px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        border: '1.5px solid var(--color-gold-primary)',
                        marginBottom: '1rem',
                        background: 'var(--surface-secondary)'
                      }}
                    />
                    <Field label="Upload NIC Front Side Photo">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleNicFrontFileChange}
                        style={{ cursor: 'pointer' }}
                      />
                    </Field>
                  </div>

                  {/* NIC BACK */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-gold-primary)', fontSize: '1.05rem' }}>
                      💳 NIC Back Side Image
                    </h4>
                    <img
                      src={nicBackImage || defaultBackDoc}
                      alt="NIC Back Document"
                      style={{
                        width: '100%',
                        height: '160px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        border: '1.5px solid var(--color-gold-primary)',
                        marginBottom: '1rem',
                        background: 'var(--surface-secondary)'
                      }}
                    />
                    <Field label="Upload NIC Back Side Photo">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleNicBackFileChange}
                        style={{ cursor: 'pointer' }}
                      />
                    </Field>
                  </div>
                </div>

                <button disabled={busy}>Save KYC Verification Documents</button>
              </form>
            )}
          </Panel>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <Panel title="Change password" className="glass-card">
          <form onSubmit={password}>
            <Field label="Current password">
              <PasswordInput required autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </Field>
            <Field label="New password">
              <PasswordInput required minLength={8} maxLength={72} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </Field>
            <p className="fine-print">At least 8 characters and at most 72 UTF-8 bytes. Changing your password signs out all sessions.</p>
            <button disabled={busy}>Change password</button>
          </form>
        </Panel>
      </div>
    </>
  );
}
