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
  const map = { confirmed:'badge-cyan', completed:'badge-success', cancelled:'badge-danger', pending:'badge-warning' };
  return <span className={`badge ${map[status]||'badge-accent'}`}>{status}</span>;
}

// ── PDF Invoice Generator (no backend needed) ──
function downloadInvoice(booking) {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = () => {
    const { jsPDF } = window.jspdf;
    generatePDF(booking, jsPDF);
  };
  // If already loaded
  if (window.jspdf) {
    generatePDF(booking, window.jspdf.jsPDF);
    return;
  }
  document.head.appendChild(script);
}

function generatePDF(booking, jsPDF) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();

  const DARK   = [10, 12, 20];
  const ACCENT = [200, 242, 48];
  const WHITE  = [255, 255, 255];
  const GRAY   = [136, 146, 164];
  const LGRAY  = [240, 240, 240];
  const DKGRAY = [30, 37, 53];

  // Background
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 297, 'F');

  // Header
  doc.setFillColor(...DKGRAY);
  doc.roundedRect(10, 10, W - 20, 48, 4, 4, 'F');

  // Brand dot
  doc.setFillColor(...ACCENT);
  doc.circle(24, 33, 5, 'F');

  // Brand name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text('SPORTCONNECT', 33, 30);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Sports Trainer Booking Platform', 33, 37);
  doc.text('sportconnect-chi.vercel.app', 33, 43);

  // Invoice label
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('SESSION INVOICE', W - 15, 26, { align: 'right' });

  const invoiceNo = `INV-${(booking._id||'').slice(-8).toUpperCase()||'XXXXXXXX'}`;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(invoiceNo, W - 15, 33, { align: 'right' });
  doc.text(`Date: ${new Date(booking.createdAt||Date.now()).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}`, W - 15, 40, { align: 'right' });

  // Status badge
  const status = (booking.status||'completed').toUpperCase();
  const sc = status==='COMPLETED' ? [0,230,118] : status==='CONFIRMED' ? [0,212,232] : status==='CANCELLED' ? [255,71,87] : [255,167,38];
  doc.setFillColor(...sc);
  doc.roundedRect(W - 55, 48, 45, 9, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(status, W - 32.5, 53.5, { align: 'center' });

  // Billed To / From
  let y = 70;
  doc.setFillColor(...DKGRAY);
  doc.roundedRect(10, y, 88, 52, 3, 3, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text('BILLED TO', 18, y + 9);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  const collegeName = booking.collegeId?.name || 'College';
  doc.text(collegeName.length > 20 ? collegeName.substring(0,20)+'...' : collegeName, 18, y + 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(booking.collegeId?.email || '', 18, y + 26);
  doc.text('Role: College / Institution', 18, y + 33);
  doc.text(`Booking ID: ${(booking._id||'').slice(-8).toUpperCase()}`, 18, y + 40);

  doc.setFillColor(...DKGRAY);
  doc.roundedRect(102, y, 88, 52, 3, 3, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text('TRAINER / SERVICE PROVIDER', 110, y + 9);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  const trainerName = booking.trainerId?.name || 'Trainer';
  doc.text(trainerName.length > 20 ? trainerName.substring(0,20)+'...' : trainerName, 110, y + 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`Sport: ${booking.sport||'—'}`, 110, y + 26);
  doc.text(`Experience: ${booking.trainerId?.experience||0} years`, 110, y + 33);
  doc.text(`Location: ${booking.trainerId?.location||'—'}`, 110, y + 40);

  // Session Details
  y += 65;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text('SESSION DETAILS', 10, y);

  y += 5;
  doc.setFillColor(30, 40, 60);
  doc.rect(10, y, W - 20, 9, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('Description', 14, y + 6);
  doc.text('Sport', 88, y + 6);
  doc.text('Date', 118, y + 6);
  doc.text('Time', 148, y + 6);
  doc.text('Amount', W - 14, y + 6, { align: 'right' });

  y += 9;
  doc.setFillColor(...DKGRAY);
  doc.rect(10, y, W - 20, 12, 'F');

  const sessionDate = booking.slotId?.date
    ? new Date(booking.slotId.date + 'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
    : new Date(booking.createdAt||Date.now()).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  const timeSlot = booking.slotId?.startTime && booking.slotId?.endTime
    ? `${booking.slotId.startTime}–${booking.slotId.endTime}` : 'Scheduled';
  const rate = booking.trainerId?.hourlyRate || booking.paymentAmount || 0;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...WHITE);
  doc.text('Sports Training Session', 14, y + 8);
  doc.text(booking.sport||'—', 88, y + 8);
  doc.text(sessionDate, 118, y + 8);
  doc.text(timeSlot, 148, y + 8);
  doc.setTextColor(...ACCENT);
  doc.setFont('helvetica', 'bold');
  doc.text(`RS.${rate}`, W - 14, y + 8, { align: 'right' });

  // Payment Summary
  y += 22;
  doc.setFillColor(...DKGRAY);
  doc.roundedRect(W - 80, y, 70, 48, 3, 3, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text('PAYMENT SUMMARY', W - 77, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Subtotal:', W - 77, y + 18);
  doc.text(`RS.${rate}`, W - 14, y + 18, { align: 'right' });

  doc.text('Platform Fee:', W - 77, y + 25);
  doc.setTextColor(0, 230, 118);
  doc.text('FREE', W - 14, y + 25, { align: 'right' });

  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.2);
  doc.line(W - 77, y + 30, W - 14, y + 30);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('TOTAL:', W - 77, y + 39);
  doc.setTextColor(...ACCENT);
  doc.text(`RS.${rate}`, W - 14, y + 39, { align: 'right' });

  // Left side: Payment status
  const paid = booking.paymentStatus === 'paid';
  doc.setFillColor(...DKGRAY);
  doc.roundedRect(10, y, 95, 22, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(paid ? 0 : 255, paid ? 230 : 167, paid ? 118 : 38);
  doc.text(paid ? '✓  PAYMENT RECEIVED' : '◷  PAYMENT PENDING', 18, y + 10);
  if (booking.paymentId) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(`Payment ID: ${booking.paymentId}`, 18, y + 18);
  }

  // Review
  y += 58;
  if (booking.review?.rating) {
    doc.setFillColor(...DKGRAY);
    doc.roundedRect(10, y, W - 20, 20, 3, 3, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ACCENT);
    doc.text('COLLEGE REVIEW', 18, y + 8);

    doc.setFontSize(13);
    doc.setTextColor(255, 167, 38);
    doc.text('★'.repeat(booking.review.rating) + '☆'.repeat(5 - booking.review.rating), 18, y + 16);

    if (booking.review.comment) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      doc.text(`"${booking.review.comment}"`, 62, y + 16);
    }
    y += 25;
  }

  // Performance report
  if (booking.performanceReport) {
    doc.setFillColor(...DKGRAY);
    doc.roundedRect(10, y, W - 20, 20, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(161, 139, 250);
    doc.text('PERFORMANCE REPORT', 18, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    const lines = doc.splitTextToSize(booking.performanceReport, W - 40);
    doc.text(lines[0], 18, y + 15);
    y += 25;
  }

  // Message
  if (booking.message) {
    doc.setFillColor(...DKGRAY);
    doc.roundedRect(10, y, W - 20, 15, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text('Booking Message:', 18, y + 7);
    doc.setFont('helvetica', 'normal');
    const ml = doc.splitTextToSize(`"${booking.message}"`, W - 70);
    doc.text(ml[0], 55, y + 7);
    y += 20;
  }

  // Footer
  doc.setFillColor(...DKGRAY);
  doc.rect(0, 272, W, 25, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text('Thank you for using SportConnect!', W / 2, 280, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('sportconnect-chi.vercel.app  •  This is a system generated invoice', W / 2, 287, { align: 'center' });

  doc.save(`SportConnect_Invoice_${invoiceNo}.pdf`);
}

export default function BookingHistory() {
  const { user } = useAuth();
  const [bookings, setBookings]       = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [activeFilter, setFilter]     = useState('all');
  const [loading, setLoading]         = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm]   = useState({ rating: 5, comment: '' });
  const [downloading, setDownloading] = useState(null);

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

  const handleDownload = (booking) => {
    setDownloading(booking._id);
    setTimeout(() => {
      downloadInvoice(booking);
      setTimeout(() => setDownloading(null), 2000);
    }, 100);
  };

  const total     = bookings.length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const pending   = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
  const cancelled = bookings.filter(b => b.status === 'cancelled').length;
  const isCollege = user?.role === 'college';

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

      <h1>Booking History</h1>
      <p className="history-subtitle">
        Complete record of all your {isCollege ? 'training' : 'coaching'} sessions
      </p>

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
            ? isCollege ? "You haven't booked any trainers yet." : 'No bookings received yet.'
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
                    <div className="hcard-title">{b.sport} — {name}</div>
                    <div className="hcard-sub">Booked on {new Date(b.createdAt).toDateString()}</div>
                  </div>
                  {statusBadge(b.status)}
                </div>

                {/* Meta */}
                <div className="hcard-meta">
                  <div className="hmeta-item">
                    <div className="hmeta-label">Sport</div>
                    <div className="hmeta-value">🏅 {b.sport}</div>
                  </div>
                  {b.slotId && (
                    <>
                      <div className="hmeta-item">
                        <div className="hmeta-label">Session Date</div>
                        <div className="hmeta-value">📅 {new Date(b.slotId.date + 'T00:00:00').toDateString()}</div>
                      </div>
                      <div className="hmeta-item">
                        <div className="hmeta-label">Time</div>
                        <div className="hmeta-value">🕐 {b.slotId.startTime} – {b.slotId.endTime}</div>
                      </div>
                    </>
                  )}
                  {isCollege && b.trainerId?.hourlyRate > 0 && (
                    <div className="hmeta-item">
                      <div className="hmeta-label">Rate</div>
                      <div className="hmeta-value">💰 RS.{b.trainerId.hourlyRate}/hr</div>
                    </div>
                  )}
                  {b.paymentStatus === 'paid' && (
                    <div className="hmeta-item">
                      <div className="hmeta-label">Payment</div>
                      <div className="hmeta-value" style={{color:'var(--success)'}}>✅ Paid</div>
                    </div>
                  )}
                </div>

                {/* Cancellation reason */}
                {b.status === 'cancelled' && b.cancellationReason && (
                  <div style={{
                    background:'rgba(255,71,87,0.07)',border:'1px solid rgba(255,71,87,0.2)',
                    borderRadius:10,padding:'10px 14px',margin:'0 0 14px',fontSize:13,
                    color:'var(--text-secondary)'
                  }}>
                    ❌ Cancelled by {b.cancelledBy} — "{b.cancellationReason}"
                  </div>
                )}

                {/* Footer actions */}
                <div className="hcard-footer">
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>

                    {/* Leave review */}
                    {isCollege && b.status === 'completed' && !b.review?.rating && (
                      <button className="action-btn review"
                        onClick={() => { setReviewModal(b); setReviewForm({rating:5,comment:''}); }}>
                        ⭐ Leave Review
                      </button>
                    )}

                    {/* Download Invoice */}
                    {b.status === 'completed' && (
                      <button
                        className="action-btn"
                        style={{
                          background: 'rgba(161,139,250,0.15)',
                          color: '#a78bfa',
                          border: '1px solid rgba(161,139,250,0.25)',
                          opacity: downloading === b._id ? 0.6 : 1,
                        }}
                        onClick={() => handleDownload(b)}
                        disabled={downloading === b._id}
                      >
                        {downloading === b._id ? '⏳ Generating...' : '📄 Download Invoice'}
                      </button>
                    )}

                    {/* Message */}
                    <Link to="/messages">
                      <button className="action-btn report">💬 Message</button>
                    </Link>
                  </div>
                  <div style={{fontSize:12,color:'var(--text-secondary)'}}>
                    ID: {b._id?.slice(-8).toUpperCase()}
                  </div>
                </div>

                {/* Review display */}
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