import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { format } from 'date-fns';
import { RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get('/payments');
      setPayments(res.data.data);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payment Records</h1>
        <button onClick={load} className="btn btn-ghost"><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
          : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Period</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.PaymentID}>
                    <td style={{ fontSize: '0.82rem' }}>{format(new Date(p.PaymentDate), 'MMM d, yyyy')}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{p.MemberName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{p.MemberCode}</div>
                    </td>
                    <td>{p.PlanName}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>₹{Number(p.Amount).toLocaleString()}</td>
                    <td>{p.PaymentMethod}</td>
                    <td style={{ fontSize: '0.78rem' }}>
                      {format(new Date(p.StartDate), 'MMM d')} – {format(new Date(p.EndDate), 'MMM d, yyyy')}
                    </td>
                    <td><span className={`badge badge-${p.Status === 'Active' ? 'active' : 'info'}`}>{p.Status}</span></td>
                  </tr>
                ))}
                {!payments.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>No payments found</td></tr>}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}
