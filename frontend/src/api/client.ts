let token: string | null = typeof window !== 'undefined' ? localStorage.getItem('serendib_bank_token') : null;
const base = (import.meta.env.VITE_API_URL || 'http://localhost:8081').replace(/\/$/, '');
export function setToken(value: string | null) {
  token = value;
  if (typeof window !== 'undefined') {
    if (value) {
      localStorage.setItem('serendib_bank_token', value);
    } else {
      localStorage.removeItem('serendib_bank_token');
    }
  }
}
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields: Record<string,string> = {}) { super(message); }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body) headers.set('Content-Type', 'application/json');
  let response: Response;
  try { response = await fetch(base + path, {...options, headers}); }
  catch { throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the bank server. Check the connection and try again.'); }
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* Gateway errors need not be JSON. */ }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/login')) window.dispatchEvent(new Event('bank-session-expired'));
    throw new ApiError(response.status, body?.code || 'REQUEST_FAILED', body?.message || `Request failed (${response.status})`, body?.fieldErrors || {});
  }
  return body as T;
}
export async function send<T>(path: string, body?: unknown, method = 'POST', key?: string): Promise<T> {
  const isMoneyPath = (
    path === '/api/transfers' ||
    path === '/api/fixed-deposits' ||
    (path.startsWith('/api/fixed-deposits/') && path.endsWith('/close')) ||
    path === '/api/bill-payments'
  );

  const reqHeaders: Record<string, string> = {};
  if (key) {
    reqHeaders['Idempotency-Key'] = key;
  } else if (isMoneyPath) {
    reqHeaders['Idempotency-Key'] = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  }

  return await api<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: reqHeaders
  });
}
export function query(params: Record<string, string | number | undefined>) {
  const result = new URLSearchParams();
  Object.entries(params).forEach(([key,value]) => { if (value !== undefined && value !== '') result.set(key, String(value)); });
  return result.toString();
}
export function money(value: string | null | undefined) {
  if (value == null) return 'Calculated on activation';
  const [whole, fraction = '00'] = value.split('.');
  return `LKR ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction.padEnd(2,'0')}`;
}
export function date(value: string | null | undefined) { return value ? new Date(value).toLocaleString('en-LK', {dateStyle: 'medium', ...(value.includes('T') ? {timeStyle: 'short' as const} : {})}) : '—'; }

export async function downloadPdf(path: string, defaultFilename: string, shareSummary?: string) {
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(base + path, { headers });
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new Event('bank-session-expired'));
    throw new ApiError(res.status, 'DOWNLOAD_FAILED', `Failed to download PDF (${res.status})`);
  }
  const blob = await res.blob();
  const file = new File([blob], defaultFilename, { type: 'application/pdf' });

  if (shareSummary && typeof navigator !== 'undefined' && (navigator as any).share && (navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
    try {
      await (navigator as any).share({
        title: defaultFilename,
        text: shareSummary,
        files: [file]
      });
      return;
    } catch {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareSummary)}`;
      window.open(waUrl, '_blank');
    }
  } else if (shareSummary && typeof window !== 'undefined') {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareSummary)}`;
    window.open(waUrl, '_blank');
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

