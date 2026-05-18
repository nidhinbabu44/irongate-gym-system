import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useFaceDetection } from '../hooks/useFaceDetection';
import API from '../utils/api';
import { format } from 'date-fns';
import { CheckCircle, XCircle, AlertCircle, Loader, RotateCcw, Dumbbell } from 'lucide-react';

const STATUS = { IDLE: 'idle', SCANNING: 'scanning', IDENTIFIED: 'identified', ACCESS_GRANTED: 'granted', ACCESS_DENIED: 'denied', ERROR: 'error' };

export default function EntryKiosk() {
  const webcamRef = useRef(null);
  const { modelsLoaded, loading: modelsLoading, error: modelError, loadFaceDescriptors, detectFace } = useFaceDetection();

  const [status, setStatus] = useState(STATUS.IDLE);
  const [result, setResult] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const autoScanRef = useRef(null);

  // Load faces when models ready
  useEffect(() => {
    if (modelsLoaded) {
      loadFaceDescriptors().then(count => {
        setMemberCount(count);
        console.log(`Loaded ${count} member faces`);
      });
    }
  }, [modelsLoaded, loadFaceDescriptors]);

  const resetToIdle = useCallback(() => {
    setStatus(STATUS.IDLE);
    setResult(null);
  }, []);

  const handleScan = useCallback(async () => {
    if (scanning || !webcamRef.current || !modelsLoaded) return;
    setScanning(true);
    setStatus(STATUS.SCANNING);

    try {
      const video = webcamRef.current.video;
      if (!video || video.readyState < 2) {
        setScanning(false);
        setStatus(STATUS.IDLE);
        return;
      }

      const detection = await detectFace(video);

      if (!detection || !detection.found) {
        setStatus(STATUS.IDLE);
        setScanning(false);
        return;
      }

      if (detection.isUnknown || !detection.memberId) {
        setStatus(STATUS.ACCESS_DENIED);
        setResult({ message: 'Face not recognized. Please register at the front desk.', type: 'unknown' });
        setTimeout(resetToIdle, 4000);
        setScanning(false);
        return;
      }

      setStatus(STATUS.IDENTIFIED);

      // Verify with server
      const res = await API.post('/entry/verify', {
        memberId: detection.memberId,
        confidenceScore: (1 - detection.distance).toFixed(4),
        stationId: 'Main-Kiosk',
      });

      if (res.data.access) {
        setStatus(STATUS.ACCESS_GRANTED);
        setResult({ ...res.data, confidence: detection.confidence });
      } else {
        setStatus(STATUS.ACCESS_DENIED);
        setResult(res.data);
      }

      setTimeout(resetToIdle, 5000);
    } catch (err) {
      console.error('Scan error:', err);
      setStatus(STATUS.ERROR);
      setResult({ message: 'System error. Please try again.' });
      setTimeout(resetToIdle, 3000);
    } finally {
      setScanning(false);
    }
  }, [scanning, modelsLoaded, detectFace, resetToIdle]);

  // Auto-scan every 1.5 seconds when idle
  useEffect(() => {
    if (!autoScan || !modelsLoaded) return;
    const interval = setInterval(() => {
      if (status === STATUS.IDLE) handleScan();
    }, 1500);
    return () => clearInterval(interval);
  }, [autoScan, modelsLoaded, status, handleScan]);

  const getStatusColor = () => ({
    [STATUS.IDLE]: 'var(--accent)',
    [STATUS.SCANNING]: 'var(--amber)',
    [STATUS.IDENTIFIED]: 'var(--amber)',
    [STATUS.ACCESS_GRANTED]: 'var(--green)',
    [STATUS.ACCESS_DENIED]: 'var(--red)',
    [STATUS.ERROR]: 'var(--red)',
  }[status] || 'var(--accent)');

  const getBorderColor = () => getStatusColor();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', right: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(59,130,246,0.4)' }}>
            <Dumbbell size={18} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1 }}>IRONGATE GYM</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: 1.5 }}>ENTRY SYSTEM</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600 }}>{format(new Date(), 'h:mm a')}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{format(new Date(), 'EEEE, MMMM d')}</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, textAlign: 'center' }}>
        {/* Camera */}
        <div style={{
          position: 'relative',
          borderRadius: 20,
          overflow: 'hidden',
          border: `3px solid ${getBorderColor()}`,
          boxShadow: `0 0 40px ${getBorderColor()}33`,
          transition: 'border-color 0.3s, box-shadow 0.3s',
          marginBottom: '1.5rem',
          background: 'var(--bg-dark)',
        }}>
          {modelsLoaded ? (
            <Webcam
              ref={webcamRef}
              mirrored
              screenshotFormat="image/jpeg"
              style={{ width: '100%', display: 'block', maxHeight: 380, objectFit: 'cover' }}
              videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
            />
          ) : (
            <div style={{ height: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-dim)' }}>
              <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
              <div>{modelsLoading ? 'Loading face recognition models...' : modelError || 'Initializing...'}</div>
            </div>
          )}

          {/* Face frame overlay */}
          {status !== STATUS.ACCESS_GRANTED && status !== STATUS.ACCESS_DENIED && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: 180, height: 200,
                border: `2px solid ${getStatusColor()}`,
                borderRadius: '50% 50% 45% 45%',
                boxShadow: `0 0 0 6px ${getStatusColor()}22, inset 0 0 30px ${getStatusColor()}11`,
                animation: status === STATUS.SCANNING ? 'pulse-frame 0.8s ease-in-out infinite' : 'pulse-frame 2s ease-in-out infinite',
              }} />
            </div>
          )}

          {/* Result overlay */}
          {(status === STATUS.ACCESS_GRANTED || status === STATUS.ACCESS_DENIED) && (
            <div style={{
              position: 'absolute', inset: 0,
              background: status === STATUS.ACCESS_GRANTED ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(2px)',
            }}>
              {status === STATUS.ACCESS_GRANTED
                ? <CheckCircle size={80} color="var(--green)" style={{ filter: 'drop-shadow(0 0 20px var(--green))' }} />
                : <XCircle size={80} color="var(--red)" style={{ filter: 'drop-shadow(0 0 20px var(--red))' }} />
              }
            </div>
          )}

          {/* Scanning indicator */}
          {status === STATUS.SCANNING && (
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(245,158,11,0.9)', color: '#000', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1, padding: '4px 12px', borderRadius: 20 }}>
              SCANNING...
            </div>
          )}

          {/* Status bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            padding: '2rem 1rem 0.75rem',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            letterSpacing: 0.5,
          }}>
            {status === STATUS.IDLE && '● Look at the camera to check in'}
            {status === STATUS.SCANNING && '● Analyzing face...'}
            {status === STATUS.IDENTIFIED && '● Verifying membership...'}
            {status === STATUS.ACCESS_GRANTED && `● ${result?.action || 'Entry'} recorded`}
            {status === STATUS.ACCESS_DENIED && '● Access denied'}
            {status === STATUS.ERROR && '● Error occurred'}
          </div>
        </div>

        {/* Result card */}
        {result && (status === STATUS.ACCESS_GRANTED || status === STATUS.ACCESS_DENIED) && (
          <div style={{
            background: status === STATUS.ACCESS_GRANTED ? 'var(--green-glow)' : 'var(--red-glow)',
            border: `1px solid ${status === STATUS.ACCESS_GRANTED ? 'var(--green)' : 'var(--red)'}44`,
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            textAlign: 'left',
          }}>
            {status === STATUS.ACCESS_GRANTED && result.member ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--green)' }}>
                      {result.action?.toUpperCase()} ✓
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {result.member.FirstName} {result.member.LastName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{result.member.MemberCode}</div>
                  </div>
                  {result.confidence && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--green)' }}>{result.confidence}%</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>MATCH</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <span>Plan: {result.member.PlanName}</span>
                  {result.member.daysRemaining && <span>Expires in: {result.member.daysRemaining}d</span>}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={24} color="var(--red)" />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--red)' }}>ACCESS DENIED</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>{result.message}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={handleScan}
            disabled={scanning || !modelsLoaded || status !== STATUS.IDLE}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.5rem' }}
          >
            {scanning ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Scanning</> : 'Manual Scan'}
          </button>
          <button onClick={resetToIdle} className="btn btn-ghost">
            <RotateCcw size={15} /> Reset
          </button>
          <button
            onClick={() => setAutoScan(s => !s)}
            className={`btn ${autoScan ? 'btn-success' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem' }}
          >
            Auto: {autoScan ? 'ON' : 'OFF'}
          </button>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
          {memberCount} faces enrolled • <a href="/login" style={{ color: 'var(--text-dim)' }}>Admin Login</a>
        </div>
      </div>
    </div>
  );
}
