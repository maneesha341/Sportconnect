import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [dropOpen, setDropOpen]       = useState(false);
  const [unreadMsg, setUnreadMsg]     = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const dropRef  = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Poll unread counts
  useEffect(() => {
    if (!user || user.role === 'admin') return;
    const fetchCounts = async () => {
      try {
        const [m, n] = await Promise.all([
          api.get('/messages/conversations'),
          api.get('/notifications/unread-count'),
        ]);
        setUnreadMsg(m.data.reduce((s, c) => s + c.unread, 0));
        setUnreadNotif(n.data.count);
      } catch (e) {}
    };
    fetchCounts();
    const iv = setInterval(fetchCounts, 10000);
    return () => clearInterval(iv);
  }, [user]);

  const handleLogout = () => {
    logout(); navigate('/');
    setMenuOpen(false); setDropOpen(false);
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const totalUnread = unreadMsg + unreadNotif;

  // All nav items for mobile drawer
  const mobileItems = [
    { to: '/',               label: '🏠 Home',           show: true,                             exact: true  },
    { to: '/find-trainers',  label: '🔍 Find Trainers',  show: !user || user.role === 'college'               },
    { to: '/ai-recommend',   label: '🤖 AI Pick',        show: user?.role === 'college',         special: true},
    { to: '/admin',          label: '⚙️ Admin Panel',   show: user?.role === 'admin'                          },
    { to: '/dashboard',      label: '📊 Dashboard',      show: user && user.role !== 'admin'                  },
    { to: '/booking-history',label: '📋 Booking History',show: user && user.role !== 'admin'                  },
    { to: '/messages',       label: `💬 Messages${unreadMsg > 0 ? ` (${unreadMsg})` : ''}`,
                                                          show: user && user.role !== 'admin'                  },
    { to: '/notifications',  label: `🔔 Notifications${unreadNotif > 0 ? ` (${unreadNotif})` : ''}`,
                                                          show: user && user.role !== 'admin'                  },
    { to: '/trainer-profile',label: '⚙️ My Profile',    show: user?.role === 'trainer'                        },
    { to: '/slots',          label: '🗓️ Manage Slots',  show: user?.role === 'trainer'                        },
  ].filter(item => item.show);

  // Desktop nav items
  const navItems = () => {
    const items = [{ to: '/', label: 'Home', exact: true }];
    if (!user || user.role === 'college')
      items.push({ to: '/find-trainers', label: 'Find Trainers' });
    if (user?.role === 'college')
      items.push({ to: '/ai-recommend', label: '🤖 AI Pick', special: true });
    if (user?.role === 'admin')
      items.push({ to: '/admin', label: '⚙️ Admin Panel' });
    if (user && user.role !== 'admin') {
      items.push({ to: '/dashboard',       label: 'Dashboard' });
      items.push({ to: '/booking-history', label: 'History' });
      items.push({ to: '/messages',        label: `Messages${unreadMsg > 0 ? ` (${unreadMsg})` : ''}` });
    }
    if (user?.role === 'trainer') {
      items.push({ to: '/trainer-profile', label: 'My Profile' });
      items.push({ to: '/slots',           label: 'Slots' });
    }
    return items;
  };

  // ── Inline style objects ──────────────────────────────────────────────────

  // KEY FIX: drawer is positioned relative to navbar, NOT fullscreen overlay
  // It drops down from the bottom of the navbar (top: 56px) and only takes
  // as much height as its content needs (max 70vh with scroll)
  const drawerWrapper = {
    position: 'fixed',
    top: '56px',
    right: '12px',        // aligned to right edge with small gap
    width: '260px',       // compact fixed width, not full screen
    zIndex: 999,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
    border: '1px solid var(--border, #2a2a2a)',
  };

  const drawerPanel = {
    background: 'var(--bg-primary, #0f1117)',
    padding: '10px 10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    maxHeight: '70vh',
    overflowY: 'auto',
  };

  const userCard = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px',
    background: 'var(--bg-card, #1a1d26)',
    border: '1px solid var(--border, #2a2a2a)',
    borderRadius: 10, marginBottom: 2,
  };
  const avatarCircle = {
    width: 38, height: 38, borderRadius: '50%',
    background: 'var(--accent-cyan, #00d4ff)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 15, color: '#000', flexShrink: 0,
  };
  const divider = {
    height: 1, background: 'var(--border, #2a2a2a)', margin: '2px 0',
  };
  const linkBase = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '11px 14px', borderRadius: 8,
    fontSize: 14, fontWeight: 500,
    color: 'var(--text-secondary, #aaa)',
    background: 'var(--bg-card, #1a1d26)',
    border: '1px solid var(--border, #2a2a2a)',
    textDecoration: 'none', cursor: 'pointer',
  };
  const linkActive = {
    ...linkBase,
    color: 'var(--accent, #c8f230)',
    background: 'rgba(200,242,48,0.08)',
    border: '1px solid rgba(200,242,48,0.25)',
  };
  const logoutStyle = {
    ...linkBase,
    color: 'var(--danger, #ff4757)',
    background: 'rgba(255,71,87,0.08)',
    border: '1px solid rgba(255,71,87,0.2)',
    width: '100%', textAlign: 'left',
  };
  const signupStyle = {
    ...linkBase,
    color: '#000',
    background: 'var(--accent, #c8f230)',
    border: '1px solid var(--accent, #c8f230)',
    fontWeight: 700,
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <span className="dot" /> SportConnect
        </Link>

        {/* Desktop links */}
        <ul className="navbar-links">
          {navItems().map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  isActive ? `active${item.special ? ' ai-nav' : ''}` : item.special ? 'ai-nav' : ''
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="navbar-right">
          {user ? (
            <>
              {user.role !== 'admin' && (
                <Link to="/notifications" className="notif-bell desktop-only">
                  🔔
                  {unreadNotif > 0 && <span className="bell-badge">{unreadNotif}</span>}
                </Link>
              )}

              {/* Avatar dropdown */}
              <div className="dropdown-wrap" ref={dropRef}>
                <button className="avatar-btn" onClick={() => setDropOpen(o => !o)}>
                  {initials}
                  {totalUnread > 0 && <span className="avatar-unread">{totalUnread}</span>}
                </button>
                {dropOpen && (
                  <div className="dropdown">
                    <div className="dropdown-header">
                      <div className="dname">{user.name}</div>
                      <div className="drole">
                        {user.role === 'admin' ? '⚙️ Admin' : user.role === 'trainer' ? '🏅 Trainer' : '🏫 College'}
                      </div>
                    </div>
                    {user.role === 'admin' ? (
                      <Link to="/admin" onClick={() => setDropOpen(false)}>⚙️ Admin Panel</Link>
                    ) : (
                      <>
                        <Link to="/dashboard"        onClick={() => setDropOpen(false)}>📊 Dashboard</Link>
                        <Link to="/booking-history"  onClick={() => setDropOpen(false)}>📋 Booking History</Link>
                        <Link to="/notifications"    onClick={() => setDropOpen(false)}>
                          🔔 Notifications {unreadNotif > 0 && <span className="drop-badge">{unreadNotif}</span>}
                        </Link>
                        <Link to="/messages"         onClick={() => setDropOpen(false)}>
                          💬 Messages {unreadMsg > 0 && <span className="drop-badge">{unreadMsg}</span>}
                        </Link>
                        {user.role === 'college' && (
                          <>
                            <Link to="/find-trainers" onClick={() => setDropOpen(false)}>🔍 Find Trainers</Link>
                            <Link to="/ai-recommend"  onClick={() => setDropOpen(false)}>🤖 AI Recommendations</Link>
                          </>
                        )}
                        {user.role === 'trainer' && (
                          <>
                            <Link to="/trainer-profile" onClick={() => setDropOpen(false)}>⚙️ My Profile</Link>
                            <Link to="/slots"           onClick={() => setDropOpen(false)}>🗓️ Manage Slots</Link>
                          </>
                        )}
                      </>
                    )}
                    <button className="logout-btn" onClick={handleLogout}>🚪 Log out</button>
                  </div>
                )}
              </div>

              {/* Hamburger */}
              <button
                className="hamburger"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Toggle menu"
              >
                <span className={menuOpen ? 'ham-open' : ''} />
                <span className={menuOpen ? 'ham-open' : ''} />
                <span className={menuOpen ? 'ham-open' : ''} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="desktop-only"><button className="btn-outline">Login</button></Link>
              <Link to="/register" className="desktop-only"><button className="btn-primary">Sign Up</button></Link>
              <button
                className="hamburger"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Toggle menu"
              >
                <span className={menuOpen ? 'ham-open' : ''} />
                <span className={menuOpen ? 'ham-open' : ''} />
                <span className={menuOpen ? 'ham-open' : ''} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Mobile Drawer ── drops down from navbar, NOT fullscreen ── */}
      {menuOpen && (
        <div style={drawerWrapper}>
          <div style={drawerPanel}>

            {/* User info card */}
            {user && (
              <div style={userCard}>
                <div style={avatarCircle}>{initials}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary, #fff)' }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--accent, #c8f230)', marginTop: 2 }}>
                    {user.role === 'admin' ? '⚙️ Admin' : user.role === 'trainer' ? '🏅 Trainer' : '🏫 College'}
                  </div>
                </div>
                {totalUnread > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--danger, #ff4757)', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 800 }}>
                    {totalUnread}
                  </span>
                )}
              </div>
            )}

            {/* Nav links */}
            {mobileItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => isActive ? linkActive : linkBase}
              >
                {item.label}
              </NavLink>
            ))}

            {/* Auth buttons for logged-out users */}
            {!user && (
              <>
                <div style={divider} />
                <Link to="/login" style={linkBase} onClick={() => setMenuOpen(false)}>🔑 Login</Link>
                <Link to="/register" style={signupStyle} onClick={() => setMenuOpen(false)}>🚀 Sign Up — Free</Link>
              </>
            )}

            {/* Logout */}
            {user && (
              <>
                <div style={divider} />
                <button style={logoutStyle} onClick={handleLogout}>🚪 Log out</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}