import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './CollegeDashboard.css';

const BAR_COLORS = ['#c8f230','#00d4e8','#ff6b6b','#a78bfa','#fbbf24'];

function statusBadge(status) {
  const map = { confirmed:'badge-cyan', completed:'badge-success', cancelled:'badge-danger', pending:'badge-warning' };
  return <span className={`badge ${map[status]||'badge-accent'}`}>{status}</span>;
}

function StatusTimeline({ status }) {
  const steps = ['pending','confirmed','completed'];
  const idx = steps.indexOf(status);
  return (
    <div className="status-timeline">
      {steps.map((step, i) => {
        const done = status !== 'cancelled' && i <= idx;
        return (
          <React.Fragment key={step}>
            <div className={`step ${done?'done':''} ${status===step?'current':''}`}>
              <div className="step-dot">{done ? '✓' : i+1}</div>
              <div className="step-label">{step}</div>
            </div>
            {i < steps.length-1 && <div className={`step-line ${done && i < idx ? 'done':''}`} />}
          </React.Fragment>
        );
      })}
      {status === 'cancelled' && <span className="badge badge-danger" style={{marginLeft:8}}>Cancelled</span>}
    </div>
  );
}

export default function CollegeDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [reportModal, setReportModal] = useState(null);
  const [reviewForm, setReviewForm]   = useState({ rating: 5, comment: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling]   = useState(false);

  useEffect(() => {
    api.get('/bookings/mine')
      .then(res => { setBookings(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const submitReview = async () => {
    try {
      const res = await api.put(`/bookings/${reviewModal._id}/review`, reviewForm);
      setBookings(prev => prev.map(b => b._id === reviewModal._id ? { ...b, review: res.data.review } : b));
      setReviewModal(null);
    } catch (e) { alert('Failed to submit review'); }
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) { alert('Please provide a cancellation reason'); return; }
    setCancelling(true);
    try {
      const res = await api.put(`/bookings/${cancelModal._id}/cancel`, { reason: cancelReason });
      setBookings(prev => prev.map(b => b._id === cancelModal._id ? {
        ...b,
        status: 'cancelled',
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
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const pending   = bookings.filter(b => b.status === 'pending').length;

  const sportMap = {};
  bookings.forEach(b => { sportMap[b.sport] = (sportMap[b.sport]||0) + 1; });
  const maxCount = Math.max(...Object.values(sportMap), 1);

  return (
    <div className="dashboard">

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Leave a Review</h3>
            <p style={{color:'var(--text-secondary)',fontSize:14,marginBottom:20}}>
              Rate your session with <strong>{reviewModal.trainerId?.name}</strong>
            </p>
            <div className="star-picker">
              {[1,2,3,4,5].map(n => (
                <button key={n} className={`star-pick ${reviewForm.rating >= n ? 'active':''}`}
                  onClick={() => setReviewForm(f => ({...f, rating: n}))}>★</button>
              ))}
              <span style={{marginLeft:8,color:'var(--text-secondary)',fontSize:14}}>{reviewForm.rating}/5</span>
            </div>
            <textarea className="review-textarea" rows={4}
              placeholder="Tell us about your experience..."
              value={reviewForm.comment}
              onChange={e => setReviewForm(f => ({...f, comment: e.target.value}))} />
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setReviewModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={submitReview}>Submit Review</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModal && (
        <div className="modal-overlay" onClick={() => { setCancelModal(null); setCancelReason(''); }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{color:'var(--danger)'}}>Cancel Booking</h3>
            <p style={{color:'var(--text-secondary)',fontSize:14,margin:'8px 0 20px'}}>
              You are cancelling: <strong>{cancelModal.sport} — {cancelModal.trainerId?.name}</strong>
              <br/>The trainer will be notified and the slot will be freed.
            </p>

            {/* Quick reason chips */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-secondary)',marginBottom:8}}>
                Quick Reasons
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {[
                  'Schedule conflict',
                  'Found another trainer',
                  'Budget constraints',
                  'Event postponed',
                  'Emergency situation',
                  'Trainer not responding',
                ].map(r => (
                  <button key={r}
                    style={{
                      background: cancelReason === r ? 'rgba(255,71,87,0.2)' : 'var(--bg-secondary)',
                      border: `1px solid ${cancelReason === r ? 'rgba(255,71,87,0.5)' : 'var(--border-light)'}`,
                      borderRadius: 20, padding: '6px 14px', fontSize: 12,
                      color: cancelReason === r ? 'var(--danger)' : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onClick={() => setCancelReason(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="review-textarea"
              rows={3}
              placeholder="Or write your own reason..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />

            <div className="modal-actions">
              <button className="btn-outline" onClick={() => { setCancelModal(null); setCancelReason(''); }}>
                Keep Booking
              </button>
              <button
                style={{background:'var(--danger)',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',fontWeight:700,cursor:'pointer',opacity: cancelling ? 0.6 : 1}}
                onClick={submitCancel}
                disabled={cancelling || !cancelReason.trim()}
              >
                {cancelling ? 'Cancelling...' : '❌ Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Report Modal */}
      {reportModal && (
        <div className="modal-overlay" onClick={() => setReportModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Performance Report</h3>
            <p style={{color:'var(--text-secondary)',fontSize:13,marginBottom:12}}>
              From: <strong>{reportModal.trainerId?.name}</strong> — {reportModal.sport}
            </p>
            {reportModal.performanceReport ? (
              <div className="report-content">{reportModal.performanceReport}</div>
            ) : (
              <p style={{color:'var(--text-secondary)',fontSize:14}}>No report submitted yet.</p>
            )}
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setReportModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="dash-top">
        <div className="dash-greeting">
          <h1>Hey, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Your college booking overview</p>
        </div>
        <Link to="/find-trainers">
          <button className="btn-primary" style={{fontSize:15,padding:'12px 28px'}}>Find a Trainer →</button>
        </Link>
      </div>

      {/* Stats */}
      <div className="stat-cards">
        <div className="stat-card total">    <div className="stat-number">{total}</div>     <div className="stat-label">Total Bookings</div></div>
        <div className="stat-card confirmed"><div className="stat-number">{confirmed}</div> <div className="stat-label">Confirmed</div></div>
        <div className="stat-card completed"><div className="stat-number">{completed}</div> <div className="stat-label">Completed</div></div>
        <div className="stat-card pending">  <div className="stat-number">{pending}</div>   <div className="stat-label">Pending</div></div>
      </div>

      <div className="dash-grid">
        <div className="bookings-panel">
          <div className="panel-title">My Bookings</div>
          {loading ? <p style={{color:'var(--text-secondary)'}}>Loading...</p>
            : bookings.length === 0
              ? <p style={{color:'var(--text-secondary)',fontSize:14}}>No bookings yet. <Link to="/find-trainers" style={{color:'var(--accent)'}}>Find a trainer →</Link></p>
              : bookings.map(b => (
                <div className="booking-item expanded" key={b._id}>
                  <div className="booking-row">
                    <div className="booking-icon">🏅</div>
                    <div className="booking-info">
                      <div className="booking-name">{b.sport} — {b.trainerId?.name || 'Trainer'}</div>
                      <div className="booking-date">{new Date(b.createdAt).toDateString()}</div>
                    </div>
                    <div className="booking-actions">
                      {statusBadge(b.status)}
                    </div>
                  </div>

                  {/* Timeline */}
                  <StatusTimeline status={b.status} />

                  {/* Cancellation info */}
                  {b.status === 'cancelled' && b.cancellationReason && (
                    <div className="cancel-info">
                      <span className="cancel-by">
                        Cancelled by {b.cancelledBy === 'college' ? 'you' : 'trainer'}
                      </span>
                      <span className="cancel-reason">"{b.cancellationReason}"</span>
                    </div>
                  )}

                  {/* Status notes */}
                  {b.status === 'pending' && (
                    <div className="status-note">⏳ Waiting for trainer to confirm your booking</div>
                  )}
                  {b.status === 'confirmed' && (
                    <div className="status-note confirmed-note">✅ Trainer confirmed! Session is scheduled.</div>
                  )}

                  {/* Actions */}
                  <div className="completed-actions">
                    {/* Cancel — only for pending or confirmed */}
                    {['pending','confirmed'].includes(b.status) && (
                      <button className="action-btn cancel-btn"
                        onClick={() => { setCancelModal(b); setCancelReason(''); }}>
                        ❌ Cancel Booking
                      </button>
                    )}

                    {/* Review — completed and no review yet */}
                    {b.status === 'completed' && !b.review?.rating && (
                      <button className="action-btn review"
                        onClick={() => { setReviewModal(b); setReviewForm({rating:5,comment:''}); }}>
                        ⭐ Leave Review
                      </button>
                    )}

                    {/* Existing review */}
                    {b.status === 'completed' && b.review?.rating > 0 && (
                      <div className="existing-review">
                        <span style={{color:'var(--warning)'}}>
                          {'★'.repeat(b.review.rating)}{'☆'.repeat(5-b.review.rating)}
                        </span>
                        <span style={{fontSize:13,color:'var(--text-secondary)',marginLeft:8}}>
                          {b.review.comment || 'No comment'}
                        </span>
                      </div>
                    )}

                    {/* Performance report */}
                    {b.status === 'completed' && (
                      <button className="action-btn report" onClick={() => setReportModal(b)}>
                        📊 Performance Report
                      </button>
                    )}
                  </div>
                </div>
              ))
          }
        </div>

        {/* Sport Breakdown */}
        <div className="breakdown-panel">
          <div className="panel-title">Sport Breakdown</div>
          {Object.entries(sportMap).map(([sport, count], i) => (
            <div className="sport-bar-item" key={sport}>
              <div className="sport-bar-label"><span>{sport}</span><span>{count}</span></div>
              <div className="sport-bar-track">
                <div className="sport-bar-fill" style={{width:`${(count/maxCount)*100}%`,background:BAR_COLORS[i%BAR_COLORS.length]}} />
              </div>
            </div>
          ))}
          {Object.keys(sportMap).length === 0 && (
            <p style={{color:'var(--text-secondary)',fontSize:13}}>No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}