import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EntryLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { load(); }, [date]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/entry/logs?date=${date}&limit=100`);
      setLogs(res.data.data);
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Entry Logs</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 160 }} />
          <button onClick={load} className="btn btn-ghost"><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
          : (
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Method</th>
                  <th>Confidence</th>
                  <th>Station</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(e => (
                  <tr key={e.LogID}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div className="avatar-placeholder" style={{ width: 30, height: 30, fontSize: '0.7rem' }}>
                          {e.MemberName?.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{e.MemberName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{e.MemberCode}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{format(new Date(e.EntryTime), 'h:mm:ss a')}</td>
                    <td><span className={`badge badge-${e.Status === 'Entry' ? 'active' : 'info'}`}>{e.Status}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{e.DetectionMethod}</td>
                    <td>{e.ConfidenceScore ? `${Math.round(e.ConfidenceScore * 100)}%` : '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{e.StationID}</td>
                  </tr>
                ))}
                {!logs.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>No entries for this date</td></tr>}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}
