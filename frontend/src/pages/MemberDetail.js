import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useFaceDetection } from '../hooks/useFaceDetection';
import API from '../utils/api';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Camera, CreditCard, X, Check, Loader } from 'lucide-react';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { modelsLoaded, extractDescriptor } = useFaceDetection();
  const webcamRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFaceCamera, setShowFaceCamera] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [payment, setPayment] = useState({ planId: '', paymentMethod: 'Cash', amount: '', startDate: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([API.get(`/members/${id}`), API.get('/plans')]);
      setData(mRes.data);
      setPlans(pRes.data.data);
    } catch (err) {
      toast.error('Failed to load member');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payment.planId) return toast.error('Select a plan');
    setSaving(true);
    try {
      await API.post('/payments', { memberId: parseInt(id), ...payment, planId: parseInt(payment.planId) });
      toast.success('Payment recorded! Membership activated.');
      setShowPaymentModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setSaving(false);
    }
  };

  const captureFace = async () => {
    if (!webcamRef.current || !modelsLoaded) return;
    setCapturing(true);
    try {
      const screenshot = webcamRef.current.getScreenshot();
      const img = new Image();
      img.src = screenshot;
      await new Promise(r => img.onload = r);

      const descriptor = await extractDescriptor(img);
      await API.put(`/members/${id}/face`, { faceDescriptor: JSON.stringify(descriptor) });
      toast.success('Face data updated!');
      setShowFaceCamera(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Face capture failed');
    } finally {
      setCapturing(false);
    }
  };

  const toggleMember = async () => {
    try {
      await API.put(`/members/${id}`, { ...data.data, isActive: !data.data.IsActive });
      toast.success(`Member ${data.data.IsActive ? 'disabled' : 'enabled'}`);
      load();
    } catch (err) {
      toast.error('Failed to update member');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
  if (!data) return <div>Member not found</div>;

  const m = data.data;
  const daysLeft = m.MembershipExpiry ? differenceInDays(new Date(m.MembershipExpiry), new Date()) : null;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/members')} className="btn btn-ghost" style={{ padding: '0.5rem' }}><ArrowLeft size={16} /></button>
          <h1 className="page-title">{m.FirstName} {m.LastName}</h1>
          <code style={{ fontSize: '0.8rem', color: 'var(--accent-bright)', background: 'var(--accent-glow)', padding: '3px 8px', borderRadius: 4 }}>{m.MemberCode}</code>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={toggleMember} className={`btn ${m.IsActive ? 'btn-danger' : 'btn-success'}`}>
            {m.IsActive ? 'Disable Member' : 'Enable Member'}
          </button>
          <button onClick={() => setShowPaymentModal(true)} className="btn btn-primary">
            <CreditCard size={15} /> Record Payment
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Profile card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
              {m.PhotoPath
                ? <img src={`http://localhost:5000${m.PhotoPath}`} alt="" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
                : <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--bg-deep)', border: '3px solid var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-bright)' }}>
                    {m.FirstName[0]}{m.LastName[0]}
                  </div>
              }
              {m.FaceDescriptor && (
                <div style={{ position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, background: 'var(--green)', borderRadius: '50%', border: '2px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={10} color="white" />
                </div>
              )}
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>{m.FirstName} {m.LastName}</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: '1rem' }}>{m.Email}</p>
            <div style={{ marginBottom: '1rem' }}>
              {m.IsActive
                ? <span className="badge badge-active">Account Active</span>
                : <span className="badge badge-expired">Account Disabled</span>
              }
            </div>

            {/* Membership status */}
            {m.MembershipExpiry && (
              <div style={{
                padding: '0.75rem', borderRadius: 'var(--radius)',
                background: daysLeft < 0 ? 'var(--red-glow)' : daysLeft <= 7 ? 'var(--amber-glow)' : 'var(--green-glow)',
                border: `1px solid ${daysLeft < 0 ? 'var(--red)' : daysLeft <= 7 ? 'var(--amber)' : 'var(--green)'}44`,
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: daysLeft < 0 ? 'var(--red)' : daysLeft <= 7 ? 'var(--amber)' : 'var(--green)' }}>
                  {daysLeft < 0 ? 'EXPIRED' : `${daysLeft} days`}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  Until {format(new Date(m.MembershipExpiry), 'MMM d, yyyy')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>{m.PlanName}</div>
              </div>
            )}

            <button onClick={() => setShowFaceCamera(s => !s)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}>
              <Camera size={14} /> {m.FaceDescriptor ? 'Update Face' : 'Enroll Face'}
            </button>

            {showFaceCamera && (
              <div style={{ marginTop: '0.75rem' }}>
                <div className="camera-container">
                  <Webcam ref={webcamRef} screenshotFormat="image/jpeg" mirrored />
                  <div className="face-overlay"><div className="face-frame" /></div>
                </div>
                <button onClick={captureFace} disabled={capturing || !modelsLoaded} className="btn btn-success" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                  {capturing ? <><Loader size={14} /> Detecting...</> : <><Camera size={14} /> Capture Face</>}
                </button>
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Details</h3>
            {[
              ['Phone', m.Phone],
              ['Gender', m.Gender],
              ['DOB', m.DateOfBirth ? format(new Date(m.DateOfBirth), 'MMM d, yyyy') : null],
              ['Address', m.Address],
              ['Emergency', m.EmergencyContact],
              ['Joined', format(new Date(m.CreatedAt), 'MMM d, yyyy')],
            ].map(([label, value]) => value ? (
              <div key={label} style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</span>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 1 }}>{value}</div>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Right: history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Payment history */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Payment History</h3>
            </div>
            <table>
              <thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Method</th><th>Period</th><th>Status</th></tr></thead>
              <tbody>
                {(data.payments || []).map(p => (
                  <tr key={p.PaymentID}>
                    <td>{format(new Date(p.PaymentDate), 'MMM d, yyyy')}</td>
                    <td>{p.PlanName}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>₹{Number(p.Amount).toLocaleString()}</td>
                    <td>{p.PaymentMethod}</td>
                    <td style={{ fontSize: '0.78rem' }}>{format(new Date(p.StartDate), 'MMM d')} – {format(new Date(p.EndDate), 'MMM d, yyyy')}</td>
                    <td><span className={`badge badge-${p.Status === 'Active' ? 'active' : 'info'}`}>{p.Status}</span></td>
                  </tr>
                ))}
                {!data.payments?.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '1.5rem' }}>No payments</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Entry logs */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Recent Entries</h3>
            </div>
            <table>
              <thead><tr><th>Date/Time</th><th>Action</th><th>Method</th><th>Confidence</th></tr></thead>
              <tbody>
                {(data.entries || []).map(e => (
                  <tr key={e.LogID}>
                    <td>{format(new Date(e.EntryTime), 'MMM d, yyyy h:mm a')}</td>
                    <td><span className={`badge badge-${e.Status === 'Entry' ? 'active' : 'info'}`}>{e.Status}</span></td>
                    <td>{e.DetectionMethod}</td>
                    <td>{e.ConfidenceScore ? `${Math.round(e.ConfidenceScore * 100)}%` : '—'}</td>
                  </tr>
                ))}
                {!data.entries?.length && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '1.5rem' }}>No entries</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-backdrop" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Record Payment</h2>
            <form onSubmit={handlePayment}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label>Membership Plan *</label>
                  <select value={payment.planId} onChange={e => {
                    const plan = plans.find(p => p.PlanID === parseInt(e.target.value));
                    setPayment(p => ({ ...p, planId: e.target.value, amount: plan?.Price || '' }));
                  }} required>
                    <option value="">Select plan</option>
                    {plans.map(p => <option key={p.PlanID} value={p.PlanID}>{p.PlanName} — ₹{p.Price} ({p.DurationDays}d)</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <div>
                    <label>Amount</label>
                    <input type="number" value={payment.amount} onChange={e => setPayment(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div>
                    <label>Payment Method</label>
                    <select value={payment.paymentMethod} onChange={e => setPayment(p => ({ ...p, paymentMethod: e.target.value }))}>
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Paytm</option>
                      <option>Google Pay</option>
                      <option>PhonePe</option>
                      <option>Credit Card</option>
                      <option>Debit Card</option>
                      <option>Bank Transfer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label>Start Date</label>
                  <input type="date" value={payment.startDate} onChange={e => setPayment(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <label>Notes</label>
                  <textarea value={payment.notes} onChange={e => setPayment(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Optional notes..." />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-ghost">Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-success">
                    {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Processing...</> : <><Check size={15} /> Confirm Payment</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
