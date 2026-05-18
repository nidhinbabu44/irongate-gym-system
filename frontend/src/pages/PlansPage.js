import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Check, X } from 'lucide-react';

const EMPTY = { planId: null, planName: '', description: '', durationDays: 30, price: '', features: '' };

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await API.get('/plans');
      setPlans(res.data.data);
    } catch { toast.error('Failed to load plans'); }
  };

  const openEdit = (plan) => {
    setForm({ planId: plan.PlanID, planName: plan.PlanName, description: plan.Description || '', durationDays: plan.DurationDays, price: plan.Price, features: plan.Features || '' });
    setEditing(plan.PlanID);
  };

  const openNew = () => { setForm(EMPTY); setEditing('new'); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post('/plans', form);
      toast.success('Plan saved!');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Membership Plans</h1>
        <button onClick={openNew} className="btn btn-primary"><Plus size={15} /> Add Plan</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {plans.map(p => (
          <div key={p.PlanID} className="card" style={{ position: 'relative' }}>
            <button onClick={() => openEdit(p)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
              <Edit size={15} />
            </button>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{p.PlanName}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>{p.Description}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--accent-bright)' }}>₹{Number(p.Price).toLocaleString()}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{p.DurationDays} days</div>
            {p.Features && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                {p.Features.split(',').map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
                    <Check size={11} color="var(--green)" /> {f.trim()}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit/Add Modal */}
      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editing === 'new' ? 'Add Plan' : 'Edit Plan'}</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label>Plan Name *</label>
                  <input value={form.planName} onChange={set('planName')} required placeholder="e.g. Monthly Basic" />
                </div>
                <div>
                  <label>Description</label>
                  <input value={form.description} onChange={set('description')} placeholder="Short description" />
                </div>
                <div className="form-grid">
                  <div>
                    <label>Duration (days) *</label>
                    <input type="number" value={form.durationDays} onChange={set('durationDays')} required min={1} />
                  </div>
                  <div>
                    <label>Price (₹) *</label>
                    <input type="number" value={form.price} onChange={set('price')} required min={0} step="0.01" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label>Features (comma-separated)</label>
                  <input value={form.features} onChange={set('features')} placeholder="Full gym access,Locker,Towel" />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost"><X size={14} /> Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : <><Check size={14} /> Save Plan</>}
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
