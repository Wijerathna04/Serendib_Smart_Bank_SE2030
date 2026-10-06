import { money, date } from '../api/client';
import type { Transaction } from '../types/api';

interface TransactionReportModalProps {
  transactions: Transaction[];
  filters: {
    from?: string;
    to?: string;
    type?: string;
    status?: string;
    search?: string;
  };
  onClose: () => void;
}

export function TransactionReportModal({ transactions, filters, onClose }: TransactionReportModalProps) {
  const reportRef = `TR-REP-${Date.now().toString().slice(-8)}`;
  const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' });

  const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const formatMoney = (val: number | string | null | undefined) => {
    if (val == null) return 'LKR 0.00';
    return money(typeof val === 'number' ? val.toFixed(2) : String(val));
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Pop-up blocked. Please allow popups to download/print PDF reports.');
      return;
    }

    const rowsHtml = transactions.map(t => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${date(t.createdAt)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-family: monospace;">#${t.transactionId}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 500;">${t.description || 'N/A'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px;"><span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${(t.transactionType || '').replaceAll('_', ' ')}</span></td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; text-align: right;">${formatMoney(t.amount)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center;"><span style="color: ${t.status === 'COMPLETED' ? '#15803d' : t.status === 'FAILED' ? '#b91c1c' : '#b45309'}; font-weight: 700;">${t.status}</span></td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction_History_Report_${reportRef}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #ffffff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #c9a227; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { display: flex; align-items: center; gap: 12px; }
          .brand-name { font-size: 20px; font-weight: 800; color: #0f172a; tracking: 0.05em; }
          .badge { background: #c9a227; color: #000; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; }
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
          .meta-item { display: flex; flex-direction: column; }
          .meta-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 4px; }
          .meta-val { font-size: 14px; font-weight: 700; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #0f172a; color: #ffffff; font-size: 12px; text-transform: uppercase; text-align: left; padding: 10px 12px; font-weight: 600; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; align-items: center; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #c9a227; color: #000; font-weight: 700; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer;">🖨️ Save as PDF / Print</button>
        </div>

        <div class="header">
          <div class="brand">
            <div>
              <div class="brand-name">SERENDIB SMART BANK</div>
              <div style="font-size: 12px; color: #64748b;">Official Account Activity & Transaction Ledger</div>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="badge">Verified PDF Report</span>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Ref: ${reportRef}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Report Date</span>
            <span class="meta-val">${nowStr}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Filtered Period</span>
            <span class="meta-val">${filters.from || 'All'} to ${filters.to || 'Present'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Total Records</span>
            <span class="meta-val">${transactions.length}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Total Volume</span>
            <span class="meta-val" style="color: #c9a227;">${formatMoney(totalAmount)}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Reference ID</th>
              <th>Description / Recipient</th>
              <th>Type</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding: 20px;">No transactions recorded.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <div>Serendib Smart Bank SE2030 • Institutional Electronic Banking Division</div>
          <div>Computer-generated certified report • No physical signature required</div>
        </div>

        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141519] border border-white/10 rounded-2xl max-w-3xl w-full p-6 text-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <h2 className="text-lg font-bold text-white">Generate Transaction History Report</h2>
              <p className="text-xs text-[#99907b]">Preview & Export your transaction ledger as a PDF statement</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#99907b] hover:text-white text-xl p-1 cursor-pointer">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="p-4 bg-[#1a1b21] rounded-xl border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#99907b] block mb-1">Total Transactions</span>
              <strong className="text-base text-white">{transactions.length}</strong>
            </div>
            <div>
              <span className="text-[#99907b] block mb-1">Total Amount</span>
              <strong className="text-base text-[#ecc246]">{formatMoney(totalAmount)}</strong>
            </div>
            <div>
              <span className="text-[#99907b] block mb-1">Date Range</span>
              <strong className="text-white">{filters.from || 'Beginning'} – {filters.to || 'Present'}</strong>
            </div>
            <div>
              <span className="text-[#99907b] block mb-1">Status / Type</span>
              <strong className="text-white">{filters.status || 'All'} / {filters.type || 'All'}</strong>
            </div>
          </div>

          <div className="border border-white/10 rounded-xl overflow-hidden bg-[#1a1b21]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#242630] text-[#ddc582]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.slice(0, 10).map(t => (
                  <tr key={t.transactionId}>
                    <td className="p-3 text-[#99907b]">{date(t.createdAt)}</td>
                    <td className="p-3 font-medium text-white">{t.description}</td>
                    <td className="p-3 text-[#d1c5af]">{t.transactionType?.replaceAll('_', ' ')}</td>
                    <td className="p-3 font-mono font-bold text-right text-white">{formatMoney(t.amount)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'COMPLETED' ? 'bg-green-950 text-green-400' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length > 10 && (
              <div className="p-2 text-center text-[11px] text-[#99907b] bg-[#141519] border-t border-white/5">
                + {transactions.length - 10} more transactions included in full PDF report
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-4">
          <span className="text-xs text-[#99907b]">Ref: {reportRef}</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="secondary px-4 py-2 text-xs rounded-xl">
              Cancel
            </button>
            <button type="button" onClick={handlePrint} className="button bg-[#c9a227] hover:bg-[#d8af2c] text-black font-bold px-5 py-2 text-xs rounded-xl shadow-lg flex items-center gap-2">
              <span>📥</span> Generate &amp; Share PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
