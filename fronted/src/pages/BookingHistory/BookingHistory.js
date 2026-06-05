import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './BookingHistory.css';

const COLORS = ['#c8f230','#00d4e8','#ff6b6b','#a78bfa','#fbbf24','#34d399'];
function avatarColor(name) {
  let h = 0;
  for (let c of (name||'')) h = c.charCodeAt(0) + h * 31;
  return COLORS[Math.abs(h) % COLORS.length];
}
function initials(name) {
  return (name||'').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
}

function statusBadge(status) {
  const map = {
    confirmed: 'badge-cyan', completed: 'badge-success',
    cancelled: 'badge-danger', pending: 'badge-warning',
  };
  return <span className={`badge ${map[status]||'badge-accent'}`}>{status}</span>;
}

export default function BookingHistory() {
  const { user } = useAuth();
  const [bookings, setBookings]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [activeFilter, setFilter] = useState('all');
  const [loading, setLoading]     = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm]   = useState({ rating: 5, comment: '' });

  useEffect(() => {
    api.get('/bookings/mine')
      .then(res => { setBookings(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeFilter === 'all') setFiltered(bookings);
    else setFiltered(bookings.filter(b => b.status === activeFilter));
  }, [activeFilter, bookings]);

  const submitReview = async () => {
    try {
      const res = await api.put(`/bookings/${reviewModal._id}/review`, reviewForm);
      setBookings(prev => prev.map(b => b._id === reviewModal._id ? { ...b, review: res.data.review } : b));
      setReviewModal(null);
    } catch (e) { alert('Failed to submit review'); }
  };

  const total     = bookings.length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const pending   = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
  const cancelled = bookings.filter(b => b.status === 'cancelled').length;

  const isCollege  = user?.role === 'college';
  const partnerKey = isCollege ? 'trainerId' : 'collegeId';

  return (
    <div className="history-page">

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
                <button key={n} className={`star-pick ${reviewForm.rating >= n ? 'active' : ''}`}
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

      <h1>Booking History</h1>
      <p className="history-subtitle">Complete record of all your {isCollege ? 'training' : 'coaching'} sessions</p>

      {/* Stats */}
      <div className="history-stats">
        <div className="hstat total">
          <div className="hstat-num">{total}</div>
          <div className="hstat-label">Total Bookings</div>
        </div>
        <div className="hstat completed">
          <div className="hstat-num">{completed}</div>
          <div className="hstat-label">Completed</div>
        </div>
        <div className="hstat pending">
          <div className="hstat-num">{pending}</div>
          <div className="hstat-label">Active</div>
        </div>
        <div className="hstat cancelled">
          <div className="hstat-num">{cancelled}</div>
          <div className="hstat-label">Cancelled</div>
        </div>
      </div>

      {/* Filters */}
      <div className="history-filters">
        {['all','pending','confirmed','completed','cancelled'].map(f => (
          <button key={f}
            className={`filter-tab ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span style={{marginLeft:6,opacity:0.7}}>
                ({bookings.filter(b => b.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{color:'var(--text-secondary)'}}>Loading history...</p>
      ) : filtered.length === 0 ? (
        <div className="no-history">
          <div className="no-history-icon">📋</div>
          <h3>No bookings found</h3>
          <p>{activeFilter === 'all'
            ? isCollege ? 'You haven\'t booked any trainers yet.' : 'No bookings received yet.'
            : `No ${activeFilter} bookings.`}
          </p>
          {isCollege && activeFilter === 'all' && (
            <Link to="/find-trainers">
              <button className="btn-primary" style={{marginTop:20}}>Find a Trainer →</button>
            </Link>
          )}
        </div>
      ) : (
        <div className="history-list">
          {filtered.map(b => {
            const partner = isCollege ? b.trainerId : b.collegeId;
            const photo   = isCollege ? b.trainerId?.photo : '';
            const name    = partner?.name || (isCollege ? 'Trainer' : 'College');

            return (
              <div className="hcard" key={b._id}>
                <div className="hcard-top">
                  {photo ? (
                    <img src={photo} alt={name} className="hcard-avatar" />
                  ) : (
                    <div className="hcard-avatar-letter" style={{background: avatarColor(name)}}>
                      {initials(name)}
                    </div>
                  )}
                  <div className="hcard-info">
                    <div className="hcard-title">
                      {b.sport} — {name}
                    </div>
                    <div className="hcard-sub">
                      Booked on {new Date(b.createdAt).toDateString()}
                    </div>
                  </div>
                  {statusBadge(b.status)}
                </div>

                {/* Meta info */}
                <div className="hcard-meta">
                  <div className="hmeta-item">
                    <div className="hmeta-label">Sport</div>
                    <div className="hmeta-value">🏅 {b.sport}</div>
                  </div>
                  {b.slotId && (
                    <>
                      <div className="hmeta-item">
                        <div className="hmeta-label">Session Date</div>
                        <div className="hmeta-value">
                          📅 {new Date(b.slotId.date + 'T00:00:00').toDateString()}
                        </div>
                      </div>
                      <div className="hmeta-item">
                        <div className="hmeta-label">Time</div>
                        <div className="hmeta-value">
                          🕐 {b.slotId.startTime} – {b.slotId.endTime}
                        </div>
                      </div>
                    </>
                  )}
                  {isCollege && b.trainerId?.hourlyRate > 0 && (
                    <div className="hmeta-item">
                      <div className="hmeta-label">Rate</div>
                      <div className="hmeta-value">💰 RS.{b.trainerId.hourlyRate}/hr</div>
                    </div>
                  )}
                  {b.message && (
                    <div className="hmeta-item">
                      <div className="hmeta-label">Message</div>
                      <div className="hmeta-value" style={{fontWeight:400,color:'var(--text-secondary)'}}>
                        💬 {b.message}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="hcard-footer">
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {/* College: leave review on completed */}
                    {isCollege && b.status === 'completed' && !b.review?.rating && (
                      <button className="action-btn review"
                        onClick={() => { setReviewModal(b); setReviewForm({rating:5,comment:''}); }}>
                        ⭐ Leave Review
                      </button>
                    )}
                    {/* Message partner */}
                    <Link to={`/messages`}>
                      <button className="action-btn report">💬 Message</button>
                    </Link>
                  </div>
                  <div style={{fontSize:12,color:'var(--text-secondary)'}}>
                    ID: {b._id.slice(-8).toUpperCase()}
                  </div>
                </div>

                {/* Review */}
                {b.review?.rating > 0 && (
                  <div className="review-display">
                    <span className="review-stars">
                      {'★'.repeat(b.review.rating)}{'☆'.repeat(5 - b.review.rating)}
                    </span>
                    <span className="review-comment">
                      {b.review.comment || 'No comment left'}
                    </span>
                  </div>
                )}

                {/* Performance Report */}
                {b.performanceReport && (
                  <div className="report-display">
                    <div className="report-label">📊 Performance Report</div>
                    <div className="report-text">{b.performanceReport}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}