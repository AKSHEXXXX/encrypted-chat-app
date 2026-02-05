import { useState } from 'react';
import './LoginPage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8020';

export default function LoginPage({ onLogin }) {
  console.log('LoginPage mounted');
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error on input change
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Registration failed');
        return;
      }
      setError('');
      setTab('login');
      setFormData({ username: '', email: '', password: '' });
      alert('Registration successful! Please log in.');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Invalid credentials');
        return;
      }
      onLogin({ username: formData.username, user_id: data.user_id }, data.access_token);
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🔐 Encrypted Chat</h1>
        <div className="tabs">
          <button className={tab === 'login' ? 'tab active' : 'tab'} onClick={() => setTab('login')}>
            Login
          </button>
          <button className={tab === 'register' ? 'tab active' : 'tab'} onClick={() => setTab('register')}>
            Register
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
