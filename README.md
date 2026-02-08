# Encrypted Chat App (Real-time E2E Encrypted Chat)

This workspace contains a **real-time encrypted chat application** with JWT authentication, WebSocket messaging, and client-side AES encryption.

## Architecture

- **Backend**: FastAPI with WebSocket support, JWT auth, encrypted message storage
- **Frontend**: React (Vite) with client-side encryption/decryption
- **Database**: SQLite (local dev) with encrypted message persistence
- **Encryption**: Client-side AES-256 + Server-side storage (demo; production should use ECDH)

## Folders

```
backend/        - FastAPI app, auth, encryption, DB models
frontend/       - Vite + React chat UI with client-side encryption
requirements.txt (backend dependencies)
package.json (frontend dependencies)
```

---

## Quick Start

### Backend Setup

```bash
cd backend

# Create and activate virtualenv
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create/update .env (optional; defaults provided)
cat > .env << 'EOF'
SECRET_KEY=your-secret-key-change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./chat.db
EOF

# Run the backend
python -m uvicorn app:app --host 127.0.0.1 --port 8020
```

Backend will start on **http://127.0.0.1:8020**

**Health check**: `curl http://127.0.0.1:8020/api/health`

### Frontend Setup

In a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend will start on **http://localhost:5173** (or next available port if busy)

---

## Usage

1. Open **http://localhost:5173** (or the port shown in dev terminal)
2. **Register** with a username, email, and password
3. **Login** with your credentials (receive JWT token)
4. **Join a room** (default: #general, #random, or custom name)
5. **Type and send messages** — automatically encrypted client-side before transmission
6. **All connected users in the room see encrypted/decrypted messages in real-time**

---

## API Endpoints

### Registration
```bash
POST /api/register
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secret"
}
```

### Login
```bash
POST /api/login
Content-Type: application/json

{
  "username": "alice",
  "password": "secret"
}

Response:
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_id": 1
}
```

### WebSocket
```
WS /ws/{room}?token={access_token}

Send: (encrypted message as string)
Receive: JSON { "sender_id", "room", "encrypted_content", "created_at" }
```

---

## Key Features

✅ **JWT Authentication** — Login returns time-limited JWT token  
✅ **WebSocket Real-Time Chat** — Messages broadcast to all users in a room  
✅ **Client-Side Encryption** — AES-256 encryption before sending (demo uses shared secret)  
✅ **Encrypted Storage** — All messages stored encrypted in SQLite  
✅ **Multi-Room Support** — Join #general, #random, or create custom rooms  
✅ **User Status** — Online/offline indicator  

---

## Development Notes

### Encryption Model (Demo)
Currently uses **shared symmetric key** (demo-only). For real E2E encryption:
- Implement **ECDH key exchange** on first connection
- Store public keys per user
- Derive per-conversation session keys
- Server remains blind to message content

### Database
- **Users table**: username, email, hashed_password, is_active, created_at
- **Messages table**: sender_id, room, encrypted_content, created_at
- Auto-created on first run via SQLAlchemy

### Environment
- Backend: Python 3.9+, FastAPI, SQLAlchemy, passlib, PyJWT
- Frontend: Node.js 16+, React 18, Vite, crypto-js

---

## Testing

### Curl test for registration & login:
```bash
# Register
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"pass123"}' \
  http://127.0.0.1:8020/api/register

# Login
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass123"}' \
  http://127.0.0.1:8020/api/login
```

### WebSocket test:
See `backend/test_ws.py` (can be created as part of testing suite) to test WebSocket message flow.

---

## Troubleshooting

**Backend won't start:**
- Ensure port 8020 is free: `lsof -i :8020`
- Check `.venv` is activated and dependencies installed: `pip list | grep fastapi`

**Frontend won't load:**
- Ensure backend is running (check CORS in browser console)
- Clear browser cache and restart dev server

**Messages not encrypting/decrypting:**
- Ensure `SECRET_KEY` in backend `.env` matches the hardcoded key in frontend (`ChatPage.jsx`)
- Check browser console for encryption errors

---

## Production Deployment

### Render.com Deployment (Current Setup)

Your app is deployed at:
- **Backend**: https://chat-app-2d05.onrender.com
- **Frontend**: https://darling-begonia-b626a9.netlify.app

#### Render Environment Variables (Required)

Go to your Render dashboard → Your service → Environment:

```env
SECRET_KEY=your-secret-key-change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./chat.db
FRONTEND_URL=https://darling-begonia-b626a9.netlify.app
```

**Important**: After updating environment variables, Render will automatically redeploy your service.

#### Netlify Environment Variables (Required)

In your Netlify dashboard → Site settings → Environment variables:

```env
VITE_API_URL=https://chat-app-2d05.onrender.com
```

### General Production Checklist

Before deploying:

1. **Change `SECRET_KEY`** in backend `.env` to a strong random string
2. **Implement real E2E encryption** (ECDH key exchange) instead of shared secret
3. **Use production database** (PostgreSQL recommended)
4. **Enable HTTPS/WSS** for all endpoints
5. **Add rate limiting, CORS headers, and request validation**
6. **Deploy backend** to a server (e.g., AWS EC2, Heroku, Railway, Render)
7. **Build and deploy frontend** (e.g., Vercel, Netlify): `npm run build`
8. **Update frontend API base URL** to production backend URL

---

## License

MIT (demo project for educational purposes)


