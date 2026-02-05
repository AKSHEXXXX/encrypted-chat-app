import { useState } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';

export default function App() {
  // Initialize state from localStorage if available
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [error, setError] = useState('');

  const handleLogin = (userData, accessToken) => {
    try {
      if (!userData || !accessToken) {
        setError('Invalid login response');
        return;
      }
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', accessToken);

      setUser(userData);
      setToken(accessToken);
      setIsLoggedIn(true);
      setError('');
    } catch (e) {
      console.error('Login handler error:', e);
      setError('Login failed: ' + e.message);
    }
  };

  const handleLogout = () => {
    try {
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      setIsLoggedIn(false);
      setUser(null);
      setToken(null);
      setError('');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <div className="app">
      {error && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#e74c3c', color: 'white', padding: '10px', zIndex: 9999 }}>{error}</div>}
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : user && token ? (
        <ChatPage user={user} token={token} onLogout={handleLogout} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
            <h2>Loading...</h2>
            <p>Please wait while we initialize the app.</p>
          </div>
        </div>
      )}
    </div>
  );
}
