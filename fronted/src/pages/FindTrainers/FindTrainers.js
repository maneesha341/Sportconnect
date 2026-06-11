import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './FindTrainers.css';

const SPORTS  = ['All Sports','Cricket','Football','Hockey','Basketball','Tennis','Volleyball','Athletics','Badminton','Kabaddi'];
const COLORS  = ['#c8f230','#00d4e8','#ff6b6b','#a78bfa','#fbbf24','#34d399'];

function avatarColor(name) {
  let h = 0;
  for (let c of (name||'')) h = c.charCodeAt(0) + h * 31;
  return COLORS[Math.abs(h) % COLORS.length];
}
function getInitials(name) {
  return (name||'').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
}

function TrainerAvatar({ trainer, size = 64 }) {
  if (trainer.photo) {
    return <img src={trainer.photo} alt={trainer.name}
      style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />;
  }
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:avatarColor(trainer.name), color:'#000',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight:900, fontSize:size*0.35, flexShrink:0,
    }}>
      {getInitials(trainer.name)}
    </div>
  );
}

function MessageBtn({ trainer }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleMessage = async () => {
    if (!user) { navigate('/login'); return; }
    // Get trainer's userId then go to messages
    try {
      const res = await api.get(`/messages/partner-info/${trainer._id}`);
      navigate(`/messages/${res.data.userId}`);
    } catch (e) {
      console.error(e);
    }
  };

  if (user?.role === 'trainer') return null; // trainers don't message each other from here

  return (
    <button className="msg-trainer-btn" onClick={handleMessage}>
      💬 Message
    </button>
  );
}

export default function FindTrainers() {
  const [trainers, setTrainers] = useState([]);
  const [search, setSearch]     = useState('');
  const [sport, setSport]       = useState('All Sports');
  const [rating, setRating]     = useState('All');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const params = {};
        if (sport !== 'All Sports') params.sport = sport;
        if (search) params.search = search;
        const res = await api.get('/trainers', { params });
        setTrainers(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, sport]);

  const filtered = trainers.filter(t => {
    if (rating === '4+')   return t.rating >= 4;
    if (rating === '4.5+') return t.rating >= 4.5;
    return true;
  });

  return (
    <div className="find-page">
      <div className="find-header">
        <h1>Find Trainers</h1>
        
      </div>

      <div className="filters-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input placeholder="Search name, sport, city..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={sport} onChange={e => setSport(e.target.value)}>
          {SPORTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="filter-select">
          <option>Any availability</option>
          <option>Available</option>
          <option>Busy</option>
        </select>
        <div className="rating-filters">
          {['All','4+','4.5+'].map(r => (
            <button key={r} className={`rating-btn ${rating===r?'active':''}`} onClick={() => setRating(r)}>
              {r==='All'?'All':`${r}★`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="no-results">Loading trainers...</div>
      ) : filtered.length === 0 ? (
        <div className="no-results">No trainers found. Register as a trainer first!</div>
      ) : (
        <div className="trainers-grid">
          {filtered.map(trainer => (
            <div className="trainer-card" key={trainer._id}>
              <span className="avail-badge">Available</span>
              <TrainerAvatar trainer={trainer} size={64} />
              <div className="trainer-name" style={{marginTop:14}}>{trainer.name}</div>
              <div className="trainer-sport-sub">{trainer.sports?.[0]||'Coach'} · {trainer.experience} yrs exp</div>
              <div className="trainer-rating">
                <span>
                  {[1,2,3,4,5].map(i=>(
                    <span key={i} style={{color:i<=Math.round(trainer.rating)?'#f59e0b':'#374151'}}>★</span>
                  ))}
                </span>
                <span>{trainer.rating?.toFixed(1)} ({trainer.totalSessions} sessions)</span>
              </div>
              <div className="trainer-meta">
                {trainer.location && <span>📍 {trainer.location}</span>}
                {trainer.certifications?.[0] && <span>🏅 {trainer.certifications[0]}</span>}
              </div>
              <div className="trainer-card-footer">
                <div className="trainer-price">RS.{trainer.hourlyRate}<span>/hr</span></div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
                  <MessageBtn trainer={trainer} />
                  <Link to={`/book/${trainer._id}`}>
                    <button className="btn-primary">View & Book</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}