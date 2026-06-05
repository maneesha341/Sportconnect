import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './ManageSlots.css';

export default function ManageSlots() {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '' });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get('/slots/my/all').then(res => {
      setSlots(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const addSlot = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await api.post('/slots', form);
      setSlots(prev => [res.data, ...prev]);
      setForm({ date: '', startTime: '', endTime: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add slot');
    } finally {
      setAdding(false);
    }
  };

  const deleteSlot = async (id) => {
    await api.delete(`/slots/${id}`);
    setSlots(prev => prev.filter(s => s._id !== id));
  };

  return (
    <div className="slots-page page-wrapper">
      <h1 style={{ fontSize: 48, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Manage Slots</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 36 }}>Add your available time slots for colleges to book</p>

      {/* Add Slot Form */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 20 }}>
          Add New Slot
        </div>
        <form className="slot-form" onSubmit={addSlot}>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary" disabled={adding}>
            {adding ? 'Adding...' : '+ Add Slot'}
          </button>
        </form>
      </div>

      {/* Slots List */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 20 }}>
          Your Slots ({slots.length})
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : slots.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No slots added yet. Add your first slot above.</p>
        ) : (
          <div className="slots-list">
            {slots.map(slot => (
              <div className="slot-item" key={slot._id}>
                <div className="slot-icon">📅</div>
                <div className="slot-info">
                  <div className="slot-date">{new Date(slot.date + 'T00:00:00').toDateString()}</div>
                  <div className="slot-time">{slot.startTime} – {slot.endTime}</div>
                </div>
                <span className={`badge ${slot.status === 'available' ? 'badge-success' : 'badge-cyan'}`}>
                  {slot.status}
                </span>
                {slot.status === 'available' && (
                  <button className="delete-btn" onClick={() => deleteSlot(slot._id)}>🗑</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}