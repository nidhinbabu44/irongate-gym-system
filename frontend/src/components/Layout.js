import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, Users, CreditCard, DoorOpen, 
  ClipboardList, Settings, LogOut, Menu, X, Dumbbell, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/members', icon: Users, label: 'Members' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/entries', icon: ClipboardList, label: 'Entry Logs' },
  { to: '/plans', icon: Settings, label: 'Membership Plans' },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240,
        background: 'var(--bg-dark)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(59,130,246,0.4)',
          }}>
            <Dumbbell size={20} color="white" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', letterSpacing: 1, color: 'var(--text-primary)', lineHeight: 1 }}>IRONGATE</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: 2, marginTop: 2 }}>GYM SYSTEM</div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius)',
              color: isActive ? 'var(--accent-bright)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              border: isActive ? '1px solid var(--accent)22' : '1px solid transparent',
              fontSize: '0.88rem',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            })}>
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '0.5rem 0' }} />

          <button
            onClick={() => navigate('/kiosk')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.6rem 0.75rem', borderRadius: 'var(--radius)',
              background: 'var(--green-glow)', border: '1px solid var(--green)44',
              color: 'var(--green)', fontSize: '0.88rem', fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden',
            }}
          >
            <DoorOpen size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Entry Kiosk</span>}
          </button>
        </nav>

        {/* Bottom: user + collapse */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
          {!collapsed && (
            <div style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', background: 'var(--bg-card2)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{admin?.fullName || admin?.username}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2 }}>{admin?.role}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={logout} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.5rem', borderRadius: 'var(--radius)', background: 'transparent',
              border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem',
            }}>
              <LogOut size={14} />
              {!collapsed && 'Logout'}
            </button>
            <button onClick={() => setCollapsed(c => !c)} style={{
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius)', background: 'transparent',
              border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer',
            }}>
              {collapsed ? <ChevronRight size={14} /> : <Menu size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: collapsed ? 64 : 240, transition: 'margin-left 0.25s ease', minHeight: '100vh' }}>
        <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
