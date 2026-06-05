import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './AdminDashboard.css';

const COLORS = ['#c8f230','#00d4e8','#ff6b6b','#a78bfa','#fbbf24','#34d399'];
function avatarColor(name) {
  let h = 0; for (let c of (name||'')) h = c.charCodeAt(0) + h*31;
  return COLORS[Math.abs(h) % COLORS.length];
}
function initials(name) {
  return (name||'').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
}
function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return new Date(date).toLocaleDateString([], {month:'short',day:'numeric'});
}

function statusBadge(status) {
  const map = { confirmed:'badge-cyan', completed:'badge-success', cancelled:'badge-danger', pending:'badge-warning' };
  return <span className={`badge ${map[status]||'badge-accent'}`}>{status}</span>;
}

// ── Overview Tab ──
function OverviewTab({ stats }) {
  if (!stats) return <p style={{color:'var(--text-secondary)'}}>Loading stats...</p>;
  return (
    <div>
      <div className="admin-stats">
        <div className="astat users">
          <div className="astat-num">{stats.totalUsers}</div>
          <div className="astat-label">Total Users</div>
          <div className="astat-sub">+{stats.newUsers} this week</div>
        </div>
        <div className="astat trainers">
          <div className="astat-num">{stats.totalTrainers}</div>
          <div className="astat-label">Trainers</div>
          <div className="astat-sub">{stats.totalColleges} colleges</div>
        </div>
        <div className="astat bookings">
          <div className="astat-num">{stats.totalBookings}</div>
          <div className="astat-label">Total Bookings</div>
          <div className="astat-sub">{stats.completedBookings} completed</div>
        </div>
        <div className="astat messages">
          <div className="astat-num">{stats.totalMessages}</div>
          <div className="astat-label">Messages Sent</div>
          <div className="astat-sub">{stats.pendingBookings} pending bookings</div>
        </div>
      </div>

      <div className="recent-grid">
        {/* Recent Bookings */}
        <div className="recent-card">
          <div className="recent-card-title">Recent Bookings</div>
          {stats.recentBookings?.map(b => (
            <div className="recent-item" key={b._id}>
              <div className="ri-icon">📅</div>
              <div className="ri-info">
                <div className="ri-title">{b.sport} — {b.trainerId?.name || 'Trainer'}</div>
                <div className="ri-sub">{b.collegeId?.name || 'College'} · {timeAgo(b.createdAt)}</div>
              </div>
              {statusBadge(b.status)}
            </div>
          ))}
        </div>

        {/* Top Trainers */}
        <div className="recent-card">
          <div className="recent-card-title">Top Rated Trainers</div>
          {stats.topTrainers?.length === 0 && (
            <p style={{color:'var(--text-secondary)',fontSize:14}}>No rated trainers yet.</p>
          )}
          {stats.topTrainers?.map((t, i) => (
            <div className="top-trainer-item" key={t._id}>
              <div className="tt-rank">#{i+1}</div>
              {t.photo
                ? <img src={t.photo} alt={t.name} className="tt-av" />
                : <div className="tt-av-letter" style={{background:avatarColor(t.name)}}>{initials(t.name)}</div>
              }
              <div className="tt-info">
                <div className="tt-name">{t.name}</div>
                <div className="tt-sport">{t.sports?.[0]} · {t.totalSessions} sessions</div>
              </div>
              <div className="tt-rating">★ {t.rating}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking breakdown */}
      <div className="recent-card">
        <div className="recent-card-title">Booking Breakdown</div>
        <div style={{display:'flex',gap:24,flexWrap:'wrap',padding:'8px 0'}}>
          {[
            {label:'Pending',   val:stats.pendingBookings,   color:'var(--warning)'},
            {label:'Completed', val:stats.completedBookings, color:'var(--success)'},
            {label:'Cancelled', val:stats.cancelledBookings, color:'var(--danger)'},
          ].map(item => (
            <div key={item.label} style={{textAlign:'center',padding:'0 16px'}}>
              <div style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:40,fontWeight:900,color:item.color}}>{item.val}</div>
              <div style={{fontSize:12,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ──
function UsersTab() {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole]     = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(t);
  }, [search, role]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users', { params: { search, role } });
      setUsers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleSuspend = async (id) => {
    const res = await api.put(`/admin/users/${id}/suspend`);
    setUsers(prev => prev.map(u => u._id === id ? { ...u, suspended: res.data.suspended } : u));
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(prev => prev.filter(u => u._id !== id));
  };

  return (
    <div>
      <div className="admin-toolbar">
        <div className="admin-search">
          <span className="si">🔍</span>
          <input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="admin-filter" value={role} onChange={e => setRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="college">Colleges</option>
          <option value="trainer">Trainers</option>
        </select>
        <div style={{fontSize:13,color:'var(--text-secondary)'}}>
          {users.length} user{users.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text-secondary)',padding:40}}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text-secondary)',padding:40}}>No users found</td></tr>
            ) : users.map(u => (
              <tr key={u._id} className={u.suspended ? 'suspended-row' : ''}>
                <td>
                  <div className="user-cell">
                    <div className="user-av" style={{background:avatarColor(u.name)}}>{initials(u.name)}</div>
                    <div>
                      <div className="user-name">{u.name}</div>
                      <div className="user-email">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${u.role==='trainer'?'badge-cyan':u.role==='admin'?'badge-accent':'badge-success'}`}>
                    {u.role}
                  </span>
                </td>
                <td style={{color:'var(--text-secondary)',fontSize:13}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  {u.suspended
                    ? <span className="badge badge-danger">Suspended</span>
                    : <span className="badge badge-success">Active</span>
                  }
                </td>
                <td>
                  {u.role !== 'admin' && (
                    <>
                      <button
                        className={`tbl-btn ${u.suspended ? 'restore' : 'suspend'}`}
                        onClick={() => toggleSuspend(u._id)}
                      >
                        {u.suspended ? '✓ Restore' : '⛔ Suspend'}
                      </button>
                      <button className="tbl-btn delete" onClick={() => deleteUser(u._id)}>
                        🗑 Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Trainers Tab ──
function TrainersTab() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    api.get('/admin/trainers').then(res => { setTrainers(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggleVerify = async (id) => {
    const res = await api.put(`/admin/trainers/${id}/verify`);
    setTrainers(prev => prev.map(t => t._id === id ? { ...t, verified: res.data.verified } : t));
  };

  const filtered = trainers.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.sports?.join(' ').toLowerCase().includes(search.toLowerCase()) ||
    t.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="admin-toolbar">
        <div className="admin-search">
          <span className="si">🔍</span>
          <input placeholder="Search trainers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{fontSize:13,color:'var(--text-secondary)'}}>{filtered.length} trainer{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Trainer</th>
              <th>Sport</th>
              <th>Location</th>
              <th>Rate</th>
              <th>Rating</th>
              <th>Sessions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{textAlign:'center',color:'var(--text-secondary)',padding:40}}>Loading...</td></tr>
            ) : filtered.map(t => (
              <tr key={t._id}>
                <td>
                  <div className="user-cell">
                    {t.photo
                      ? <img src={t.photo} alt={t.name} style={{width:36,height:36,borderRadius:'50%',objectFit:'cover'}} />
                      : <div className="user-av" style={{background:avatarColor(t.name)}}>{initials(t.name)}</div>
                    }
                    <div className="user-name">{t.name}</div>
                  </div>
                </td>
                <td style={{color:'var(--text-secondary)'}}>{t.sports?.[0] || '—'}</td>
                <td style={{color:'var(--text-secondary)'}}>{t.location || '—'}</td>
                <td style={{color:'var(--accent)',fontWeight:700}}>RS.{t.hourlyRate}/hr</td>
                <td>
                  <span style={{color:'var(--warning)'}}>★</span> {t.rating?.toFixed(1) || '0.0'}
                </td>
                <td style={{color:'var(--text-secondary)'}}>{t.totalSessions}</td>
                <td>
                  {t.verified
                    ? <span className="verified-badge">✅ Verified</span>
                    : <span style={{fontSize:12,color:'var(--text-secondary)'}}>Unverified</span>
                  }
                </td>
                <td>
                  <button
                    className={`tbl-btn ${t.verified ? 'unverify' : 'verify'}`}
                    onClick={() => toggleVerify(t._id)}
                  >
                    {t.verified ? '✕ Unverify' : '✅ Verify'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Bookings Tab ──
function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [status, setStatus]     = useState('all');

  useEffect(() => {
    setLoading(true);
    api.get('/admin/bookings', { params: { status } })
      .then(res => { setBookings(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <div className="admin-toolbar">
        <select className="admin-filter" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div style={{fontSize:13,color:'var(--text-secondary)'}}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>College</th>
              <th>Trainer</th>
              <th>Sport</th>
              <th>Status</th>
              <th>Date</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text-secondary)',padding:40}}>Loading...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text-secondary)',padding:40}}>No bookings found</td></tr>
            ) : bookings.map(b => (
              <tr key={b._id}>
                <td>
                  <div className="user-name">{b.collegeId?.name || '—'}</div>
                  <div className="user-email">{b.collegeId?.email || ''}</div>
                </td>
                <td style={{fontWeight:600}}>{b.trainerId?.name || '—'}</td>
                <td>
                  <span className="badge badge-accent">{b.sport}</span>
                </td>
                <td>{statusBadge(b.status)}</td>
                <td style={{color:'var(--text-secondary)',fontSize:13}}>{new Date(b.createdAt).toLocaleDateString()}</td>
                <td>
                  {b.review?.rating
                    ? <span style={{color:'var(--warning)'}}>{'★'.repeat(b.review.rating)}</span>
                    : <span style={{color:'var(--text-secondary)',fontSize:12}}>—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ──
export default function AdminDashboard() {
  const [tab, setTab]     = useState('overview');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (tab === 'overview') {
      api.get('/admin/stats').then(res => setStats(res.data)).catch(console.error);
    }
  }, [tab]);

  const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users',    label: '👥 Users' },
    { id: 'trainers', label: '🏅 Trainers' },
    { id: 'bookings', label: '📅 Bookings' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Manage all users, trainers, bookings and platform activity</p>
      </div>

      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab stats={stats} />}
      {tab === 'users'    && <UsersTab />}
      {tab === 'trainers' && <TrainersTab />}
      {tab === 'bookings' && <BookingsTab />}
    </div>
  );
}