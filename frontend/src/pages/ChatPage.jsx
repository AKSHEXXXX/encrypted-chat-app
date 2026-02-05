import { useState, useEffect, useRef } from 'react';
import ClientEncryptionManager from '../utils/encryption';
import './ChatPage.css';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8020';
const SECRET_KEY = 'change-me'; // Must match backend SECRET_KEY in .env

export default function ChatPage({ user, token, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [room, setRoom] = useState('general');
  const [activeRoomState, setActiveRoomState] = useState('general'); // Track the actual connected room
  const [customRoom, setCustomRoom] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const wsRef = useRef(null);
  const encryptionRef = useRef(null);
  const isMountedRef = useRef(true);

  // Initialize encryption manager safely
  useEffect(() => {
    try {
      encryptionRef.current = new ClientEncryptionManager(SECRET_KEY);
    } catch (e) {
      console.error('Failed to init encryption:', e);
      setError('Encryption manager failed to initialize');
    }
  }, []);

  // Connect to WebSocket when activeRoomState or token changes
  useEffect(() => {
    // Safety checks
    if (!isMountedRef.current) return;
    if (!token) {
      setError('No authentication token available');
      return;
    }
    if (!user?.user_id) {
      setError('User ID not available');
      return;
    }

    setMessages([]);
    setError('');

    // Load message history first
    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8020';
    fetch(`${API_BASE}/api/messages/${activeRoomState}`)
      .then(res => res.json())
      .then(history => {
        if (!isMountedRef.current) return;
        const decryptedHistory = history.map(msg => {
          try {
            const decrypted = encryptionRef.current.decrypt(msg.encrypted_content);
            return {
              sender_id: msg.sender_id,
              text: decrypted,
              timestamp: msg.created_at,
              isOwn: msg.sender_id === user.user_id
            };
          } catch (e) {
            console.error('Failed to decrypt history message:', e);
            return null;
          }
        }).filter(m => m !== null);
        setMessages(decryptedHistory);
        console.log(`Loaded ${decryptedHistory.length} messages from history`);
      })
      .catch(err => {
        console.error('Failed to load message history:', err);
      });

    let ws = null;

    const connectWS = () => {
      try {
        const wsUrl = `${WS_BASE}/ws/${activeRoomState}?token=${token}`;
        console.log('Attempting WebSocket connection to:', wsUrl);
        setDebugInfo(`Connecting to room: ${activeRoomState}`);

        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          console.log('WebSocket connected to room:', activeRoomState);
          setConnected(true);
          setError('');
          setDebugInfo(`Connected to #${activeRoomState}`);
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);

            if (!encryptionRef.current) {
              throw new Error('Encryption manager not initialized');
            }

            let decrypted;
            try {
              decrypted = encryptionRef.current.decrypt(data.encrypted_content);
            } catch (decryptErr) {
              console.error('Decryption failed:', decryptErr);
              decrypted = '[Decryption failed]';
            }

            setMessages(prev => [...prev, {
              sender_id: data.sender_id,
              content: decrypted,
              is_self: data.sender_id === user?.user_id,
              timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
            }]);
          } catch (e) {
            console.error('Failed to process message:', e);
            setError('Failed to process incoming message: ' + e.message);
          }
        };

        ws.onerror = (e) => {
          if (!isMountedRef.current) return;
          console.error('WebSocket error:', e);
          setConnected(false);
          setError('WebSocket connection error occurred');
          setDebugInfo('WebSocket error: ' + (e?.message || 'Unknown error'));
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          console.log('WebSocket closed');
          setConnected(false);
          setDebugInfo('Disconnected from room');
        };
      } catch (e) {
        if (!isMountedRef.current) return;
        console.error('WebSocket connection error:', e);
        setError('Failed to connect to chat: ' + e.message);
        setDebugInfo('Connection error: ' + e.message);
      }
    };

    connectWS();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [token, activeRoomState, user?.user_id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) {
      setError('Cannot send empty message');
      return;
    }

    if (!connected || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket not connected. Please wait...');
      return;
    }

    if (!encryptionRef.current) {
      setError('Encryption manager not ready');
      return;
    }

    try {
      const encrypted = encryptionRef.current.encrypt(messageText);
      wsRef.current.send(encrypted);
      setMessageText('');
      setError('');
    } catch (e) {
      console.error('Send error:', e);
      setError('Failed to send message: ' + e.message);
    }
  };

  const handleRoomChange = (newRoom) => {
    setCustomRoom('');
    setRoom(newRoom);
    setActiveRoomState(newRoom);
  };

  const handleCustomRoomSubmit = (e) => {
    e.preventDefault();
    const trimmed = customRoom?.trim();
    if (trimmed && trimmed.length > 0) {
      setRoom(trimmed);
      setActiveRoomState(trimmed);
      setCustomRoom('');
    }
  };

  // Safe property access
  const username = user?.username || 'User';
  const userInitial = username ? username[0].toUpperCase() : '?';
  const activeRoom = activeRoomState;

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="user-info">
          <div className="user-avatar">{userInitial}</div>
          <div className="user-details">
            <div className="username">{username}</div>
            <div className={`status ${connected ? 'online' : 'offline'}`}>
              {connected ? '●' : '○'}
            </div>
          </div>
        </div>

        <div className="room-selector">
          <button
            className={room === 'general' && !customRoom ? 'room-btn active' : 'room-btn'}
            onClick={() => handleRoomChange('general')}
          >
            # general
          </button>
          <button
            className={room === 'random' && !customRoom ? 'room-btn active' : 'room-btn'}
            onClick={() => handleRoomChange('random')}
          >
            # random
          </button>

          <form onSubmit={handleCustomRoomSubmit} className="custom-room-form">
            <input
              type="text"
              placeholder="Join room..."
              value={customRoom}
              onChange={(e) => setCustomRoom(e.target.value)}
            />
            <button type="submit">→</button>
          </form>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <h2>#{activeRoom}</h2>
          <div className="header-info">
            <span className={`badge ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? '●' : '○'}
            </span>
          </div>
        </div>

        {error && <div className="chat-error">{error}</div>}
        {/* Debug info hidden for aesthetics */}

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              {/* Emoji removed as requested */}
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.is_self ? 'self' : 'other'}`}>
                <div className="message-content">{msg.content}</div>
                <div className="message-time">{msg.timestamp}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            placeholder="Type a message (encrypted end-to-end)..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={!connected}
          />
          <button type="submit" disabled={!connected}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
