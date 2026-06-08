import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { request, HTTP_POST } from '../lib/api';
import { auth } from '../lib/auth';

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await request(HTTP_POST, '/api/session')
        .body({ email, password })
        .send<{ token: string }>();
      auth.set(res.data.token);
      nav('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm border-0 rounded-4 p-4" style={{ width: '100%', maxWidth: 400 }}>
        <h4 className="text-center fw-bold mb-1">💒 Wedding Dashboard</h4>
        <p className="text-center text-muted small mb-4">Sign in to manage your wedding</p>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email</label>
            <input
              type="email"
              className="form-control rounded-3"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-semibold">Password</label>
            <input
              type="password"
              className="form-control rounded-3"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary w-100 rounded-3" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            Sign In
          </button>
        </form>
        <hr className="my-3" />
        <p className="text-center small mb-0">
          Don't have an account?{' '}
          <Link to="/register" className="text-decoration-none">Register</Link>
        </p>
      </div>
    </div>
  );
}
