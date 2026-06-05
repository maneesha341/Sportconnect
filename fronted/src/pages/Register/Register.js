import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import '../Login/auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'college' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Join SportConnect</h1>
        <p>Create your account to get started</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label>I am a...</label>
            <div className="role-toggle">
              <button type="button" className={`role-btn ${form.role === 'college' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role: 'college' })}>
                🏫 College Admin
              </button>
              <button type="button" className={`role-btn ${form.role === 'trainer' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role: 'trainer' })}>
                🏅 Trainer / Coach
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>{form.role === 'college' ? 'College Name' : 'Full Name'}</label>
            <input type="text" placeholder={form.role === 'college' ? 'Gayatri Vidya Parishad' : 'Rohith Kumar'}
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}