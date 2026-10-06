import React, { useRef, useState } from 'react';
import { money, date } from '../api/client';
import type { Transaction } from '../types/api';

interface ReceiptModalProps {
  transaction: Transaction & {
    billerName?: string;
    billerCategory?: string;
    referenceNumber?: string;
    fromAccountNo?: string;
  };
  onClose: () => void;
}

export function ReceiptModal({ transaction: t, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const txnIdStr = `TXN-${String(t.transactionId).padStart(7, '0')}`;
  const isBill = t.transactionType === 'BILL_PAYMENT' || !!t.billerName;

  // Generate PNG image receipt via HTML5 Canvas
  const downloadPngReceipt = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 800;
      const height = 1050;
      canvas.width = width;
      canvas.height = height;

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0F172A');
      bgGrad.addColorStop(0.3, '#1E293B');
      bgGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Outer accent border
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Header Banner
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(40, 40, width - 80, 110);

      // Bank Title
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('SERENDIB SMART BANK', 65, 85);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '14px sans-serif';
      ctx.fillText('Official Electronic Payment Advice & Transaction Receipt', 65, 115);

      // Status Badge
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.roundRect(width - 230, 65, 150, 40, 8);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('✓ COMPLETED', width - 215, 91);

      // Divider
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 175);
      ctx.lineTo(width - 40, 175);
      ctx.stroke();

      // Amount Box
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.fillRect(60, 205, width - 120, 110);
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(60, 205, width - 120, 110);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px sans-serif';
      ctx.fillText('AMOUNT PAID', 85, 235);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(money(t.amount), 85, 285);

      // Details Table
      let y = 360;
      const drawRow = (label: string, value: string, highlight = false) => {
        ctx.fillStyle = '#94A3B8';
        ctx.font = '14px sans-serif';
        ctx.fillText(label, 70, y);

        ctx.fillStyle = highlight ? '#38BDF8' : '#F8FAFC';
        ctx.font = highlight ? 'bold 15px sans-serif' : '15px sans-serif';
        ctx.fillText(value, 320, y);

        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, y + 15);
        ctx.lineTo(width - 60, y + 15);
        ctx.stroke();

        y += 45;
      };

      drawRow('Transaction Ref No.', txnIdStr, true);
      drawRow('Transaction Date', date(t.completedAt || t.createdAt));
      drawRow('Payment Type', isBill ? 'Bill Payment' : 'Fund Transfer');
      if (t.fromAccountId || t.fromAccountNo) {
        drawRow('Source Account', t.fromAccountNo ? t.fromAccountNo : `Account #${t.fromAccountId}`);
      }
      if (isBill) {
        drawRow('Biller Category', t.billerCategory || 'Utility / Service');
        drawRow('Biller Name', t.billerName || t.description || 'Biller');
        drawRow('Bill Reference No.', t.referenceNumber || t.description || 'N/A', true);
      } else {
        drawRow('Recipient / Description', t.description || 'Transfer Recipient');
        if (t.toAccountId) drawRow('Destination Account', `Account #${t.toAccountId}`);
      }
      drawRow('Transaction Status', 'SUCCESSFUL (2FA Verified)');

      // Security & Footer Box
      y += 20;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(60, y, width - 120, 150);

      // Simulated QR Code box
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(80, y + 20, 110, 110);
      ctx.fillStyle = '#000000';
      // Simple QR Code pattern simulation
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if ((r + c) % 2 === 0 || (r === 0 && c === 0) || (r === 6 && c === 6)) {
            ctx.fillRect(85 + c * 14, y + 25 + r * 14, 12, 12);
          }
        }
      }

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('VERIFIED ELECTRONIC ADVICE', 215, y + 45);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px sans-serif';
      ctx.fillText('Issued by Serendib Smart Bank SE2030 Core Banking System.', 215, y + 70);
      ctx.fillText('This is a system-generated advice. No physical signature is required.', 215, y + 90);
      ctx.fillText(`Verification Key: ${t.transactionId}-${Date.now().toString(36).toUpperCase()}`, 215, y + 110);

      // Bottom copyright
      ctx.fillStyle = '#64748B';
      ctx.font = '11px sans-serif';
      ctx.fillText('Serendib Smart Bank PLC • Colombo, Sri Lanka • Academic Banking Simulation', width / 2 - 180, height - 35);

      // Convert canvas to image download
      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Receipt_${txnIdStr}.png`;
      link.href = imageUri;
      link.click();
    } catch (e) {
      console.error('Failed to generate PNG receipt', e);
    } finally {
      setDownloading(false);
    }
  };

  // Download PDF Receipt
  const downloadPdfReceipt = () => {
    // We open a print-optimized window formatted as a clean PDF print page
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Pop-up blocked. Please allow popups to download/print PDF receipts.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt_${txnIdStr}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0F172A; background: #FFF; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0284C7; padding-bottom: 15px; margin-bottom: 20px; }
          .bank-name { font-size: 24px; font-weight: 800; color: #0369A1; letter-spacing: 0.5px; }
          .bank-sub { font-size: 13px; color: #64748B; margin-top: 3px; }
          .status-stamp { background: #ECFDF5; color: #047857; border: 2px solid #10B981; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 14px; }
          .amount-card { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 25px; }
          .amount-label { font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px; }
          .amount-val { font-size: 36px; font-weight: 900; color: #0F172A; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
          th { color: #64748B; font-weight: 600; width: 35%; background: #F8FAFC; }
          td { color: #0F172A; font-weight: 500; }
          .highlight { font-weight: 700; color: #0284C7; }
          .footer { margin-top: 30px; border-top: 1px solid #E2E8F0; padding-top: 15px; display: flex; align-items: center; gap: 20px; }
          .qr-box { width: 80px; height: 80px; background: #0F172A; color: #FFF; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; text-align: center; border-radius: 6px; }
          .disclaimer { font-size: 11px; color: #64748B; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="bank-name">SERENDIB SMART BANK</div>
            <div class="bank-sub">Official Electronic Transaction Advice / Receipt</div>
          </div>
          <div class="status-stamp">✓ COMPLETED</div>
        </div>

        <div class="amount-card">
          <div class="amount-label">Transaction Amount</div>
          <div class="amount-val">${money(t.amount)}</div>
        </div>

        <table>
          <tr><th>Transaction Ref No.</th><td class="highlight">${txnIdStr}</td></tr>
          <tr><th>Date & Time</th><td>${date(t.completedAt || t.createdAt)}</td></tr>
          <tr><th>Payment Type</th><td>${isBill ? 'Bill Payment' : 'Fund Transfer'}</td></tr>
          ${t.fromAccountId || t.fromAccountNo ? `<tr><th>Source Account</th><td>${t.fromAccountNo || `Account #${t.fromAccountId}`}</td></tr>` : ''}
          ${isBill ? `
            <tr><th>Biller Category</th><td>${t.billerCategory || 'Utility / Service'}</td></tr>
            <tr><th>Biller Name</th><td>${t.billerName || t.description || 'Biller'}</td></tr>
            <tr><th>Bill Reference No.</th><td class="highlight">${t.referenceNumber || t.description || 'N/A'}</td></tr>
          ` : `
            <tr><th>Description / Beneficiary</th><td>${t.description || 'Transfer Recipient'}</td></tr>
            ${t.toAccountId ? `<tr><th>Destination Account</th><td>Account #${t.toAccountId}</td></tr>` : ''}
          `}
          <tr><th>Status</th><td>SUCCESSFUL (2FA OTP Verified)</td></tr>
        </table>

        <div class="footer">
          <div class="qr-box">VERIFIED<br/>RECEIPT</div>
          <div class="disclaimer">
            <strong>Serendib Smart Bank PLC • Academic Banking Simulation</strong><br/>
            This is a computer-generated advice statement issued under SE2030 smart bank system.<br/>
            Reference key: ${t.transactionId}-${Date.now().toString(36).toUpperCase()}
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  // Share Receipt or Copy advice with WhatsApp, Bluetooth, and device share targets
  const shareReceipt = async (target?: 'whatsapp' | 'email' | 'native') => {
    const textAdvice = `📄 SERENDIB SMART BANK ELECTRONIC RECEIPT\nReference: ${txnIdStr}\nAmount: LKR ${t.amount}\nDate: ${date(t.completedAt || t.createdAt)}\nType: ${isBill ? 'Bill Payment (' + (t.billerName || t.description || 'Utility') + ')' : 'Fund Transfer'}\nStatus: COMPLETED (2FA OTP Verified)\nVerification Key: ${t.transactionId}-${Date.now().toString(36).toUpperCase()}`;

    if (target === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textAdvice)}`, '_blank');
      return;
    }

    if (target === 'email') {
      window.open(`mailto:?subject=${encodeURIComponent(`Serendib Smart Bank Receipt - ${txnIdStr}`)}&body=${encodeURIComponent(textAdvice)}`, '_blank');
      return;
    }

    // Try sharing as actual PNG image file if supported by browser/device (e.g. mobile/Bluetooth/WhatsApp/Drive)
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 800;
        canvas.height = 1050;
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 1050);
        bgGrad.addColorStop(0, '#0F172A');
        bgGrad.addColorStop(0.3, '#1E293B');
        bgGrad.addColorStop(1, '#0F172A');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 800, 1050);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 6;
        ctx.strokeRect(20, 20, 760, 1010);
        ctx.fillStyle = '#1E3A8A';
        ctx.fillRect(40, 40, 720, 110);
        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('SERENDIB SMART BANK', 65, 85);
        ctx.fillStyle = '#94A3B8';
        ctx.font = '14px sans-serif';
        ctx.fillText('Official Electronic Payment Advice & Transaction Receipt', 65, 115);
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.roundRect(570, 65, 150, 40, 8);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('✓ COMPLETED', 585, 91);
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.fillRect(60, 205, 680, 110);
        ctx.fillStyle = '#94A3B8';
        ctx.font = '13px sans-serif';
        ctx.fillText('AMOUNT PAID', 85, 235);
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(money(t.amount), 85, 285);

        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
        if (blob && navigator.canShare) {
          const file = new File([blob], `Receipt_${txnIdStr}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Serendib Bank Receipt - ${txnIdStr}`,
              text: textAdvice,
              files: [file],
            });
            return;
          }
        }
      }
    } catch (e) {
      console.log('File share fallback to text share', e);
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Serendib Bank Receipt - ${txnIdStr}`,
          text: textAdvice,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(textAdvice);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      alert('Receipt Advice:\n\n' + textAdvice);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="receipt-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-modal-header">
          <div>
            <span className="eyebrow">TRANSACTION RECEIPT</span>
            <h3>{txnIdStr}</h3>
          </div>
          <button className="icon-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Printable / Viewable Receipt Document */}
        <div className="receipt-document-view" ref={receiptRef}>
          <div className="receipt-watermark-bg">SSB</div>
          <div className="receipt-top-bar">
            <div className="receipt-bank-brand">
              <span className="bank-symbol">🏛️</span>
              <div>
                <strong>SERENDIB SMART BANK</strong>
                <small>Electronic Transaction Advice</small>
              </div>
            </div>
            <span className="receipt-status-pill">✓ COMPLETED</span>
          </div>

          <div className="receipt-amount-hero">
            <small>Amount Paid</small>
            <h2>{money(t.amount)}</h2>
          </div>

          <div className="receipt-details-list">
            <div className="receipt-row">
              <span>Reference ID</span>
              <strong>{txnIdStr}</strong>
            </div>
            <div className="receipt-row">
              <span>Date & Time</span>
              <span>{date(t.completedAt || t.createdAt)}</span>
            </div>
            <div className="receipt-row">
              <span>Payment Type</span>
              <span>{isBill ? 'Bill Payment' : 'Fund Transfer'}</span>
            </div>
            {isBill ? (
              <>
                <div className="receipt-row">
                  <span>Biller Name</span>
                  <strong>{t.billerName || t.description || 'Biller'}</strong>
                </div>
                <div className="receipt-row">
                  <span>Bill Reference No.</span>
                  <span className="code-text">{t.referenceNumber || t.description || 'N/A'}</span>
                </div>
              </>
            ) : (
              <div className="receipt-row">
                <span>Description</span>
                <span>{t.description || 'Transfer'}</span>
              </div>
            )}
            {t.fromAccountId && (
              <div className="receipt-row">
                <span>Source Account</span>
                <span>Account #{t.fromAccountId}</span>
              </div>
            )}
          </div>

          <div className="receipt-security-badge">
            <div className="simulated-qr">
              <span>QR</span>
            </div>
            <div>
              <small>Verified Two-Factor OTP Transaction</small>
              <p>Issued by Serendib Smart Bank SE2030 System</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="receipt-actions-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button className="button primary" onClick={downloadPdfReceipt}>
            📄 Download PDF
          </button>
          <button className="button secondary" onClick={downloadPngReceipt} disabled={downloading}>
            🖼️ Save PNG
          </button>
          <button className="button light" onClick={() => shareReceipt('native')}>
            📲 Share (Bluetooth / Device)
          </button>
          <button className="button light" onClick={() => shareReceipt('whatsapp')} style={{ backgroundColor: '#25D366', color: '#FFF', borderColor: '#25D366' }}>
            💬 WhatsApp
          </button>
          <button className="button light" onClick={() => shareReceipt('email')}>
            ✉️ Email
          </button>
        </div>
      </div>
    </div>
  );
}
