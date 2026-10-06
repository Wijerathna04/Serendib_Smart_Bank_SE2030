import { Text } from '../i18n';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { send, date } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { useApi, Heading, Panel, Field, ErrorMessage, Loading, Pagination, StatusBadge, Empty } from '../components/ui';
import type { Feedback, Review, Page } from '../types/api';

const STAR_LABELS: Record<number, string> = {
  1: '1 / 5 Stars - Poor',
  2: '2 / 5 Stars - Fair',
  3: '3 / 5 Stars - Average',
  4: '4 / 5 Stars - Good',
  5: '5 / 5 Stars - Excellent'
};

function StarRatingPicker({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  const [hoverVal, setHoverVal] = useState<number | null>(null);

  return (
    <Field label="Overall Rating">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '4px 0 8px 0' }}>
        <div style={{ display: 'flex', gap: '6px', cursor: 'pointer' }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= (hoverVal ?? value);
            return (
              <span
                key={star}
                onMouseEnter={() => setHoverVal(star)}
                onMouseLeave={() => setHoverVal(null)}
                onClick={() => onChange(star)}
                style={{
                  fontSize: '2.2rem',
                  lineHeight: '1',
                  color: isFilled ? '#f59e0b' : 'rgba(255, 255, 255, 0.25)',
                  transition: 'all 0.15s ease',
                  transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                  userSelect: 'none'
                }}
                title={`${star} Star${star > 1 ? 's' : ''}`}
              >
                ★
              </span>
            );
          })}
        </div>
        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-gold-primary)' }}>
          {STAR_LABELS[hoverVal ?? value] || `${value} / 5 Stars`}
        </span>
      </div>
    </Field>
  );
}

export function FeedbackPage() {
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const [type, setType] = useState('REVIEW');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const result = useApi<Page<Feedback>>(`/api/feedback?page=${page}`, revision);

  function reset() {
    setEditing(null);
    setSubject('');
    setMessage('');
    setRating(5);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send(
        `/api/feedback${editing ? `/${editing}` : ''}`,
        {
          feedbackType: type,
          subject,
          message,
          rating: type === 'REVIEW' ? rating : null
        },
        editing ? 'PATCH' : 'POST'
      );
      reset();
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading
        title="Feedback & Customer Service Requests"
        subtitle="Share your experience or ask for help with a private service concern."
        icon="/images/page-icons/feedback.png"
      />
      <ErrorMessage error={error || result.error} />
      <div className="two-column">
        <Panel title={editing ? 'Edit submission' : 'Tell us what you think'}>
          <form onSubmit={submit}>
            <Field label="Feedback type">
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="REVIEW">⭐ Public review (Published to Customer Reviews page)</option>
                <option value="COMPLAINT">🔒 Private complaint (Forwarded to Bank Staff/Manager)</option>
                <option value="SERVICE">🛠️ Private service request (Forwarded to Bank Staff/Manager)</option>
              </select>
            </Field>

            {type === 'REVIEW' && (
              <>
                <StarRatingPicker value={rating} onChange={r => setRating(r)} />
                <div className="callout" style={{ marginBottom: '1rem' }}>
                  Your review title, message and 5-star rating will be published directly to the Customer Reviews page. Do not include private account numbers.
                </div>
              </>
            )}

            <Field label="Subject">
              <input required maxLength={200} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary of your feedback or request..." />
            </Field>
            <Field label="Message">
              <textarea required maxLength={4000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Provide full details here..." />
            </Field>

            <div className="actions">
              <button disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Submit feedback'}</button>
              {editing && (
                <button className="secondary" type="button" onClick={reset}>Cancel edit</button>
              )}
            </div>
          </form>
        </Panel>

        <Panel title="Your submissions">
          {result.loading ? (
            <Loading />
          ) : result.data && (
            <>
              {result.data.content.map(f => (
                <article className="feedback-item" key={f.feedbackId}>
                  <div className="section-title">
                    <small>{f.feedbackType} · {date(f.createdAt)}</small>
                    <StatusBadge status={f.status} />
                  </div>
                  <h3>{f.subject}</h3>
                  <p className="preserve-lines">{f.message}</p>
                  {f.rating && <p className="stars">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</p>}
                  {f.staffResponse && (
                    <div className="callout">
                      <strong>Bank Staff response:</strong>
                      <p>{f.staffResponse}</p>
                    </div>
                  )}
                  {f.status === 'SUBMITTED' && (
                    <button
                      className="secondary"
                      onClick={() => {
                        setEditing(f.feedbackId);
                        setType(f.feedbackType);
                        setSubject(f.subject);
                        setMessage(f.message);
                        setRating(f.rating || 5);
                      }}
                    >
                      Edit submission
                    </button>
                  )}
                </article>
              ))}
              {!result.data.content.length && <Empty>No feedback submitted yet.</Empty>}
              <Pagination data={result.data} onPage={setPage} />
            </>
          )}
        </Panel>
      </div>
    </>
  );
}

export function ReviewsPage({ publicPage = false }: { publicPage?: boolean }) {
  const { role } = useAuth();
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);

  const result = useApi<Page<Review>>(`/api/reviews?page=${page}`, revision);
  const summary = useApi<{ averageRating: number | null; totalReviews: number }>('/api/reviews/summary', revision);

  // Only Branch Manager and System Administrator can delete public reviews
  const canDeleteReview = role === 'ADMIN' || role === 'MANAGER';

  async function handleDeleteReview(feedbackId: number) {
    if (!canDeleteReview) {
      alert('Only Branch Managers and System Administrators are authorized to delete customer reviews.');
      return;
    }
    if (!confirm(`Are you sure you want to DELETE customer review #${feedbackId}?`)) return;
    try {
      await send(`/api/employee/feedback/${feedbackId}`, {}, 'DELETE');
      setRevision(r => r + 1);
    } catch {
      alert('Failed to delete review.');
    }
  }

  const content = (
    <>
      <Heading
        title="Customer voices"
        subtitle="Published experiences from our academic banking community."
        icon="/images/page-icons/customer_reviews.png"
        actions={publicPage ? <Link className="button" to="/login"><Text value={"Sign in"} /></Link> : undefined}
      />
      <ErrorMessage error={result.error || summary.error} />
      {summary.data && (
        <div className="review-summary">
          <strong>{summary.data.averageRating == null ? '—' : summary.data.averageRating.toFixed(1)}</strong>
          <div>
            <span className="stars">★★★★★</span>
            <p>{summary.data.totalReviews} published customer reviews</p>
          </div>
        </div>
      )}
      {result.loading ? (
        <Loading />
      ) : result.data && (
        <>
          <div className="review-grid">
            {result.data.content.map(r => (
              <article className="review-card" key={r.feedbackId} style={{ position: 'relative' }}>
                <span className="stars">{'★'.repeat(Math.min(5, Math.max(1, r.rating || 5)))}{'☆'.repeat(5 - Math.min(5, Math.max(1, r.rating || 5)))}</span>
                <h3>{r.subject}</h3>
                <p className="preserve-lines">{r.message}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <small style={{ opacity: 0.75 }}>Verified customer review · {date(r.createdAt)}</small>
                  {canDeleteReview && (
                    <button
                      type="button"
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.75rem',
                        background: 'var(--status-error)',
                        color: '#fff',
                        borderRadius: '6px'
                      }}
                      onClick={() => handleDeleteReview(r.feedbackId)}
                    >
                      🗑️ Delete Review (Manager/Admin)
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          {!result.data.content.length && <Empty>No customer reviews published yet.</Empty>}
          <Pagination data={result.data} onPage={setPage} />
        </>
      )}
    </>
  );

  return publicPage ? <main className="public-page">{content}</main> : content;
}

function moderationActions(f: Feedback | null): string[] {
  if (!f) return [];
  if (f.status === 'SUBMITTED') return ['review'];
  if (f.status === 'UNDER_REVIEW') return ['approve', 'reject'];
  if (f.feedbackType === 'REVIEW') return [];
  if (f.status === 'APPROVED') return ['resolve'];
  if (['RESOLVED', 'REJECTED'].includes(f.status)) return ['close'];
  return [];
}

export function StaffFeedbackPage() {
  const { role } = useAuth();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('ALL');
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [action, setAction] = useState('review');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const canDelete = role === 'MANAGER' || role === 'ADMIN';

  const result = useApi<Page<Feedback>>(`/api/employee/feedback?status=${status}&page=${page}`, revision);
  const allowed = moderationActions(selected);

  async function moderate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await send<Feedback>(`/api/employee/feedback/${selected.feedbackId}/${action}`, { reason }, 'PUT');
      setSelected(updated);
      setAction(moderationActions(updated)[0] || '');
      setReason('');
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    if (!canDelete) {
      alert('Only Branch Managers and System Administrators are authorized to delete feedback or customer reviews.');
      return;
    }
    if (!confirm(`CRITICAL: Delete customer feedback / review #${id} permanently?`)) return;
    setBusy(true);
    setError(null);
    try {
      await send(`/api/employee/feedback/${id}`, {}, 'DELETE');
      setSelected(null);
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading
        title="Feedback & Customer Reviews Moderation"
        subtitle="Forwarded customer private complaints, service requests, and public reviews for moderation & resolution."
        actions={
          <Link className="button secondary" to="/app/reviews">
            ⭐ Customer Reviews Page
          </Link>
        }
      />
      
      <div style={{ marginBottom: '1.25rem' }}>
        <Field label="Filter Submissions by Status / Queue">
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); setSelected(null); }}>
            {['ALL', 'SUBMITTED', 'APPROVED', 'UNDER_REVIEW', 'REJECTED', 'RESOLVED', 'CLOSED'].map(s => (
              <option key={s} value={s === 'ALL' ? '' : s}>
                {s === 'ALL' ? 'All Submissions' : s === 'SUBMITTED' ? '⚡ Action Required (Submitted Complaints & Requests)' : s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <ErrorMessage error={error || result.error} />

      {result.loading ? (
        <Loading />
      ) : result.data && (
        <Panel title={`Customer Submissions (${result.data.totalElements || 0})`}>
          {result.data.content.map(f => (
            <div className="list-item" key={f.feedbackId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', marginBottom: '8px', borderRadius: '12px', background: 'var(--card-subtle)' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <small style={{ fontWeight: 600, color: 'var(--color-gold-primary)' }}>
                    {f.feedbackType === 'COMPLAINT' ? '🔒 Private Complaint' : f.feedbackType === 'SERVICE' ? '🛠️ Private Service Request' : '⭐ Public Review'}
                  </small>
                  <small>· #{f.feedbackId} · {date(f.createdAt)}</small>
                </div>
                <h3 style={{ margin: '0.3rem 0 0.2rem 0' }}>{f.subject}</h3>
                <StatusBadge status={f.status} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="secondary" onClick={() => { setSelected(f); setReason(''); setAction(moderationActions(f)[0] || ''); }}>
                  <Text value={"Open"} />
                </button>
                {canDelete && (
                  <button
                    type="button"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      background: 'var(--status-error)',
                      color: '#fff',
                      borderRadius: '6px'
                    }}
                    onClick={() => handleDelete(f.feedbackId)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          {!result.data.content.length && <Empty>No submissions found in this status queue.</Empty>}
          <Pagination data={result.data} onPage={setPage} />
        </Panel>
      )}

      {selected && (
        <Panel title={selected.subject}>
          <div style={{ marginBottom: '1rem' }}>
            <p className="preserve-lines" style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>{selected.message}</p>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>Type:</strong> {selected.feedbackType} {selected.rating && `· ${selected.rating}/5 stars`} · <StatusBadge status={selected.status} />
            </p>
          </div>

          {selected.staffResponse && (
            <div className="callout" style={{ marginBottom: '1rem' }}>
              <strong>Bank Staff Response:</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>{selected.staffResponse}</p>
            </div>
          )}

          {canDelete && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                style={{
                  padding: '6px 14px',
                  background: 'var(--status-error)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
                onClick={() => handleDelete(selected.feedbackId)}
              >
                🗑️ Delete Customer Submission (Manager/Admin Only)
              </button>
            </div>
          )}

          {allowed.length > 0 && (
            <form onSubmit={moderate} style={{ marginTop: '1.25rem' }}>
              <Field label="Moderation Action">
                <select value={action} onChange={e => setAction(e.target.value)}>
                  {allowed.map(a => (
                    <option key={a} value={a}>{a.toUpperCase()}</option>
                  ))}
                </select>
              </Field>
              <Field label="Staff Response / Action Reason">
                <textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} placeholder="Enter details to respond or resolve this customer request..." />
              </Field>
              <button disabled={busy}>{busy ? 'Recording…' : 'Record Moderation Action'}</button>
            </form>
          )}
        </Panel>
      )}
    </>
  );
}
