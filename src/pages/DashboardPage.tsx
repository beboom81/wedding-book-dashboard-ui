import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { request, HTTP_GET, HTTP_PUT, HTTP_DELETE } from '../lib/api';
import { auth } from '../lib/auth';
import type { Stats, UserProfile, CommentItem, CommentListV2 } from '../lib/types';

const PER = 10;

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="col-6 col-md-3">
      <div className={`card border-0 rounded-4 shadow-sm text-white bg-${color}`}>
        <div className="card-body d-flex align-items-center gap-3 py-3">
          <span style={{ fontSize: '2rem' }}>{icon}</span>
          <div>
            <div className="fw-bold fs-4">{value}</div>
            <div className="small opacity-75">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentCard({
  c,
  token,
  onRefresh,
}: {
  c: CommentItem;
  token: string;
  onRefresh: () => void;
}) {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [loading, setLoading] = useState(false);

  const del = async () => {
    if (!confirm('Delete this comment?')) return;
    try {
      await request(HTTP_DELETE, `/api/comment/${c.uuid}`).token(token).send();
      onRefresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  };

  const reply = async () => {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      await request(HTTP_PUT, `/api/comment/${c.uuid}`)
        .token(token)
        .body({ comment: replyText })
        .send();
      setReplyText('');
      setShowReply(false);
      onRefresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 mb-3">
      <div className="card-body py-3">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <div>
            <span className="fw-semibold me-2">{c.name}</span>
            <span className={`badge rounded-pill ${c.presence ? 'bg-success' : 'bg-secondary'} me-1`}>
              {c.presence ? 'Attending' : 'Not attending'}
            </span>
            {c.is_admin && <span className="badge rounded-pill bg-primary me-1">Admin</span>}
            <span className="badge rounded-pill bg-light text-dark border">
              ❤️ {c.like_count}
            </span>
          </div>
          <small className="text-muted">{new Date(c.created_at).toLocaleString()}</small>
        </div>

        {c.comment && <p className="mb-2 text-body">{c.comment}</p>}
        {c.gif_url && (
          <img src={c.gif_url} alt="gif" className="rounded-3 mb-2" style={{ maxHeight: 120 }} />
        )}

        {/* Replies */}
        {c.replies && c.replies.length > 0 && (
          <div className="border-start border-3 border-primary ps-3 mb-2">
            {c.replies.map(r => (
              <div key={r.uuid} className="mb-1">
                <span className="fw-semibold me-2 small">{r.name}</span>
                <span className="small text-body">{r.comment}</span>
              </div>
            ))}
          </div>
        )}

        <div className="d-flex gap-2 flex-wrap mt-2">
          <button className="btn btn-sm btn-outline-primary rounded-3" onClick={() => setShowReply(v => !v)}>
            💬 Reply
          </button>
          <button className="btn btn-sm btn-outline-danger rounded-3" onClick={del}>
            🗑 Delete
          </button>
        </div>

        {showReply && (
          <div className="mt-2 d-flex gap-2">
            <input
              className="form-control form-control-sm rounded-3"
              placeholder="Write a reply..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && reply()}
            />
            <button className="btn btn-sm btn-primary rounded-3" onClick={reply} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : 'Send'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const nav = useNavigate();
  const token = auth.get()!;

  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'comments' | 'settings'>('comments');

  const logout = () => { auth.clear(); nav('/login'); };

  const loadStats = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([
        request(HTTP_GET, '/api/stats').token(token).send<Stats>(),
        request(HTTP_GET, '/api/user').token(token).send<UserProfile>(),
      ]);
      setStats(s.data);
      setProfile(p.data);
    } catch {
      logout();
    }
  }, [token]);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request(HTTP_GET, `/api/v2/comment?per=${PER}&next=${page}`)
        .token(token)
        .send<CommentListV2>();
      setComments(res.data.lists);
      setCount(res.data.count);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadComments(); }, [loadComments]);

  const totalPages = Math.ceil(count / PER);

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand bg-white shadow-sm px-3 py-2 mb-4">
        <span className="navbar-brand fw-bold">💒 Wedding Dashboard</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          {profile && <span className="small text-muted">👋 {profile.name}</span>}
          <button className="btn btn-sm btn-outline-secondary rounded-3" onClick={logout}>
            Sign Out
          </button>
        </div>
      </nav>

      <div className="container pb-5">
        {/* Stats */}
        {stats && (
          <div className="row g-3 mb-4">
            <StatCard label="Comments" value={stats.comments} icon="💬" color="primary" />
            <StatCard label="Attending" value={stats.present} icon="✅" color="success" />
            <StatCard label="Not Attending" value={stats.absent} icon="❌" color="secondary" />
            <StatCard label="Likes" value={stats.likes} icon="❤️" color="danger" />
          </div>
        )}

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${tab === 'comments' ? 'active' : ''}`}
              onClick={() => setTab('comments')}
            >
              💬 Comments
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${tab === 'settings' ? 'active' : ''}`}
              onClick={() => setTab('settings')}
            >
              ⚙️ Settings
            </button>
          </li>
        </ul>

        {/* Comments Tab */}
        {tab === 'comments' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <small className="text-muted">{count} total comments</small>
              <button className="btn btn-sm btn-outline-primary rounded-3" onClick={loadComments}>
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-muted py-5">No comments yet.</div>
            ) : (
              comments.map(c => (
                <CommentCard key={c.uuid} c={c} token={token} onRefresh={loadComments} />
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button
                  className="btn btn-sm btn-outline-secondary rounded-3"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - PER)}
                >
                  ← Prev
                </button>
                <span className="btn btn-sm disabled">
                  {Math.floor(page / PER) + 1} / {totalPages}
                </span>
                <button
                  className="btn btn-sm btn-outline-secondary rounded-3"
                  disabled={page + PER >= count}
                  onClick={() => setPage(p => p + PER)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && profile && (
          <SettingsPanel profile={profile} token={token} onSaved={loadStats} />
        )}
      </div>
    </div>
  );
}

function SettingsPanel({ profile, token, onSaved }: { profile: UserProfile; token: string; onSaved: () => void }) {
  const [name, setName] = useState(profile.name);
  const [tz, setTz] = useState(profile.tz ?? '');
  const [canEdit, setCanEdit] = useState(profile.can_edit);
  const [canDelete, setCanDelete] = useState(profile.can_delete);
  const [canReply, setCanReply] = useState(profile.can_reply);
  const [confetti, setConfetti] = useState(profile.is_confetti_animation);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const body: Record<string, unknown> = {
        name, tz: tz || null,
        can_edit: canEdit, can_delete: canDelete, can_reply: canReply,
        confetti_animation: confetti,
      };
      if (oldPwd && newPwd) { body.old_password = oldPwd; body.new_password = newPwd; }
      await request('PATCH', '/api/user').token(token).body(body).send();
      setMsg('✅ Saved successfully');
      setOldPwd(''); setNewPwd('');
      onSaved();
    } catch (e: unknown) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setSaving(false);
    }
  };

  const rotateKey = async () => {
    if (!confirm('Generate a new guest key? The old key will stop working.')) return;
    try {
      await request(HTTP_PUT, '/api/key').token(token).send();
      setMsg('✅ Key rotated — update VITE_GUEST_KEY in wedding-book-ui');
      onSaved();
    } catch (e: unknown) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'Error'}`);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-md-6">
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <h6 className="fw-bold mb-3">Profile</h6>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Name</label>
            <input className="form-control rounded-3" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email</label>
            <input className="form-control rounded-3" value={profile.email} disabled />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Timezone</label>
            <input className="form-control rounded-3" value={tz} onChange={e => setTz(e.target.value)} placeholder="Asia/Ho_Chi_Minh" />
          </div>
          <h6 className="fw-bold mt-2 mb-3">Change Password</h6>
          <div className="mb-3">
            <input className="form-control rounded-3" type="password" placeholder="Current password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} />
          </div>
          <div className="mb-3">
            <input className="form-control rounded-3" type="password" placeholder="New password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <h6 className="fw-bold mb-3">Guest Permissions</h6>
          {[
            ['Allow guests to edit comments', canEdit, setCanEdit] as const,
            ['Allow guests to delete comments', canDelete, setCanDelete] as const,
            ['Allow guests to reply', canReply, setCanReply] as const,
            ['Show confetti animation', confetti, setConfetti] as const,
          ].map(([label, val, setter]) => (
            <div className="form-check form-switch mb-2" key={label}>
              <input
                className="form-check-input"
                type="checkbox"
                checked={val}
                onChange={e => setter(e.target.checked)}
                id={label}
              />
              <label className="form-check-label small" htmlFor={label}>{label}</label>
            </div>
          ))}
        </div>

        <div className="card border-0 shadow-sm rounded-4 p-4">
          <h6 className="fw-bold mb-2">Guest Key</h6>
          <code className="d-block bg-light rounded-3 p-2 small mb-3 text-break">{profile.access_key}</code>
          <button className="btn btn-sm btn-outline-warning rounded-3" onClick={rotateKey}>
            🔄 Rotate Key
          </button>
        </div>
      </div>

      {msg && <div className="col-12"><div className="alert alert-info py-2 small">{msg}</div></div>}
      <div className="col-12">
        <button className="btn btn-primary rounded-3 px-4" onClick={save} disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          Save Changes
        </button>
      </div>
    </div>
  );
}
