import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [status, setStatus] = useState({
    backendHealth: 'checking...',
    backendCORS: 'checking...',
    appLoaded: 'yes',
    timestamp: new Date().toLocaleTimeString()
  });

  useEffect(() => {
    console.log('Debug page mounted, checking backend...');
    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8020';
    
    // Test backend health
    fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then(d => {
        console.log('Health check passed:', d);
        setStatus(prev => ({ ...prev, backendHealth: '✅ Responding' }));
      })
      .catch(e => {
        console.error('Health check failed:', e);
        setStatus(prev => ({ ...prev, backendHealth: '❌ ' + e.message }));
      });
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1>🔧 Debug Info</h1>
      <pre style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', overflow: 'auto' }}>
{`Frontend Status:
${JSON.stringify(status, null, 2)}

Environment:
- API Base: http://127.0.0.1:8020
- Frontend: http://localhost:5173
- Browser Console: Open with F12`}
      </pre>
      <p><a href="/">← Back to App</a></p>
    </div>
  );
}
