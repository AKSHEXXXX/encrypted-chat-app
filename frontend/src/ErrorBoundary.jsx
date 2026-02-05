import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            maxWidth: '500px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h1 style={{ color: '#e74c3c', marginBottom: '20px' }}>⚠️ Something went wrong</h1>
            <p style={{ color: '#555', marginBottom: '15px', fontFamily: 'monospace', fontSize: '12px', textAlign: 'left', background: '#f5f5f5', padding: '10px', borderRadius: '6px', overflowX: 'auto' }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                padding: '10px 20px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Reload Page
            </button>
            <p style={{ marginTop: '15px', color: '#999', fontSize: '12px' }}>
              Check browser console (F12) for more details
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
