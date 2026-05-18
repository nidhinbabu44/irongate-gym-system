import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { format, differenceInDays } from 'date-fns';
import { Plus, Search, RefreshCw, UserCheck, UserX, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MembersPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await API.get(`/members?${params}`);
      setMembers(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const getMembershipBadge = (m) => {
    if (!m.MembershipExpiry) return <span className="badge badge-expired">No Plan</span>;
    const days = differenceInDays(new Date(m.MembershipExpiry), new Date());
    if (days < 0) return <span className="badge badge-expired">Expired</span>;
    if (days <= 7) return <span className="badge badge-warning">{days}d left</span>;
    return <span className="badge badge-active">Active</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Members</h1>
        <button onClick={() => navigate('/members/new')} className="btn btn-primary">
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="search-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            placeholder="Search name, code, email, phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">All Members</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
        <button onClick={load} className="btn btn-ghost"><RefreshCw size={14} /></button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Code</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Account</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.MemberID} onClick={() => navigate(`/members/${m.MemberID}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {m.PhotoPath
                        ? <img src={`http://localhost:5000${m.PhotoPath}`} alt="" className="avatar" />
                        : <div className="avatar-placeholder">{m.FirstName[0]}{m.LastName[0]}</div>
                      }
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                          {m.FirstName} {m.LastName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{m.Email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td><code style={{ fontSize: '0.78rem', color: 'var(--accent-bright)' }}>{m.MemberCode}</code></td>
                  <td>{m.Phone || '—'}</td>
                  <td style={{ fontSize: '0.82rem' }}>{m.PlanName || '—'}</td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {m.MembershipExpiry ? format(new Date(m.MembershipExpiry), 'MMM d, yyyy') : '—'}
                  </td>
                  <td>{getMembershipBadge(m)}</td>
                  <td>
                    {m.IsActive
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)', fontSize: '0.78rem' }}><UserCheck size={13} /> Active</span>
                      : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', fontSize: '0.78rem' }}><UserX size={13} /> Disabled</span>
                    }
                  </td>
                </tr>
              ))}
              {!members.length && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>No members found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
          <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Page {page} of {Math.ceil(total / LIMIT)} ({total} total)
          </span>
          <button className="btn btn-ghost" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      )}
    </div>
  );
}
