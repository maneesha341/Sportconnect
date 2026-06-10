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
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

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
    const fetch = async () => {
      try {
        const [m, n] = await Promise.all([
          api.get('/messages/conversations'),
          api.get('/notifications/unread-count'),
        ]);
        setUnreadMsg(m.data.reduce((s, c) => s + c.unread, 0));
        setUnreadNotif(n.data.count);
      } catch (e) {}
    };
    fetch();
    const iv = setInterval(fetch, 10000);
    return () => clearInterval(iv);
  }, [user]);

  const handleLogout = () => {
    logout(); navigate('/');
    setMenuOpen(false); setDropOpen(false);
  };

  const initials = user?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';
  const totalUnread = unreadMsg + unreadNotif;

  // Nav items per role
  const navItems = () => {
    const items = [{ to: '/', label: 'Home', exact: true }];
    if (!user || user.role === 'college') {
      items.push({ to: '/find-trainers', label: 'Find Trainers' });
    }
    if (user?.role === 'college') {
      items.push({ to: '/ai-recommend', label: '🤖 AI Pick', special: true });
    }
    if (user?.role === 'admin') {
      items.push({ to: '/admin', label: '⚙️ Admin Panel' });
    }
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
              {/* Notification bell — desktop only */}
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
                        {user.role==='admin' ? '⚙️ Admin' : user.role==='trainer' ? '🏅 Trainer' : '🏫 College'}
                      </div>
                    </div>
                    {user.role === 'admin' ? (
                      <Link to="/admin" onClick={() => setDropOpen(false)}>⚙️ Admin Panel</Link>
                    ) : (
                      <>
                        <Link to="/dashboard"       onClick={() => setDropOpen(false)}>📊 Dashboard</Link>
                        <Link to="/booking-history" onClick={() => setDropOpen(false)}>📋 Booking History</Link>
                        <Link to="/notifications"   onClick={() => setDropOpen(false)}>
                          🔔 Notifications {unreadNotif > 0 && <span className="drop-badge">{unreadNotif}</span>}
                        </Link>
                        <Link to="/messages"        onClick={() => setDropOpen(false)}>
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

              {/* Hamburger — mobile only */}
              <button
                className="hamburger"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Menu"
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
              <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
                <span /><span /><span />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mobile-drawer" onClick={() => setMenuOpen(false)}>
          <div className="mobile-drawer-inner" onClick={e => e.stopPropagation()}>

            {/* User info */}
            {user && (
              <div className="mob-user-card">
                <div className="mob-avatar">{initials}</div>
                <div>
                  <div className="mob-name">{user.name}</div>
                  <div className="mob-role">
                    {user.role==='admin' ? '⚙️ Admin' : user.role==='trainer' ? '🏅 Trainer' : '🏫 College'}
                  </div>
                </div>
                {totalUnread > 0 && (
                  <span style={{marginLeft:'auto',background:'var(--danger)',color:'#fff',borderRadius:20,padding:'2px 8px',fontSize:12,fontWeight:800}}>
                    {totalUnread}
                  </span>
                )}
              </div>
            )}

            {/* Nav links */}
            {navItems().map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `mob-link${isActive ? ' mob-active' : ''}${item.special ? ' mob-ai' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}

            {/* Notifications & Messages for logged in */}
            {user && user.role !== 'admin' && (
              <>
                <div className="mob-divider" />
                <Link to="/notifications" className="mob-link" onClick={() => setMenuOpen(false)}>
                  🔔 Notifications
                  {unreadNotif > 0 && <span className="mob-badge">{unreadNotif}</span>}
                </Link>
              </>
            )}

            {/* Auth buttons for logged out */}
            {!user && (
              <>
                <div className="mob-divider" />
                <Link to="/login"    className="mob-link" onClick={() => setMenuOpen(false)}>🔑 Login</Link>
                <Link to="/register" className="mob-link mob-signup" onClick={() => setMenuOpen(false)}>🚀 Sign Up — Free</Link>
              </>
            )}

            {/* Logout */}
            {user && (
              <>
                <div className="mob-divider" />
                <button className="mob-link mob-logout" onClick={handleLogout}>🚪 Log out</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}