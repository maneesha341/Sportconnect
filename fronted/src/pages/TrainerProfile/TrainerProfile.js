import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import './TrainerProfile.css';

export default function TrainerProfile() {
  const [form, setForm] = useState({
    sport: '', hourlyRate: '', experience: '',
    location: '', trainerState: '', availability: 'available',
    certifications: '', bio: '', photo: '',
  });
  const [preview, setPreview] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    api.get('/trainers/my/profile').then(res => {
      const d = res.data;
      setForm({
        sport:          d.sports?.[0] || '',
        hourlyRate:     d.hourlyRate || '',
        experience:     d.experience || '',
        location:       d.location || '',
        trainerState:   d.trainerState || '',
        availability:   d.availability || 'available',
        certifications: (d.certifications || []).join(', '),
        bio:            d.bio || '',
        photo:          d.photo || '',
      });
      if (d.photo) setPreview(d.photo);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be under 2MB. Please choose a smaller image.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setForm(f => ({ ...f, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put('/trainers/my/profile', {
        sports:         form.sport ? [form.sport] : [],
        hourlyRate:     Number(form.hourlyRate) || 0,
        experience:     Number(form.experience) || 0,
        location:       form.location,
        trainerState:   form.trainerState,
        availability:   form.availability,
        certifications: form.certifications.split(',').map(c => c.trim()).filter(Boolean),
        bio:            form.bio,
        photo:          form.photo,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: 60, color: 'var(--text-secondary)', textAlign: 'center' }}>
      Loading profile...
    </div>
  );

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      <p className="subtitle">This is what colleges see when they find you. Keep it sharp.</p>

      {error && <div className="profile-error">{error}</div>}

      <form className="profile-form-card" onSubmit={handleSave}>

        {/* ── Photo Upload ── */}
        <div className="photo-section">
          <div className="photo-preview" onClick={() => fileRef.current.click()}>
            {preview ? (
              <img src={preview} alt="Trainer" className="photo-img" />
            ) : (
              <div className="photo-placeholder">
                <span className="photo-icon">📷</span>
                <span>Upload Photo</span>
              </div>
            )}
            <div className="photo-overlay">📷 Change Photo</div>
          </div>

          <input
            type="file"
            ref={fileRef}
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />

          <div className="photo-info">
            <p className="photo-name">
              {preview ? 'Photo uploaded ✓' : 'No photo yet'}
            </p>
            <p className="photo-hint">
              Click the circle to upload a photo.<br />
              JPG, PNG or WEBP — max 2MB.<br />
              Your photo shows on trainer cards and the booking page.
            </p>
            {preview && (
              <button
                type="button"
                className="remove-photo-btn"
                onClick={() => { setPreview(''); setForm(f => ({ ...f, photo: '' })); }}
              >
                ✕ Remove photo
              </button>
            )}
          </div>
        </div>

        {/* ── Sport & Fee ── */}
        <div className="form-row-2">
          <div className="form-group">
            <label>Sport *</label>
            <input
              type="text"
              value={form.sport}
              onChange={e => set('sport', e.target.value)}
              placeholder="e.g. Hockey"
              required
            />
          </div>
          <div className="form-group">
            <label>Fee Per Hour (RS) *</label>
            <input
              type="number"
              value={form.hourlyRate}
              onChange={e => set('hourlyRate', e.target.value)}
              placeholder="e.g. 500"
              required
            />
          </div>
        </div>

        {/* ── Experience & City ── */}
        <div className="form-row-2">
          <div className="form-group">
            <label>Experience (Years)</label>
            <input
              type="number"
              value={form.experience}
              onChange={e => set('experience', e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. Vizag"
            />
          </div>
        </div>

        {/* ── State & Availability ── */}
        <div className="form-row-2">
          <div className="form-group">
            <label>State</label>
            <input
              type="text"
              value={form.trainerState}
              onChange={e => set('trainerState', e.target.value)}
              placeholder="e.g. Andhra Pradesh"
            />
          </div>
          <div className="form-group">
            <label>Availability</label>
            <select value={form.availability} onChange={e => set('availability', e.target.value)}>
              <option value="available">Available - show me to colleges</option>
              <option value="busy">Busy - hide me for now</option>
            </select>
          </div>
        </div>

        {/* ── Certifications ── */}
        <div className="form-group">
          <label>Certifications (Comma Separated)</label>
          <input
            type="text"
            value={form.certifications}
            onChange={e => set('certifications', e.target.value)}
            placeholder="e.g. SAI Certified, NIS Diploma, State Level Winner"
          />
        </div>

        {/* ── Bio ── */}
        <div className="form-group">
          <label>Bio</label>
          <textarea
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            placeholder="Tell colleges about your experience and coaching style..."
          />
        </div>

        <button
          type="submit"
          className={`save-btn ${saved ? 'saved' : ''}`}
          disabled={saving}
        >
          {saving ? 'Saving...' : saved ? '✓ Profile Saved!' : 'Save Profile'}
        </button>

      </form>
    </div>
  );
}