import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './AIRecommend.css';

const COLORS = ['#c8f230','#00d4e8','#ff6b6b','#a78bfa','#fbbf24','#34d399'];
function avatarColor(name) {
  let h = 0;
  for (let c of (name||'')) h = c.charCodeAt(0) + h * 31;
  return COLORS[Math.abs(h) % COLORS.length];
}
function initials(name) {
  return (name||'').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
}

function ScoreRing({ score }) {
  const color = score >= 75 ? '#c8f230' : score >= 50 ? '#ffa726' : '#ff4757';
  return (
    <div className="score-ring">
      <svg viewBox="0 0 44 44" className="score-svg">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#1e2535" strokeWidth="4"/>
        <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(score/100)*113} 113`}
          strokeLinecap="round" transform="rotate(-90 22 22)"/>
      </svg>
      <span className="score-num" style={{color}}>{score}</span>
    </div>
  );
}

export default function AIRecommend() {
  const navigate = useNavigate();
  const [step, setStep]     = useState('form'); // form | loading | results
  const [results, setResults] = useState(null);
  const [error, setError]   = useState('');

  const [form, setForm] = useState({
    sport: '', budget: '', experience: '0',
    location: '', sessionType: '', studentsLevel: '',
    frequency: 'Not sure yet', priority: 'Best value for money',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStep('loading');

    try {
      const res = await api.post('/ai/recommend', form);
      setResults(res.data);
      setStep('results');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'AI recommendation failed. Please try again.');
      setStep('form');
    }
  };

  const handleMessage = async (trainerId) => {
    try {
      const res = await api.get(`/messages/partner-info/${trainerId}`);
      navigate(`/messages/${res.data.userId}`);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div className="ai-badge">🤖 Powered by Claude AI</div>
        <h1>AI Trainer Recommendation</h1>
        <p>Tell us your requirements and our AI will find the best matching trainers from the database</p>
      </div>

      {/* ── FORM ── */}
      {step === 'form' && (
        <form className="ai-form" onSubmit={handleSubmit}>
          {error && <div className="ai-error">{error}</div>}

          <div className="ai-form-grid">
            <div className="form-group">
              <label>Sport Required *</label>
              <select value={form.sport} onChange={e => set('sport', e.target.value)} required>
                <option value="">Select sport...</option>
                {['Cricket','Football','Hockey','Basketball','Tennis','Volleyball','Athletics','Badminton','Kabaddi'].map(s=>(
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Budget (RS/hr) *</label>
              <select value={form.budget} onChange={e => set('budget', e.target.value)} required>
                <option value="">Select budget...</option>
                <option value="500">Under RS.500/hr</option>
                <option value="1000">Under RS.1000/hr</option>
                <option value="2000">Under RS.2000/hr</option>
                <option value="99999">No limit</option>
              </select>
            </div>

            <div className="form-group">
              <label>Minimum Experience</label>
              <select value={form.experience} onChange={e => set('experience', e.target.value)}>
                <option value="0">Any experience</option>
                <option value="1">1+ years</option>
                <option value="3">3+ years</option>
                <option value="5">5+ years</option>
                <option value="10">10+ years</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location Preference</label>
              <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="e.g. Vizag, Hyderabad or leave blank" />
            </div>

            <div className="form-group">
              <label>Session Type *</label>
              <select value={form.sessionType} onChange={e => set('sessionType', e.target.value)} required>
                <option value="">Select type...</option>
                <option>Regular daily training</option>
                <option>Weekend sessions only</option>
                <option>Tournament preparation</option>
                <option>One-off coaching camp</option>
                <option>Weekly practice sessions</option>
              </select>
            </div>

            <div className="form-group">
              <label>Student Skill Level *</label>
              <select value={form.studentsLevel} onChange={e => set('studentsLevel', e.target.value)} required>
                <option value="">Select level...</option>
                <option>Complete beginners</option>
                <option>Intermediate players</option>
                <option>Advanced / competitive</option>
                <option>Mixed skill levels</option>
              </select>
            </div>

            <div className="form-group">
              <label>Training Frequency</label>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                <option>Not sure yet</option>
                <option>Daily (5-6 days/week)</option>
                <option>3 days per week</option>
                <option>Weekends only</option>
                <option>Once a week</option>
              </select>
            </div>

            <div className="form-group">
              <label>Top Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option>Best value for money</option>
                <option>Highest rated trainer</option>
                <option>Most experienced</option>
                <option>Closest location</option>
                <option>Certified trainer</option>
              </select>
            </div>
          </div>

          <button type="submit" className="ai-submit-btn">
            🤖 Get AI Recommendations →
          </button>
        </form>
      )}

      {/* ── LOADING ── */}
      {step === 'loading' && (
        <div className="ai-loading">
          <div className="ai-spinner">
            <div className="spinner-ring" />
            <div className="spinner-icon">🤖</div>
          </div>
          <h3>AI is analysing trainers...</h3>
          <p>Matching your requirements against all registered trainers</p>
          <div className="loading-steps">
            <div className="lstep done">✓ Loading trainer database</div>
            <div className="lstep done">✓ Processing your requirements</div>
            <div className="lstep active">⟳ Running AI matching algorithm</div>
            <div className="lstep">○ Generating recommendations</div>
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {step === 'results' && results && (
        <div className="ai-results">
          {/* AI Summary */}
          <div className="ai-summary-card">
            <div className="summary-icon">🤖</div>
            <div>
              <div className="summary-label">AI Summary</div>
              <div className="summary-text">{results.summary}</div>
            </div>
          </div>

          {results.recommendations.length === 0 ? (
            <div className="no-match">
              <div style={{fontSize:48,marginBottom:16}}>😕</div>
              <h3>No matching trainers found</h3>
              <p>No trainers registered yet that match your requirements.</p>
              <button className="btn-primary" onClick={() => setStep('form')}>
                Try Different Requirements
              </button>
            </div>
          ) : (
            <>
              <div className="results-header">
                <h2>Top {results.recommendations.length} Matches</h2>
                <button className="btn-outline retry-btn"
                  onClick={() => { setStep('form'); setResults(null); }}>
                  ← Change Requirements
                </button>
              </div>

              <div className="rec-cards">
                {results.recommendations.map((rec, idx) => (
                  <div className={`rec-card ${idx === 0 ? 'top-pick' : ''}`} key={rec.trainerId || idx}>
                    {idx === 0 && <div className="top-pick-badge">🏆 Best Match</div>}

                    <div className="rec-card-top">
                      {rec.trainerPhoto ? (
                        <img src={rec.trainerPhoto} alt={rec.name} className="rec-avatar-img" />
                      ) : (
                        <div className="rec-avatar-letter" style={{background: avatarColor(rec.name)}}>
                          {initials(rec.name)}
                        </div>
                      )}

                      <div className="rec-info">
                        <div className="rec-name">{rec.name}</div>
                        <div className="rec-sport">
                          {rec.trainerSports?.[0] || 'Coach'} · {rec.trainerExperience} yrs exp
                        </div>
                        <div className="rec-price">RS.{rec.trainerRate}/hr</div>
                      </div>

                      <ScoreRing score={rec.matchScore} />
                    </div>

                    {/* Highlights */}
                    {rec.highlights?.length > 0 && (
                      <div className="rec-highlights">
                        {rec.highlights.map((h, i) => (
                          <span key={i} className="highlight-tag">✓ {h}</span>
                        ))}
                      </div>
                    )}

                    {/* Why good fit */}
                    <div className="rec-why">
                      <div className="rec-section-label">Why this trainer?</div>
                      <p>{rec.whyGoodFit}</p>
                    </div>

                    {/* Concerns */}
                    {rec.concerns && rec.concerns !== 'None' && (
                      <div className="rec-concerns">
                        <div className="rec-section-label">⚠️ Consider</div>
                        <p>{rec.concerns}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="rec-actions">
                      <button className="btn-primary"
                        onClick={() => navigate(`/book/${rec.trainerId}`)}>
                        View & Book →
                      </button>
                      <button className="btn-outline"
                        onClick={() => handleMessage(rec.trainerId)}>
                        💬 Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}