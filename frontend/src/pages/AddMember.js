import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useFaceDetection } from '../hooks/useFaceDetection';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { Camera, X, Check, ArrowLeft, Loader } from 'lucide-react';

export default function AddMember() {
  const navigate = useNavigate();
  const { modelsLoaded, extractDescriptor } = useFaceDetection();
  const webcamRef = useRef(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: '', address: '', emergencyContact: '', notes: '',
  });
  const [photo, setPhoto] = useState(null); // file
  const [photoPreview, setPhotoPreview] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) return;
    setCapturing(true);
    try {
      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) throw new Error('Camera not ready');

      // Create image element for face detection
      const img = new Image();
      img.src = screenshot;
      await new Promise(r => img.onload = r);

      if (modelsLoaded) {
        try {
          const descriptor = await extractDescriptor(img);
          setFaceDescriptor(JSON.stringify(descriptor));
          toast.success('Face captured successfully!');
        } catch {
          toast.error('No face detected. Please try again.');
          return;
        }
      }

      // Convert screenshot to file
      const res = await fetch(screenshot);
      const blob = await res.blob();
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      setPhoto(file);
      setPhotoPreview(screenshot);
      setShowCamera(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCapturing(false);
    }
  }, [webcamRef, modelsLoaded, extractDescriptor]);

  const handleFilePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
    // Note: descriptor will be extracted on save
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) return toast.error('Name is required');
    setSaving(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => v && formData.append(k, v));
      if (photo) formData.append('photo', photo);
      if (faceDescriptor) formData.append('faceDescriptor', faceDescriptor);

      const res = await API.post('/members', formData);
      toast.success(`Member ${res.data.data.MemberCode} created!`);
      navigate(`/members/${res.data.data.MemberID}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/members')} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={16} />
          </button>
          <h1 className="page-title">Add New Member</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Personal Information
              </h3>
              <div className="form-grid">
                <div>
                  <label>First Name *</label>
                  <input value={form.firstName} onChange={set('firstName')} placeholder="First name" required />
                </div>
                <div>
                  <label>Last Name *</label>
                  <input value={form.lastName} onChange={set('lastName')} placeholder="Last name" required />
                </div>
                <div>
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="email@example.com" />
                </div>
                <div>
                  <label>Phone</label>
                  <input value={form.phone} onChange={set('phone')} placeholder="+63 9XX XXX XXXX" />
                </div>
                <div>
                  <label>Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                </div>
                <div>
                  <label>Gender</label>
                  <select value={form.gender} onChange={set('gender')}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-full">
                  <label>Address</label>
                  <input value={form.address} onChange={set('address')} placeholder="Complete address" />
                </div>
                <div>
                  <label>Emergency Contact</label>
                  <input value={form.emergencyContact} onChange={set('emergencyContact')} placeholder="Name & Phone" />
                </div>
                <div className="form-full">
                  <label>Notes</label>
                  <textarea value={form.notes} onChange={set('notes')} placeholder="Any notes..." rows={2} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => navigate('/members')} className="btn btn-ghost">Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : <><Check size={16} /> Create Member</>}
              </button>
            </div>
          </div>

          {/* Right: photo + face */}
          <div className="card" style={{ position: 'sticky', top: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Photo & Face ID
            </h3>

            {/* Photo preview */}
            <div style={{
              width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-deep)', border: '2px dashed var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', marginBottom: '1rem', position: 'relative',
            }}>
              {photoPreview
                ? <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                    <Camera size={40} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                    <div style={{ fontSize: '0.8rem' }}>No photo</div>
                  </div>
              }
              {faceDescriptor && (
                <div style={{
                  position: 'absolute', bottom: 8, right: 8,
                  background: 'var(--green)', color: 'white',
                  fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                  letterSpacing: 0.5,
                }}>
                  ✓ FACE ENROLLED
                </div>
              )}
            </div>

            {/* Camera */}
            {showCamera && (
              <div style={{ marginBottom: '1rem' }}>
                <div className="camera-container">
                  <Webcam ref={webcamRef} screenshotFormat="image/jpeg" mirrored />
                  <div className="face-overlay"><div className="face-frame" /></div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button type="button" onClick={capturePhoto} disabled={capturing} className="btn btn-success" style={{ flex: 1 }}>
                    {capturing ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={14} />}
                    {capturing ? 'Detecting...' : 'Capture'}
                  </button>
                  <button type="button" onClick={() => setShowCamera(false)} className="btn btn-ghost">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {!showCamera && (
                <button type="button" onClick={() => setShowCamera(true)} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                  <Camera size={15} /> Take Photo + Enroll Face
                </button>
              )}
              <label className="btn btn-ghost" style={{ textAlign: 'center', cursor: 'pointer', justifyContent: 'center' }}>
                <input type="file" accept="image/*" onChange={handleFilePhoto} style={{ display: 'none' }} />
                Upload Photo
              </label>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius)', fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              {modelsLoaded
                ? '✅ Face recognition models loaded. Taking a photo will automatically enroll the member\'s face for entry.'
                : '⏳ Loading face recognition models...'
              }
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
