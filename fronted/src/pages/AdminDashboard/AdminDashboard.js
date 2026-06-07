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
function approvalBadge(status) {
  const map = { approved:'badge-success', rejected:'badge-danger', pending:'badge-warning' };
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
          <div className="astat-num" style={{color: stats.pendingApprovals > 0 ? 'var(--danger)' : 'inherit'}}>
            {stats.pendingApprovals}
          </div>
          <div className="astat-label">Pending Approvals</div>
          <div className="astat-sub" style={{color: stats.pendingApprovals > 0 ? 'var(--warning)' : 'var(--success)'}}>
            {stats.pendingApprovals > 0 ? '⚠️ Action required!' : '✓ All clear'}
          </div>
        </div>
      </div>

      <div className="recent-grid">
        <div className="recent-card">
          <div className="recent-card-title">Recent Bookings</div>
          {stats.recentBookings?.length === 0 && <p style={{color:'var(--text-secondary)',fontSize:14}}>No bookings yet.</p>}
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
        <div className="recent-card">
          <div className="recent-card-title">Top Rated Trainers</div>
          {stats.topTrainers?.length === 0 && <p style={{color:'var(--text-secondary)',fontSize:14}}>No rated trainers yet.</p>}
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
    </div>
  );
}

// ── Approvals Tab ──
function ApprovalsTab() {
  const [trainers, setTrainers]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('pending');
  const [rejectModal, setRejectModal]   = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewDocs, setViewDocs]         = useState(null);

  useEffect(() => { fetchTrainers(); }, [filter]);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/trainers', { params: { status: filter } });
      setTrainers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const approve = async (id) => {
    await api.put(`/admin/trainers/${id}/approve`);
    setTrainers(prev => prev.map(t => t._id === id ? { ...t, approvalStatus: 'approved', verified: true } : t));
    setViewDocs(null);
  };

  const reject = async () => {
    await api.put(`/admin/trainers/${rejectModal._id}/reject`, { reason: rejectReason });
    setTrainers(prev => prev.map(t => t._id === rejectModal._id ? { ...t, approvalStatus: 'rejected' } : t));
    setRejectModal(null);
    setRejectReason('');
    setViewDocs(null);
  };

  const toggleVerify = async (id) => {
    const res = await api.put(`/admin/trainers/${id}/verify`);
    setTrainers(prev => prev.map(t => t._id === id ? { ...t, verified: res.data.verified } : t));
  };

  return (
    <div>
      {/* View Documents Modal */}
      {viewDocs && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:24,overflowY:'auto'}}>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-light)',borderRadius:20,padding:36,width:'100%',maxWidth:700,maxHeight:'90vh',overflowY:'auto'}}>

            {/* Trainer header */}
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:24}}>
              {viewDocs.photo
                ? <img src={viewDocs.photo} alt={viewDocs.name} style={{width:56,height:56,borderRadius:'50%',objectFit:'cover'}} />
                : <div style={{width:56,height:56,borderRadius:'50%',background:avatarColor(viewDocs.name),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:20,color:'#000'}}>{initials(viewDocs.name)}</div>
              }
              <div style={{flex:1}}>
                <div style={{fontSize:20,fontWeight:800}}>{viewDocs.name}</div>
                <div style={{fontSize:13,color:'var(--text-secondary)'}}>
                  {viewDocs.sports?.[0]} · {viewDocs.experience} yrs · RS.{viewDocs.hourlyRate}/hr · {viewDocs.location}
                </div>
              </div>
              {approvalBadge(viewDocs.approvalStatus)}
            </div>

            {/* Profile details */}
            <div style={{background:'var(--bg-secondary)',borderRadius:12,padding:16,marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-secondary)',marginBottom:10}}>Profile Details</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:14}}>
                <div><span style={{color:'var(--text-secondary)'}}>Sport: </span><strong>{viewDocs.sports?.join(', ')||'—'}</strong></div>
                <div><span style={{color:'var(--text-secondary)'}}>Experience: </span><strong>{viewDocs.experience} years</strong></div>
                <div><span style={{color:'var(--text-secondary)'}}>Location: </span><strong>{viewDocs.location||'—'}</strong></div>
                <div><span style={{color:'var(--text-secondary)'}}>State: </span><strong>{viewDocs.trainerState||'—'}</strong></div>
                <div><span style={{color:'var(--text-secondary)'}}>Rate: </span><strong style={{color:'var(--accent)'}}>RS.{viewDocs.hourlyRate}/hr</strong></div>
                <div><span style={{color:'var(--text-secondary)'}}>Registered: </span><strong>{new Date(viewDocs.createdAt).toLocaleDateString()}</strong></div>
              </div>
              {viewDocs.certifications?.length > 0 && (
                <div style={{marginTop:10,fontSize:14}}>
                  <span style={{color:'var(--text-secondary)'}}>Certifications: </span>
                  <strong>{viewDocs.certifications.join(', ')}</strong>
                </div>
              )}
              {viewDocs.bio && (
                <div style={{marginTop:10,fontSize:14,color:'var(--text-secondary)',fontStyle:'italic'}}>
                  "{viewDocs.bio}"
                </div>
              )}
            </div>

            {/* Documents */}
            <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-secondary)',marginBottom:14}}>
              Uploaded Documents
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--accent-cyan)',marginBottom:8}}>
                  📜 {viewDocs.proofType || 'Certificate / Proof'}
                </div>
                {viewDocs.proofDocument ? (
                  <img src={viewDocs.proofDocument} alt="Certificate"
                    style={{width:'100%',borderRadius:10,border:'1px solid var(--border-light)',objectFit:'contain',maxHeight:220}} />
                ) : (
                  <div style={{background:'var(--bg-secondary)',borderRadius:10,padding:40,textAlign:'center',color:'var(--danger)',fontSize:14,border:'1px dashed rgba(255,71,87,0.3)'}}>
                    ⚠️ No certificate uploaded
                  </div>
                )}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--accent-cyan)',marginBottom:8}}>
                  🪪 Government ID
                </div>
                {viewDocs.governmentId ? (
                  <img src={viewDocs.governmentId} alt="Govt ID"
                    style={{width:'100%',borderRadius:10,border:'1px solid var(--border-light)',objectFit:'contain',maxHeight:220}} />
                ) : (
                  <div style={{background:'var(--bg-secondary)',borderRadius:10,padding:40,textAlign:'center',color:'var(--danger)',fontSize:14,border:'1px dashed rgba(255,71,87,0.3)'}}>
                    ⚠️ No ID uploaded
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',borderTop:'1px solid var(--border)',paddingTop:20}}>
              <button className="btn-outline" onClick={() => setViewDocs(null)}>Close</button>
              {viewDocs.approvalStatus !== 'approved' && (
                <button className="tbl-btn verify" style={{padding:'10px 20px',fontSize:14}}
                  onClick={() => approve(viewDocs._id)}>
                  ✅ Approve Trainer
                </button>
              )}
              {viewDocs.approvalStatus !== 'rejected' && (
                <button style={{background:'var(--danger)',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',fontSize:14,fontWeight:700,cursor:'pointer'}}
                  onClick={() => { setRejectModal(viewDocs); setRejectReason(''); }}>
                  ❌ Reject Trainer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1001,padding:24}}>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-light)',borderRadius:20,padding:36,width:'100%',maxWidth:480}}>
            <h3 style={{fontFamily:'Barlow Condensed',fontSize:28,fontWeight:900,textTransform:'uppercase',marginBottom:8,color:'var(--danger)'}}>
              Reject Trainer
            </h3>
            <p style={{color:'var(--text-secondary)',fontSize:14,marginBottom:16}}>
              Rejecting: <strong>{rejectModal.name}</strong><br/>They will be notified with your reason.
            </p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
              {['Incomplete profile','Invalid certifications','Insufficient experience','Fake credentials','No documents uploaded','Duplicate account','Documents not clear'].map(r => (
                <button key={r} onClick={() => setRejectReason(r)} style={{
                  background: rejectReason===r?'rgba(255,71,87,0.2)':'var(--bg-secondary)',
                  border:`1px solid ${rejectReason===r?'rgba(255,71,87,0.5)':'var(--border-light)'}`,
                  borderRadius:20,padding:'6px 14px',fontSize:12,
                  color:rejectReason===r?'var(--danger)':'var(--text-secondary)',cursor:'pointer'
                }}>{r}</button>
              ))}
            </div>
            <textarea style={{width:'100%',background:'var(--bg-secondary)',border:'1px solid var(--border-light)',borderRadius:10,padding:'12px 14px',color:'var(--text-primary)',fontSize:14,outline:'none',resize:'none',marginBottom:16,fontFamily:'DM Sans,sans-serif'}}
              rows={3} placeholder="Or write custom reason..."
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn-outline" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
              <button style={{background:'var(--danger)',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',fontWeight:700,cursor:'pointer'}}
                onClick={reject} disabled={!rejectReason.trim()}>
                ❌ Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="admin-toolbar">
        {['pending','approved','rejected','all'].map(f => (
          <button key={f} className={`filter-tab ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
        <div style={{fontSize:13,color:'var(--text-secondary)'}}>{trainers.length} trainer{trainers.length!==1?'s':''}</div>
      </div>

      {filter === 'pending' && trainers.length > 0 && (
        <div style={{background:'rgba(255,167,38,0.08)',border:'1px solid rgba(255,167,38,0.25)',borderRadius:12,padding:'12px 16px',marginBottom:20,fontSize:14,color:'var(--warning)'}}>
          ⚠️ {trainers.length} trainer{trainers.length!==1?'s':''} waiting for approval. Click <strong>View Docs</strong> to review their documents before approving.
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Trainer</th>
              <th>Sport</th>
              <th>Experience</th>
              <th>Rate</th>
              <th>Documents</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{textAlign:'center',color:'var(--text-secondary)',padding:40}}>Loading...</td></tr>
            ) : trainers.length === 0 ? (
              <tr><td colSpan={7} style={{textAlign:'center',color:'var(--text-secondary)',padding:40}}>No trainers found</td></tr>
            ) : trainers.map(t => (
              <tr key={t._id}>
                <td>
                  <div className="user-cell">
                    {t.photo
                      ? <img src={t.photo} alt={t.name} style={{width:38,height:38,borderRadius:'50%',objectFit:'cover'}} />
                      : <div className="user-av" style={{background:avatarColor(t.name)}}>{initials(t.name)}</div>
                    }
                    <div>
                      <div className="user-name">{t.name}</div>
                      <div className="user-email">{t.location||'No location'}</div>
                    </div>
                  </div>
                </td>
                <td style={{color:'var(--text-secondary)'}}>{t.sports?.[0]||'—'}</td>
                <td style={{color:'var(--text-secondary)'}}>{t.experience} yrs</td>
                <td style={{color:'var(--accent)',fontWeight:700}}>{t.hourlyRate>0?`RS.${t.hourlyRate}/hr`:'—'}</td>
                <td>
                  <div style={{fontSize:12,display:'flex',flexDirection:'column',gap:3}}>
                    <span style={{color:t.proofDocument?'var(--success)':'var(--danger)'}}>
                      {t.proofDocument?'✅ Certificate':'❌ No certificate'}
                    </span>
                    <span style={{color:t.governmentId?'var(--success)':'var(--danger)'}}>
                      {t.governmentId?'✅ Govt ID':'❌ No ID'}
                    </span>
                  </div>
                </td>
                <td>
                  {approvalBadge(t.approvalStatus)}
                  {t.verified && <span className="verified-badge" style={{marginLeft:6}}>✅</span>}
                </td>
                <td>
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    <button className="tbl-btn verify" onClick={() => setViewDocs(t)}>👁 View Docs</button>
                    {t.approvalStatus==='pending' && (
                      <div style={{display:'flex',gap:4}}>
                        <button className="tbl-btn verify" onClick={() => approve(t._id)}>✅</button>
                        <button className="tbl-btn suspend" onClick={() => { setRejectModal(t); setRejectReason(''); }}>❌</button>
                      </div>
                    )}
                    {t.approvalStatus==='approved' && (
                      <div style={{display:'flex',gap:4}}>
                        <button className={`tbl-btn ${t.verified?'unverify':'verify'}`} onClick={() => toggleVerify(t._id)}>
                          {t.verified?'Unverify':'✅ Verify'}
                        </button>
                        <button className="tbl-btn suspend" onClick={() => { setRejectModal(t); setRejectReason(''); }}>❌</button>
                      </div>
                    )}
                    {t.approvalStatus==='rejected' && (
                      <button className="tbl-btn restore" onClick={() => approve(t._id)}>Re-approve</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Users Tab ──
function UsersTab() {
  const [users, setUsers]     = useState([]);
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api.get('/admin/users', { params: { search, role } })
        .then(res => { setUsers(res.data); setLoading(false); })
        .catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, role]);

  const toggleSuspend = async (id) => {
    const res = await api.put(`/admin/users/${id}/suspend`);
    setUsers(prev => prev.map(u => u._id===id ? { ...u, suspended: res.data.suspended } : u));
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
        <div style={{fontSize:13,color:'var(--text-secondary)'}}>{users.length} users</div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text-secondary)',padding:40}}>Loading...</td></tr>
            ) : users.map(u => (
              <tr key={u._id} className={u.suspended?'suspended-row':''}>
                <td>
                  <div className="user-cell">
                    <div className="user-av" style={{background:avatarColor(u.name)}}>{initials(u.name)}</div>
                    <div><div className="user-name">{u.name}</div><div className="user-email">{u.email}</div></div>
                  </div>
                </td>
                <td><span className={`badge ${u.role==='trainer'?'badge-cyan':u.role==='admin'?'badge-accent':'badge-success'}`}>{u.role}</span></td>
                <td style={{color:'var(--text-secondary)',fontSize:13}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>{u.suspended?<span className="badge badge-danger">Suspended</span>:<span className="badge badge-success">Active</span>}</td>
                <td>
                  {u.role!=='admin' && (
                    <>
                      <button className={`tbl-btn ${u.suspended?'restore':'suspend'}`} onClick={() => toggleSuspend(u._id)}>
                        {u.suspended?'✓ Restore':'⛔ Suspend'}
                      </button>
                      <button className="tbl-btn delete" style={{marginLeft:6}} onClick={() => deleteUser(u._id)}>🗑 Delete</button>
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
        <div style={{fontSize:13,color:'var(--text-secondary)'}}>{bookings.length} bookings</div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>College</th><th>Trainer</th><th>Sport</th><th>Status</th><th>Date</th><th>Review</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text-secondary)',padding:40}}>Loading...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text-secondary)',padding:40}}>No bookings found</td></tr>
            ) : bookings.map(b => (
              <tr key={b._id}>
                <td>
                  <div className="user-name">{b.collegeId?.name||'—'}</div>
                  <div className="user-email">{b.collegeId?.email||''}</div>
                </td>
                <td style={{fontWeight:600}}>{b.trainerId?.name||'—'}</td>
                <td><span className="badge badge-accent">{b.sport}</span></td>
                <td>{statusBadge(b.status)}</td>
                <td style={{color:'var(--text-secondary)',fontSize:13}}>{new Date(b.createdAt).toLocaleDateString()}</td>
                <td>{b.review?.rating?<span style={{color:'var(--warning)'}}>{'★'.repeat(b.review.rating)}</span>:<span style={{color:'var(--text-secondary)',fontSize:12}}>—</span>}</td>
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
    { id: 'overview',  label: '📊 Overview' },
    { id: 'approvals', label: '✅ Trainer Approvals' },
    { id: 'users',     label: '👥 Users' },
    { id: 'bookings',  label: '📅 Bookings' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Manage users, verify trainers, monitor bookings and platform activity</p>
      </div>

      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`admin-tab ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id==='approvals' && stats?.pendingApprovals > 0 && (
              <span style={{background:'var(--danger)',color:'#fff',borderRadius:10,padding:'1px 7px',fontSize:11,fontWeight:800,marginLeft:6}}>
                {stats.pendingApprovals}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview'  && <OverviewTab stats={stats} />}
      {tab === 'approvals' && <ApprovalsTab />}
      {tab === 'users'     && <UsersTab />}
      {tab === 'bookings'  && <BookingsTab />}
    </div>
  );
}