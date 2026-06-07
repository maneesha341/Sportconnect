import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import './TrainerProfile.css';

export default function TrainerProfile() {
  const [form, setForm] = useState({
    sport: '', hourlyRate: '', experience: '',
    location: '', trainerState: '', availability: 'available',
    certifications: '', bio: '', photo: '',
    proofDocument: '', proofType: '', governmentId: '',
  });
  const [approvalStatus,   setApprovalStatus]   = useState('pending');
  const [rejectionReason,  setRejectionReason]  = useState('');
  const [photoPreview,     setPhotoPreview]      = useState('');
  const [proofPreview,     setProofPreview]      = useState('');
  const [govIdPreview,     setGovIdPreview]      = useState('');
  const [saved,    setSaved]   = useState(false);
  const [loading,  setLoading] = useState(true);
  const [saving,   setSaving]  = useState(false);
  const [error,    setError]   = useState('');

  const photoRef  = useRef();
  const proofRef  = useRef();
  const govIdRef  = useRef();

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
        proofDocument:  d.proofDocument || '',
        proofType:      d.proofType || '',
        governmentId:   d.governmentId || '',
      });
      if (d.photo)          setPhotoPreview(d.photo);
      if (d.proofDocument)  setProofPreview(d.proofDocument);
      if (d.governmentId)   setGovIdPreview(d.governmentId);
      setApprovalStatus(d.approvalStatus || 'pending');
      setRejectionReason(d.rejectionReason || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleFileChange = (e, field, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError(`${field === 'photo' ? 'Photo' : 'Document'} must be under 5MB`); return; }
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setForm(f => ({ ...f, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
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
        proofDocument:  form.proofDocument,
        proofType:      form.proofType,
        governmentId:   form.governmentId,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Try again.');
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      <p className="subtitle">Complete your profile and upload proof documents for admin verification.</p>

      {/* Approval Status Banner */}
      {approvalStatus === 'pending' && (
        <div className="approval-banner pending">
          <span className="approval-icon">⏳</span>
          <div>
            <div className="approval-title">Profile Pending Approval</div>
            <div className="approval-msg">
              Your profile is under review. Upload your certificates and government ID below to speed up approval.
            </div>
          </div>
        </div>
      )}
      {approvalStatus === 'approved' && (
        <div className="approval-banner approved">
          <span className="approval-icon">✅</span>
          <div>
            <div className="approval-title">Profile Approved — You are visible to colleges!</div>
            <div className="approval-msg">Colleges can find and book you on SportConnect.</div>
          </div>
        </div>
      )}
      {approvalStatus === 'rejected' && (
        <div className="approval-banner rejected">
          <span className="approval-icon">❌</span>
          <div>
            <div className="approval-title">Profile Not Approved</div>
            {rejectionReason && <div className="approval-msg">Reason: <strong>{rejectionReason}</strong></div>}
            <div className="approval-msg">Please update your profile and re-upload valid documents.</div>
          </div>
        </div>
      )}

      {error && <div className="profile-error">{error}</div>}

      <form className="profile-form-card" onSubmit={handleSave}>

        {/* ── Profile Photo ── */}
        <div className="photo-section">
          <div className="photo-preview" onClick={() => photoRef.current.click()}>
            {photoPreview
              ? <img src={photoPreview} alt="Profile" className="photo-img" />
              : <div className="photo-placeholder"><span className="photo-icon">📷</span><span>Profile Photo</span></div>
            }
            <div className="photo-overlay">📷 Change</div>
          </div>
          <input type="file" ref={photoRef} accept="image/*" style={{ display: 'none' }}
            onChange={e => handleFileChange(e, 'photo', setPhotoPreview)} />
          <div className="photo-info">
            <p className="photo-name">{photoPreview ? '✓ Photo uploaded' : 'No photo yet'}</p>
            <p className="photo-hint">JPG, PNG — max 2MB</p>
            {photoPreview && (
              <button type="button" className="remove-photo-btn"
                onClick={() => { setPhotoPreview(''); set('photo', ''); }}>✕ Remove</button>
            )}
          </div>
        </div>

        {/* ── Basic Info ── */}
        <div className="form-row-2">
          <div className="form-group">
            <label>Sport *</label>
            <input type="text" value={form.sport} onChange={e => set('sport', e.target.value)} placeholder="e.g. Hockey" required />
          </div>
          <div className="form-group">
            <label>Fee Per Hour (RS) *</label>
            <input type="number" value={form.hourlyRate} onChange={e => set('hourlyRate', e.target.value)} placeholder="e.g. 500" required />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label>Experience (Years)</label>
            <input type="number" value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="e.g. 5" />
          </div>
          <div className="form-group">
            <label>City</label>
            <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Vizag" />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label>State</label>
            <input type="text" value={form.trainerState} onChange={e => set('trainerState', e.target.value)} placeholder="e.g. Andhra Pradesh" />
          </div>
          <div className="form-group">
            <label>Availability</label>
            <select value={form.availability} onChange={e => set('availability', e.target.value)}>
              <option value="available">Available - show me to colleges</option>
              <option value="busy">Busy - hide me for now</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Certifications (Comma Separated)</label>
          <input type="text" value={form.certifications} onChange={e => set('certifications', e.target.value)}
            placeholder="e.g. SAI Certified, NIS Diploma, State Level Winner" />
        </div>

        <div className="form-group">
          <label>Bio</label>
          <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
            placeholder="Tell colleges about your experience and coaching style..." />
        </div>

        {/* ── Verification Documents ── */}
        <div className="docs-section">
          <div className="docs-title">
            <span>📋</span>
            <div>
              <div className="docs-heading">Verification Documents</div>
              <div className="docs-subheading">Upload proof of your certifications and identity. Admin will review these before approving your profile.</div>
            </div>
          </div>

          {/* Certificate / Proof */}
          <div className="doc-upload-row">
            <div className="doc-upload-box">
              <div className="form-group" style={{marginBottom: 10}}>
                <label>Certificate / Proof Type</label>
                <select value={form.proofType} onChange={e => set('proofType', e.target.value)}>
                  <option value="">Select document type...</option>
                  <option value="SAI Certificate">SAI Certificate</option>
                  <option value="NIS Diploma">NIS Diploma</option>
                  <option value="State Level Certificate">State Level Certificate</option>
                  <option value="National Level Certificate">National Level Certificate</option>
                  <option value="University Certificate">University Certificate</option>
                  <option value="Sports Authority Certificate">Sports Authority Certificate</option>
                  <option value="Other Certificate">Other Certificate</option>
                </select>
              </div>

              <div className="doc-upload-area" onClick={() => proofRef.current.click()}>
                {proofPreview ? (
                  <img src={proofPreview} alt="Certificate" className="doc-preview-img" />
                ) : (
                  <div className="doc-placeholder">
                    <span style={{fontSize: 36}}>📜</span>
                    <span>Click to upload certificate</span>
                    <span style={{fontSize: 12, color: 'var(--text-secondary)'}}>JPG, PNG — max 5MB</span>
                  </div>
                )}
              </div>
              <input type="file" ref={proofRef} accept="image/*" style={{ display: 'none' }}
                onChange={e => handleFileChange(e, 'proofDocument', setProofPreview)} />
              {proofPreview && (
                <button type="button" className="remove-photo-btn" style={{marginTop: 8}}
                  onClick={() => { setProofPreview(''); set('proofDocument', ''); }}>✕ Remove certificate</button>
              )}
            </div>

            {/* Government ID */}
            <div className="doc-upload-box">
              <div style={{marginBottom: 10}}>
                <label style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--accent-cyan)'}}>
                  Government ID (Aadhar / PAN / Voter ID)
                </label>
              </div>

              <div className="doc-upload-area" onClick={() => govIdRef.current.click()}>
                {govIdPreview ? (
                  <img src={govIdPreview} alt="Govt ID" className="doc-preview-img" />
                ) : (
                  <div className="doc-placeholder">
                    <span style={{fontSize: 36}}>🪪</span>
                    <span>Click to upload ID proof</span>
                    <span style={{fontSize: 12, color: 'var(--text-secondary)'}}>JPG, PNG — max 5MB</span>
                  </div>
                )}
              </div>
              <input type="file" ref={govIdRef} accept="image/*" style={{ display: 'none' }}
                onChange={e => handleFileChange(e, 'governmentId', setGovIdPreview)} />
              {govIdPreview && (
                <button type="button" className="remove-photo-btn" style={{marginTop: 8}}
                  onClick={() => { setGovIdPreview(''); set('governmentId', ''); }}>✕ Remove ID</button>
              )}
            </div>
          </div>

          <div style={{
            background: 'rgba(0,212,232,0.06)', border: '1px solid rgba(0,212,232,0.2)',
            borderRadius: 10, padding: '12px 16px', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)',
          }}>
            🔒 Your documents are securely stored and only visible to SportConnect admins for verification purposes.
          </div>
        </div>

        <button type="submit" className={`save-btn ${saved ? 'saved' : ''}`} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Profile Saved!' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}