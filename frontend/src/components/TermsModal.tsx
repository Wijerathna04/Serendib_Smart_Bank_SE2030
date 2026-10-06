import { useState, useRef, useEffect, ReactNode } from 'react';
import { README_ACCOUNTS, README_FIXED_DEPOSITS, README_LOANS_LEASING } from '../data/termsAndConditions';

interface TermsModalProps {
  type: 'ACCOUNTS' | 'FIXED_DEPOSITS' | 'LOANS';
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

function FormattedTermsContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let listItems: ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ paddingLeft: '1.25rem', margin: '0.4rem 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <div key={idx} style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(56,189,248,0.15))', border: '1px solid rgba(16,185,129,0.3)', padding: '0.85rem 1.1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📜</span> {trimmed.replace(/^#\s+/, '')}
          </h3>
        </div>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList();
      const sectionTitle = trimmed.replace(/^###\s+/, '');
      elements.push(
        <div key={idx} style={{ marginTop: '1.25rem', marginBottom: '0.5rem', paddingBottom: '0.35rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>◈</span> {sectionTitle}
          </h4>
        </div>
      );
    } else if (trimmed.startsWith('* ')) {
      const itemText = trimmed.replace(/^\*\s+/, '');
      const parts = itemText.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} style={{ color: 'var(--color-gold-primary, #f59e0b)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      listItems.push(
        <li key={idx} style={{ fontSize: '0.9rem', lineHeight: '1.55', color: 'var(--ink, #e2e8f0)' }}>
          {formattedParts}
        </li>
      );
    } else {
      flushList();
      const parts = trimmed.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} style={{ color: 'var(--color-gold-primary, #f59e0b)' }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      elements.push(
        <p key={idx} style={{ margin: '0.5rem 0', fontSize: '0.9rem', lineHeight: '1.55', color: 'var(--ink, #cbd5e1)' }}>
          {formattedParts}
        </p>
      );
    }
  });

  flushList();

  return <div className="formatted-terms-content">{elements}</div>;
}

export function TermsModal({ type, isOpen, onClose, onAccept }: TermsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [accepted, setAccepted] = useState(false);

  const content = type === 'ACCOUNTS' 
    ? README_ACCOUNTS 
    : type === 'FIXED_DEPOSITS' 
      ? README_FIXED_DEPOSITS 
      : README_LOANS_LEASING;

  const title = type === 'ACCOUNTS'
    ? 'Savings & Current Accounts Rules & Regulations'
    : type === 'FIXED_DEPOSITS'
      ? 'Fixed Deposits Terms & Penalty Matrix'
      : 'Financing Disclosures & CRIB Consent Agreement';

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (accepted) {
      onAccept();
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="product-dialog terms-dialog"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <button className="dialog-close secondary" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{title}</h2>

      <div style={{ background: 'rgba(245, 158, 11, 0.12)', borderLeft: '4px solid #f59e0b', padding: '0.6rem 0.9rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', color: '#fcd34d' }}>
        <strong>📌 Important Regulatory Notice:</strong> Please read all rules &amp; regulations carefully before accepting. By proceeding, you agree to CBSL compliance guidelines.
      </div>

      <div className="terms-body" style={{ maxHeight: '380px', overflowY: 'auto', padding: '1rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border, rgba(255,255,255,0.1))', borderRadius: '10px', marginBottom: '1rem' }}>
        <FormattedTermsContent text={content} />
      </div>

      <div className="terms-checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <input
          type="checkbox"
          id="terms-check"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
        />
        <label htmlFor="terms-check" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, lineHeight: '1.4' }}>
          I have read, understood, and explicitly agree to all Terms &amp; Conditions, regulatory disclosures, and penalty matrices.
        </label>
      </div>

      <div className="actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="button" disabled={!accepted} onClick={handleConfirm} style={{ background: accepted ? '#10b981' : undefined }}>
          Accept &amp; Continue
        </button>
      </div>
    </dialog>
  );
}

