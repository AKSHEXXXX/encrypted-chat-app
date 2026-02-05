# Encrypted Chat App — Setup & Run Guide

## ✅ Status: Both servers running and ready!

- **Backend**: http://127.0.0.1:8020 ✓
- **Frontend**: http://localhost:5173 ✓

---

## 🚀 Quick Start (If servers not running)

### Start Backend
```bash
cd /Users/akshatsaxena/Desktop/encrypted-chat-app/backend
/Users/akshatsaxena/Desktop/spring/message/.venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8020
```

### Start Frontend
```bash
cd /Users/akshatsaxena/Desktop/encrypted-chat-app/frontend
npm run dev
```

---

## 📖 How to Use

1. **Open browser**: Go to **http://localhost:5173**
2. **Register new user**:
   - Click "Register" tab
   - Enter username, email, password
   - Click "Register"
3. **Login**:
   - Enter credentials
   - Click "Login"
4. **Chat**:
   - Select a room (#general, #random, or create custom)
   - Type messages and send
   - All messages are encrypted client-side before sending
   - Connect another user in the same room to see real-time messaging

---

## 🔧 What We Fixed

### Backend (app.py)
- ✅ Added CORS middleware to allow frontend requests
- ✅ Endpoints: `/api/register`, `/api/login`, `/ws/{room}?token={token}`
- ✅ JWT authentication on WebSocket connections
- ✅ Encrypted message storage in SQLite

### Frontend (ChatPage.jsx)
- ✅ Optional chaining (`user?.username`, `user?.user_id`)
- ✅ Safe null/undefined checks before accessing properties
- ✅ Try-catch blocks around encryption/decryption
- ✅ Component lifecycle checks to prevent state updates after unmount
- ✅ WebSocket state validation before sending messages
- ✅ Detailed error messages and debug info display
- ✅ Graceful error handling for network issues

### Frontend (LoginPage.jsx)
- ✅ Error message display on registration/login failure
- ✅ Network error handling with user-friendly messages
- ✅ Clear error on input change for better UX

---

## 🐛 Common Issues & Solutions

### **White screen on http://localhost:5173**
- ✅ **Fixed**: Added error handling throughout ChatPage
- Check browser console (F12) for error messages
- Look for blue debug info bar under header showing connection status

### **"{{ no details }}" on backend**
- ✅ **Fixed**: This was a browser rendering artifact
- Backend now returns proper JSON with CORS headers

### **WebSocket not connecting**
- ✅ Verify backend is running on http://127.0.0.1:8020
- ✅ Check browser console for connection errors
- ✅ Ensure valid JWT token is being used from login

### **Messages not appearing**
- ✅ Check connection status (green dot = connected, red = disconnected)
- ✅ Open another browser tab/window with different user to test messaging
- ✅ Check that SECRET_KEY matches in backend (.env) and frontend (ChatPage.jsx)

---

## 📊 Architecture Overview

```
Frontend (React + Vite)
    ↓
    └─→ Login Form
         ↓
         POST /api/login
         ↓ (receive JWT token)
    ↓
    └─→ Chat Page
         ↓
         WS /ws/{room}?token={JWT}
         ↓
         Encrypt message client-side (AES-256)
         ↓ Send encrypted payload
         
Backend (FastAPI)
    ↓
    └─→ /api/login → Generate JWT token
    ↓
    └─→ /ws/{room}?token={JWT}
         ↓
         Validate JWT
         ↓
         Receive encrypted payload
         ↓
         Store in DB (encrypted)
         ↓
         Broadcast to all users in room
         ↓
         Front-end receives and decrypts
```

---

## 🔐 Security Notes

**Current (Demo)**:
- Shared SECRET_KEY for all users (symmetric encryption)
- Server can see encrypted messages (blind to content but can pattern match)

**For Production**:
1. Implement ECDH key exchange for per-user pair keys
2. Use HTTPS/WSS for all connections
3. Rotate SECRET_KEY regularly
4. Add rate limiting and request validation
5. Store messages in PostgreSQL instead of SQLite
6. Implement proper logging and monitoring

---

## 🛠️ Development Details

### Backend Dependencies
- FastAPI, uvicorn, SQLAlchemy, cryptography, passlib, PyJWT

### Frontend Dependencies
- React, Vite, crypto-js

### Database
- SQLite (`chat.db`) with `users` and `messages` tables
- Auto-created on first run

---

## 📝 Test Users

After running:
```bash
# Register test users via API:
curl -X POST http://127.0.0.1:8020/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@test.com","password":"test123"}'

curl -X POST http://127.0.0.1:8020/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","email":"bob@test.com","password":"test123"}'
```

Then login with those credentials in the UI.

---

## 📞 Troubleshooting

**Still seeing white screen?**
1. Open browser DevTools: F12
2. Check Console tab for JavaScript errors
3. Check Network tab to see if requests to http://127.0.0.1:8020 are working
4. Look for blue debug info bar on page (shows connection status)

**Backend won't start?**
```bash
# Check if port 8020 is in use:
lsof -i :8020

# Kill it if needed:
pkill -f "uvicorn app:app"

# Restart:
/Users/akshatsaxena/Desktop/spring/message/.venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8020
```

**Frontend won't load?**
```bash
# Check if Node is running Vite:
ps aux | grep vite

# Restart:
cd /Users/akshatsaxena/Desktop/encrypted-chat-app/frontend
npm run dev
```

---

## 🎯 Next Steps

1. ✅ **Try it now**: Open http://localhost:5173
2. ✅ **Register**: Create a test account
3. ✅ **Chat**: Open in 2 browser tabs with different users
4. ✅ **Verify**: Messages encrypt before sending, decrypt after receiving

Enjoy your encrypted chat app! 🎉
