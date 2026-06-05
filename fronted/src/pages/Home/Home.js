import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const FEATURES = [
  { icon: '🤖', title: 'AI Matching', desc: 'Smart recommendations based on sport, location, budget and past ratings — automatically curated.', tag: 'f-ai', label: 'Powered by AI', action: 'ai' },
  { icon: '✅', title: 'Verified Coaches', desc: 'Every trainer is background-checked. NIS, SAI and state certifications validated before listing.', tag: 'f-trust', label: 'Trust & Safety', action: 'verified' },
  { icon: '📅', title: 'Instant Booking', desc: 'Browse real-time availability. Book one-off sessions or recurring weekly slots in seconds.', tag: 'f-realtime', label: 'Real-time', action: 'booking' },
  { icon: '📊', title: 'Progress Reports', desc: "Trainers submit post-session performance notes. Track your students' development over time.", tag: 'f-report', label: 'Analytics', action: 'reports' },
  { icon: '💬', title: 'Direct Messaging', desc: 'Real-time chat between coordinators and trainers. Everything organised in one place.', tag: 'f-chat', label: 'Messaging', action: 'messaging' },
  { icon: '💳', title: 'Secure Payments', desc: 'Pay via Razorpay. Automatic GST invoices sent to your college email after every session.', tag: 'f-payment', label: 'Payments', action: 'payments' },
];

const MODAL_CONTENT = {
  ai:       { title: 'AI Matching',       icon: '🤖', steps: [{ icon: '🏫', text: 'College registers and selects their sport' }, { icon: '📍', text: 'AI filters trainers by location, budget, availability and sport' }, { icon: '⭐', text: 'Trainers ranked by rating and sessions completed' }, { icon: '✅', text: 'Top matches shown first on Find Trainers page' }], cta: 'Find Trainers Now', ctaLink: '/find-trainers' },
  verified: { title: 'Verified Coaches',  icon: '✅', steps: [{ icon: '📝', text: 'Trainer registers and fills profile with certifications' }, { icon: '🏅', text: 'Certifications like SAI, NIS, State Level listed on card' }, { icon: '🔍', text: 'Colleges see all credentials before booking' }, { icon: '💬', text: 'Reviews from other colleges build trust over time' }], cta: 'Browse Verified Trainers', ctaLink: '/find-trainers' },
  booking:  { title: 'Instant Booking',   icon: '📅', steps: [{ icon: '🔍', text: 'Browse trainers and click View & Book' }, { icon: '📅', text: 'Trainer adds available slots — you pick one' }, { icon: '✉️', text: 'Send a message with your booking request' }, { icon: '✅', text: 'Trainer confirms and booking shows in dashboard' }], cta: 'Book a Trainer', ctaLink: '/find-trainers' },
  reports:  { title: 'Progress Reports',  icon: '📊', steps: [{ icon: '🏁', text: 'Trainer marks session as Completed' }, { icon: '📝', text: 'Trainer writes detailed performance report' }, { icon: '📊', text: 'College views report from dashboard' }, { icon: '⭐', text: 'College leaves star rating and review' }], cta: 'Go to Dashboard', ctaLink: '/dashboard' },
  messaging:{ title: 'Direct Messaging',  icon: '💬', steps: [{ icon: '🏫', text: 'College sends a message when booking' }, { icon: '👀', text: 'Trainer sees message on their dashboard' }, { icon: '✅', text: 'Trainer confirms or declines' }, { icon: '📋', text: 'All communication stored with booking' }], cta: 'Register to Message', ctaLink: '/register' },
  payments: { title: 'Secure Payments',   icon: '💳', steps: [{ icon: '💰', text: 'Each trainer sets their own hourly rate' }, { icon: '👁️', text: 'Colleges see rate clearly before booking' }, { icon: '🔒', text: 'Payments processed securely via Razorpay' }, { icon: '🧾', text: 'GST invoice sent to college email' }], cta: 'View Trainer Rates', ctaLink: '/find-trainers' },
};

const SPORTS = [
  { name: 'Cricket',    emoji: '🏏' },
  { name: 'Football',   emoji: '⚽' },
  { name: 'Badminton',  emoji: '🏸' },
  { name: 'Athletics',  emoji: '🏃' },
  { name: 'Volleyball', emoji: '🏐' },
  { name: 'Basketball', emoji: '🏀' },
  { name: 'Tennis',     emoji: '🎾' },
  { name: 'Swimming',   emoji: '🏊' },
  { name: 'Boxing',     emoji: '🥊' },
  { name: 'Gymnastics', emoji: '🤸' },
  { name: 'Hockey',     emoji: '🏑' },
  { name: 'Kabaddi',    emoji: '🤼' },
];

const STEPS = [
  { num: '01', icon: '🏫', title: 'Register Your College', desc: 'Create a free account as a college coordinator. Verify your institution in under 2 minutes.' },
  { num: '02', icon: '🔍', title: 'Find & Book a Trainer', desc: 'Filter by sport, city, rating and price. View real-time slots and confirm your booking instantly.' },
  { num: '03', icon: '🏆', title: 'Train & Track Progress', desc: 'Attend sessions, receive performance reports, rate your trainer and book again from one dashboard.' },
];

function FeatureModal({ feature, onClose }) {
  const navigate = useNavigate();
  const content = MODAL_CONTENT[feature.action];
  return (
    <div className="feature-modal-overlay" onClick={onClose}>
      <div className="feature-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="fmodal-icon">{content.icon}</div>
        <h2 className="fmodal-title">{content.title}</h2>
        <div className="fmodal-steps">
          {content.steps.map((step, i) => (
            <div className="fmodal-step" key={i}>
              <div className="step-num">{i + 1}</div>
              <div className="step-icon">{step.icon}</div>
              <div className="step-text">{step.text}</div>
            </div>
          ))}
        </div>
        <button className="btn-primary fmodal-cta"
          onClick={() => { onClose(); navigate(content.ctaLink); }}>
          {content.cta} →
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);

  return (
    <div>
      {activeModal && <FeatureModal feature={activeModal} onClose={() => setActiveModal(null)} />}

      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="hero-glow" />
        <div className="hero-badge"><span className="live-dot" />Live across 12+ sports</div>
        <h1 className="hero-title">
          Book the Best<br />
          <span className="accent-word">Trainers</span><br />
          For Your College
        </h1>
        <p className="hero-subtitle">
          Connect your college with certified, background-verified sports coaches — on demand. No full-time salary, just elite training.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link to="/dashboard"><button className="btn-primary">Go to Dashboard →</button></Link>
          ) : (
            <Link to="/register"><button className="btn-primary">Get Started →</button></Link>
          )}
          <Link to="/find-trainers"><button className="btn-outline">Find Trainers</button></Link>
        </div>
      </section>

      {/* ── Sports Grid ── */}
      <section className="sports-section">
        <h2 className="sports-title">12 Sports,<br />1 Platform</h2>
        <div className="sports-grid">
          {SPORTS.map(s => (
            <button
              key={s.name}
              className="sport-pill"
              onClick={() => navigate(`/find-trainers?sport=${s.name}`)}
            >
              <span>{s.emoji}</span> {s.name}
            </button>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-section">
        <div className="how-label">How It Works</div>
        <h2 className="how-title">Three Steps<br />to Elite Training</h2>
        <div className="steps-grid">
          {STEPS.map((step, i) => (
            <div className="step-card" key={i}>
              <div className="step-big-num">{step.num}</div>
              <div className="step-card-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <div className="features-header">
          <h2>Built for<br />College Sports</h2>
          <p>No contracts, no hassle. Find, book and manage the best coaches in minutes.</p>
          <p className="features-hint">👆 Click any feature to learn how it works</p>
        </div>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div className="feature-card clickable" key={f.title} onClick={() => setActiveModal(f)}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="feature-card-footer">
                <span className={`feature-tag ${f.tag}`}>{f.label}</span>
                <span className="feature-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="stat-item"><div className="stat-big">12+</div><div className="stat-desc">Sports Covered</div></div>
        <div className="stat-divider" />
        <div className="stat-item"><div className="stat-big">100%</div><div className="stat-desc">Verified Trainers</div></div>
        <div className="stat-divider" />
        <div className="stat-item"><div className="stat-big">Free</div><div className="stat-desc">To Register</div></div>
        <div className="stat-divider" />
        <div className="stat-item"><div className="stat-big">Instant</div><div className="stat-desc">Booking Confirmation</div></div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <h2>Ready to Level Up?</h2>
        <p>Join 230+ colleges already building stronger sports programs with SportConnect.</p>
        <Link to={user ? '/dashboard' : '/register'}>
          <button className="cta-btn">
            {user ? 'Go to Dashboard →' : 'Create Free Account →'}
          </button>
        </Link>
      </section>

    </div>
  );
}