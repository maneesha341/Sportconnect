import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './BookTrainer.css';

const COLORS = ['#c8f230','#00d4e8','#ff6b6b','#a78bfa','#fbbf24','#34d399'];
function avatarColor(name) {
  let h = 0;
  for (let c of (name || '')) h = c.charCodeAt(0) + h * 31;
  return COLORS[Math.abs(h) % COLORS.length];
}

export default function BookTrainer() {
  const { trainerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trainer, setTrainer]         = useState(null);
  const [slots, setSlots]             = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [message, setMessage]         = useState('');
  const [booking, setBooking]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    api.get(`/trainers/${trainerId}`)
      .then(r => setTrainer(r.data))
      .catch(() => setError('Could not load trainer.'));
    api.get(`/slots/${trainerId}`)
      .then(r => setSlots(r.data))
      .catch(() => {});
  }, [trainerId]);

  const handleBook = async () => {
    setError('');
    if (!user)                  { navigate('/login'); return; }
    if (user.role === 'trainer'){ setError('Only college accounts can book trainers.'); return; }
    if (!selectedSlot)          { setError('Please select a time slot first.'); return; }

    setBooking(true);
    try {
      await api.post('/bookings', {
        trainerId:  trainer._id,
        slotId:     selectedSlot._id,
        sport:      trainer.sports?.[0] || 'General',
        message,
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (!trainer) return (
    <div style={{ padding: 60, color: 'var(--text-secondary)', textAlign: 'center' }}>
      {error || 'Loading trainer...'}
    </div>
  );

  const initials = trainer.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="book-page page-wrapper">
      {success && (
        <div className="success-banner">✅ Booking confirmed! Redirecting to dashboard...</div>
      )}

      <div className="book-grid">

        {/* ── Left: Trainer Info ── */}
        <div className="card trainer-info-card">

          {/* Photo or initials */}
          {trainer.photo ? (
            <img
              src={trainer.photo}
              alt={trainer.name}
              className="trainer-photo-large"
            />
          ) : (
            <div
              className="big-avatar"
              style={{ background: avatarColor(trainer.name), color: '#000' }}
            >
              {initials}
            </div>
          )}

          <h2>{trainer.name}</h2>
          <p className="trainer-sport-label">
            {trainer.sports?.join(', ')} Coach · {trainer.experience} yrs exp
          </p>

          {trainer.bio && <p className="trainer-bio">{trainer.bio}</p>}

          <div className="trainer-details">
            {trainer.location && (
              <div className="detail-row"><span>📍</span><span>{trainer.location}</span></div>
            )}
            {trainer.trainerState && (
              <div className="detail-row"><span>🗺️</span><span>{trainer.trainerState}</span></div>
            )}
            <div className="detail-row"><span>💰</span><span>₹{trainer.hourlyRate}/hr</span></div>
            {trainer.certifications?.map((c, i) => (
              <div className="detail-row" key={i}><span>🏅</span><span>{c}</span></div>
            ))}
          </div>
        </div>

        {/* ── Right: Booking Panel ── */}
        <div className="card">

          {error && (
            <div style={{
              background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              color: 'var(--danger)', fontSize: 14,
            }}>
              {error}
            </div>
          )}

          <div className="panel-title-sm">Select a Slot</div>

          {slots.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              This trainer has no available slots yet.
            </p>
          ) : (
            <div className="slot-picker">
              {slots.map(slot => (
                <button
                  key={slot._id}
                  className={`slot-option ${selectedSlot?._id === slot._id ? 'selected' : ''}`}
                  onClick={() => { setSelectedSlot(slot); setError(''); }}
                >
                  <span className="slot-opt-date">
                    {new Date(slot.date + 'T00:00:00').toDateString()}
                  </span>
                  <span className="slot-opt-time">
                    {slot.startTime} – {slot.endTime}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedSlot && (
            <div style={{
              background: 'rgba(200,242,48,0.08)', border: '1px solid rgba(200,242,48,0.2)',
              borderRadius: 10, padding: '10px 14px', margin: '12px 0',
              fontSize: 13, color: 'var(--accent)',
            }}>
              ✓ Selected: {new Date(selectedSlot.date + 'T00:00:00').toDateString()} · {selectedSlot.startTime} – {selectedSlot.endTime}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div className="panel-title-sm">Message (Optional)</div>
            <textarea
              className="msg-input"
              rows={3}
              placeholder="Tell the trainer about your requirements..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', padding: 16, fontSize: 16, marginTop: 20, borderRadius: 12 }}
            onClick={handleBook}
            disabled={booking || success || slots.length === 0}
          >
            {booking ? 'Booking...'
              : success ? 'Booked! ✓'
              : selectedSlot ? `Book ₹${trainer.hourlyRate}/hr →`
              : 'Select a slot to book'}
          </button>

          {!user && (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}>
              <a href="/login" style={{ color: 'var(--accent)' }}>Login as a college</a> to book.
            </p>
          )}
          {user?.role === 'trainer' && (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--warning)', marginTop: 12 }}>
              ⚠️ Only college accounts can book trainers.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}