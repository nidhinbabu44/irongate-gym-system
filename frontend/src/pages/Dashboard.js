import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, UserCheck, CreditCard, DoorOpen, TrendingUp, AlertTriangle, Activity, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
    const t = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(t);
  }, []);

  const loadStats = async () => {
    try {
      const res = await API.get('/dashboard/stats');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const runExpiry = async () => {
    try {
      const res = await API.post('/admin/run-expiry');
      toast.success(res.data.message);
      loadStats();
    } catch (err) {
      toast.error('Expiry check failed');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const s = data?.stats || {};

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={runExpiry} className="btn btn-ghost" style={{ fontSize: '0.82rem' }}>
            <AlertTriangle size={14} /> Run Expiry Check
          </button>
          <button onClick={() => navigate('/kiosk')} className="btn btn-success">
            <DoorOpen size={16} /> Entry Kiosk
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard icon={<Users size={28} />} value={s.totalActiveMembers} label="Active Members" color="var(--accent)" onClick={() => navigate('/members?status=active')} />
        <StatCard icon={<UserCheck size={28} />} value={s.activeMemberships} label="Active Memberships" color="var(--green)" />
        <StatCard icon={<Activity size={28} />} value={s.currentlyInside} label="Currently Inside" color="#a78bfa" />
        <StatCard icon={<DoorOpen size={28} />} value={s.todayEntries} label="Today's Entries" color="var(--amber)" />
        <StatCard icon={<CreditCard size={28} />} value={`₹${Number(s.todayRevenue || 0).toLocaleString()}`} label="Today Revenue" color="var(--green)" />
        <StatCard icon={<TrendingUp size={28} />} value={`₹${Number(s.monthRevenue || 0).toLocaleString()}`} label="Month Revenue" color="var(--accent)" />
        <StatCard icon={<AlertTriangle size={28} />} value={s.expiringThisWeek} label="Expiring This Week" color="var(--amber)" onClick={() => navigate('/members?status=expiring')} />
        <StatCard icon={<Clock size={28} />} value={s.expiredToday} label="Expired Today" color="var(--red)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.25rem' }}>
        {/* Recent activity */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(data?.recentEntries || []).map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: '0.75rem' }}>
                  {entry.MemberName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.MemberName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {format(new Date(entry.EntryTime), 'MMM d, h:mm a')}
                  </div>
                </div>
                <span className={`badge badge-${entry.Status === 'Entry' ? 'active' : 'info'}`}>
                  {entry.Status}
                </span>
              </div>
            ))}
            {!data?.recentEntries?.length && <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No activity today</p>}
          </div>
        </div>

        {/* Weekly chart */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Weekly Entries
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.weeklyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="Date" tick={{ fill: 'var(--text-dim)', fontSize: 11 }} tickFormatter={d => format(new Date(d), 'EEE')} />
              <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                formatter={(v) => [v, 'Entries']}
                labelFormatter={d => format(new Date(d), 'EEE, MMM d')}
              />
              <Bar dataKey="Entries" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-icon" style={{ color }}>{React.cloneElement(icon, { size: 40 })}</div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
