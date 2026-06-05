import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import '../CollegeDashboard/CollegeDashboard.css';

export default function TrainerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [reportModal, setReportModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [reportText, setReportText]   = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling]   = useState(false);

  useEffect(() => {
    api.get('/bookings/mine')
      .then(res => { setBookings(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    const res = await api.put(`/bookings/${id}/status`, { status });
    setBookings(prev => prev.map(b => b._id === id ? { ...b, status: res.data.status } : b));
  };

  const submitReport = async () => {
    if (!reportText.trim()) return alert('Please write a report first');
    await api.put(`/bookings/${reportModal._id}/report`, { report: reportText });
    setBookings(prev => prev.map(b => b._id === reportModal._id ? { ...b, performanceReport: reportText } : b));
    setReportModal(null);
    setReportText('');
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) { alert('Please provide a cancellation reason'); return; }
    setCancelling(true);
    try {
      const res = await api.put(`/bookings/${cancelModal._id}/cancel`, { reason: cancelReason });
      setBookings(prev => prev.map(b => b._id === cancelModal._id ? {
        ...b, status: 'cancelled',
        cancellationReason: res.data.cancellationReason,
        cancelledBy: res.data.cancelledBy,
      } : b));
      setCancelModal(null);
      setCancelReason('');
    } catch (e) {
      alert(e.response?.data?.message || 'Cancellation failed');
    } finally { setCancelling(false); }
  };

  const total     = bookings.length;
  const pending   = bookings.filter(b => b.status === 'pending').length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const completed = bookings.filter(b => b.status === 'completed').length;

  return (
    <div className="dashboard">

      {/* Performance Report Modal */}
      {reportModal && (
        <div className="modal-overlay" onClick={() => setReportModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Performance Report</h3>
            <p style={{color:'var(--text-secondary)',fontSize:14,marginBottom:16}}>
              For: <strong>{reportModal.collegeId?.name}</strong> — {reportModal.sport}
            </p>
            {reportModal.performanceReport ? (
              <>
                <div className="report-content">{reportModal.performanceReport}</div>
                <p style={{color:'var(--success)',fontSize:13}}>✓ Report already submitted</p>
                <div className="modal-actions" style={{marginTop:16}}>
                  <button className="btn-primary" onClick={() => setReportModal(null)}>Close</button>
                </div>
              </>
            ) : (
              <>
                <textarea className="review-textarea" rows={6}
                  placeholder="Describe performance, strengths, areas to improve, progress made..."
                  value={reportText}
                  onChange={e => setReportText(e.target.value)} />
                <div className="modal-actions">
                  <button className="btn-outline" onClick={() => setReportModal(null)}>Cancel</button>
                  <button className="btn-primary" onClick={submitReport}>Submit Report</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModal && (
        <div className="modal-overlay" onClick={() => { setCancelModal(null); setCancelReason(''); }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{color:'var(--danger)'}}>Cancel Booking</h3>
            <p style={{color:'var(--text-secondary)',fontSize:14,margin:'8px 0 20px'}}>
              Cancelling: <strong>{cancelModal.sport}</strong> session with <strong>{cancelModal.collegeId?.name}</strong>
              <br/>The college will be notified and the slot freed.
            </p>

            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-secondary)',marginBottom:8}}>
                Quick Reasons
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {[
                  'Personal emergency',
                  'Health issue',
                  'Travel conflict',
                  'Prior commitment',
                  'Venue unavailable',
                  'College not responding',
                ].map(r => (
                  <button key={r}
                    style={{
                      background: cancelReason === r ? 'rgba(255,71,87,0.2)':'var(--bg-secondary)',
                      border:`1px solid ${cancelReason===r?'rgba(255,71,87,0.5)':'var(--border-light)'}`,
                      borderRadius:20, padding:'6px 14px', fontSize:12,
                      color: cancelReason===r?'var(--danger)':'var(--text-secondary)',
                      cursor:'pointer', transition:'all 0.15s',
                    }}
                    onClick={() => setCancelReason(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <textarea className="review-textarea" rows={3}
              placeholder="Or write your own reason..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)} />

            <div className="modal-actions">
              <button className="btn-outline" onClick={() => { setCancelModal(null); setCancelReason(''); }}>
                Keep Booking
              </button>
              <button
                style={{background:'var(--danger)',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',fontWeight:700,cursor:'pointer',opacity:cancelling?0.6:1}}
                onClick={submitCancel}
                disabled={cancelling || !cancelReason.trim()}
              >
                {cancelling ? 'Cancelling...' : '❌ Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="dash-top">
        <div className="dash-greeting">
          <h1>Hey, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Your trainer booking overview</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-cards">
        <div className="stat-card total">    <div className="stat-number">{total}</div>     <div className="stat-label">Total Bookings</div></div>
        <div className="stat-card pending">  <div className="stat-number">{pending}</div>   <div className="stat-label">Pending</div></div>
        <div className="stat-card confirmed"><div className="stat-number">{confirmed}</div> <div className="stat-label">Confirmed</div></div>
        <div className="stat-card completed"><div className="stat-number">{completed}</div> <div className="stat-label">Completed</div></div>
      </div>

      <div className="bookings-panel">
        <div className="panel-title">Incoming Bookings</div>
        {loading ? <p style={{color:'var(--text-secondary)'}}>Loading...</p>
          : bookings.length === 0
            ? <p style={{color:'var(--text-secondary)',fontSize:14}}>No bookings yet. Complete your profile and add slots!</p>
            : bookings.map(b => (
              <div className="booking-item expanded" key={b._id}>
                <div className="booking-row">
                  <div className="booking-icon">🏫</div>
                  <div className="booking-info">
                    <div className="booking-name">{b.sport} — {b.collegeId?.name || 'College'}</div>
                    <div className="booking-date">{new Date(b.createdAt).toDateString()}</div>
                  </div>
                  <div className="booking-actions">
                    <span className={`badge ${
                      b.status==='pending'?'badge-warning':
                      b.status==='confirmed'?'badge-cyan':
                      b.status==='completed'?'badge-success':'badge-danger'
                    }`}>{b.status}</span>
                  </div>
                </div>

                {/* College message */}
                {b.message && (
                  <div style={{margin:'8px 0 0 54px',fontSize:13,color:'var(--text-secondary)',fontStyle:'italic'}}>
                    💬 "{b.message}"
                  </div>
                )}

                {/* Cancellation info */}
                {b.status === 'cancelled' && b.cancellationReason && (
                  <div className="cancel-info">
                    <span className="cancel-by">
                      Cancelled by {b.cancelledBy === 'trainer' ? 'you' : 'college'}
                    </span>
                    <span className="cancel-reason">"{b.cancellationReason}"</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{display:'flex',gap:10,margin:'12px 0 4px 54px',flexWrap:'wrap'}}>
                  {b.status === 'pending' && (
                    <>
                      <button className="action-btn review" onClick={() => updateStatus(b._id,'confirmed')}>
                        ✓ Confirm Booking
                      </button>
                      <button className="action-btn cancel-btn"
                        onClick={() => { setCancelModal(b); setCancelReason(''); }}>
                        ❌ Cancel
                      </button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <>
                      <button className="action-btn review" onClick={() => updateStatus(b._id,'completed')}>
                        🏁 Mark as Completed
                      </button>
                      <button className="action-btn cancel-btn"
                        onClick={() => { setCancelModal(b); setCancelReason(''); }}>
                        ❌ Cancel
                      </button>
                    </>
                  )}
                  {b.status === 'completed' && (
                    <button className="action-btn report"
                      onClick={() => { setReportModal(b); setReportText(b.performanceReport||''); }}>
                      {b.performanceReport ? '📊 View Report' : '📊 Add Performance Report'}
                    </button>
                  )}
                </div>

                {/* College review */}
                {b.review?.rating > 0 && (
                  <div className="existing-review" style={{margin:'8px 0 0 54px',display:'inline-flex'}}>
                    <span style={{color:'var(--warning)'}}>
                      {'★'.repeat(b.review.rating)}{'☆'.repeat(5-b.review.rating)}
                    </span>
                    <span style={{fontSize:13,color:'var(--text-secondary)',marginLeft:8}}>
                      College review: {b.review.comment || 'No comment'}
                    </span>
                  </div>
                )}
              </div>
            ))
        }
      </div>
    </div>
  );
}