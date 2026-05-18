import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Dumbbell, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error('Enter credentials');
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        opacity: 0.3,
      }} />
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(59,130,246,0.4)',
            marginBottom: '1rem',
          }}>
            <Dumbbell size={36} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, letterSpacing: 2, color: 'var(--text-primary)' }}>IRONGATE</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', letterSpacing: 2, marginTop: 4 }}>GYM MANAGEMENT SYSTEM</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ border: '1px solid var(--border-glow)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
            Admin Login
          </h2>

          <div style={{ marginBottom: '1rem' }}>
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <label>Password</label>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Enter password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPw(s => !s)}
              style={{
                position: 'absolute', right: '0.75rem', bottom: '0.6rem',
                background: 'none', border: 'none', color: 'var(--text-dim)',
                cursor: 'pointer', padding: 0,
              }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing In...</> : 'Sign In'}
          </button>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a href="/kiosk" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>→ Open Entry Kiosk</a>
          </div>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '1.5rem' }}>
          Default: admin / Admin@123456
        </p>
      </div>
    </div>
  );
}
