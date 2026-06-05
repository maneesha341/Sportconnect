import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen]           = useState(false);
  const [unreadMsg, setUnreadMsg]     = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const dropRef  = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    const fetchCounts = async () => {
      try {
        const [msgRes, notifRes] = await Promise.all([
          api.get('/messages/conversations'),
          api.get('/notifications/unread-count'),
        ]);
        setUnreadMsg(msgRes.data.reduce((s, c) => s + c.unread, 0));
        setUnreadNotif(notifRes.data.count);
      } catch (e) {}
    };
    fetchCounts();
    const iv = setInterval(fetchCounts, 10000);
    return () => clearInterval(iv);
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); setOpen(false); };
  const initials = user?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';
  const totalUnread = unreadMsg + unreadNotif;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <span className="dot" /> SportConnect
      </Link>

      <ul className="navbar-links">
        <li><NavLink to="/" end className={({isActive})=>isActive?'active':''}>Home</NavLink></li>

        {/* Admin only */}
        {user?.role === 'admin' && (
          <li><NavLink to="/admin" className={({isActive})=>isActive?'active':''}>⚙️ Admin Panel</NavLink></li>
        )}

        {/* College only */}
        {(!user || user.role === 'college') && (
          <li><NavLink to="/find-trainers" className={({isActive})=>isActive?'active':''}>Find Trainers</NavLink></li>
        )}

        {user?.role === 'college' && (
          <li>
            <NavLink to="/ai-recommend" className={({isActive})=>isActive?'active ai-nav':'ai-nav'}>
              🤖 AI Pick
            </NavLink>
          </li>
        )}

        {user && user.role !== 'admin' && (
          <li><NavLink to="/dashboard" className={({isActive})=>isActive?'active':''}>Dashboard</NavLink></li>
        )}

        {user && user.role !== 'admin' && (
          <li><NavLink to="/booking-history" className={({isActive})=>isActive?'active':''}>History</NavLink></li>
        )}

        {user && user.role !== 'admin' && (
          <li>
            <NavLink to="/messages" className={({isActive})=>isActive?'active':''}>
              Messages {unreadMsg > 0 && <span className="nav-badge">{unreadMsg}</span>}
            </NavLink>
          </li>
        )}

        {user?.role === 'trainer' && (
          <>
            <li><NavLink to="/trainer-profile" className={({isActive})=>isActive?'active':''}>My Profile</NavLink></li>
            <li><NavLink to="/slots" className={({isActive})=>isActive?'active':''}>Slots</NavLink></li>
          </>
        )}
      </ul>

      <div className="navbar-right">
        {user ? (
          <>
            {user.role !== 'admin' && (
              <Link to="/notifications" className="notif-bell">
                🔔
                {unreadNotif > 0 && <span className="bell-badge">{unreadNotif}</span>}
              </Link>
            )}

            <div className="dropdown-wrap" ref={dropRef}>
              <button className="avatar-btn" onClick={() => setOpen(o => !o)}>
                {initials}
                {totalUnread > 0 && <span className="avatar-unread">{totalUnread}</span>}
              </button>
              {open && (
                <div className="dropdown">
                  <div className="dropdown-header">
                    <div className="dname">{user.name}</div>
                    <div className="drole">
                      {user.role === 'admin' ? '⚙️ Admin'
                        : user.role === 'trainer' ? '🏅 Trainer' : '🏫 College'}
                    </div>
                  </div>

                  {user.role === 'admin' ? (
                    <Link to="/admin" onClick={() => setOpen(false)}>⚙️ Admin Panel</Link>
                  ) : (
                    <>
                      <Link to="/dashboard"       onClick={() => setOpen(false)}>📊 Dashboard</Link>
                      <Link to="/booking-history" onClick={() => setOpen(false)}>📋 Booking History</Link>
                      <Link to="/notifications"   onClick={() => setOpen(false)}>
                        🔔 Notifications {unreadNotif > 0 && <span className="drop-badge">{unreadNotif}</span>}
                      </Link>
                      <Link to="/messages"        onClick={() => setOpen(false)}>
                        💬 Messages {unreadMsg > 0 && <span className="drop-badge">{unreadMsg}</span>}
                      </Link>
                      {user.role === 'college' && (
                        <>
                          <Link to="/find-trainers" onClick={() => setOpen(false)}>🔍 Find Trainers</Link>
                          <Link to="/ai-recommend"  onClick={() => setOpen(false)}>🤖 AI Recommendations</Link>
                        </>
                      )}
                      {user.role === 'trainer' && (
                        <>
                          <Link to="/trainer-profile" onClick={() => setOpen(false)}>⚙️ My Trainer Profile</Link>
                          <Link to="/slots"           onClick={() => setOpen(false)}>🗓️ Manage Slots</Link>
                        </>
                      )}
                    </>
                  )}

                  <button className="logout-btn" onClick={handleLogout}>🚪 Log out</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login"><button className="btn-outline">Login</button></Link>
            <Link to="/register"><button className="btn-primary">Sign Up</button></Link>
          </>
        )}
      </div>
    </nav>
  );
}