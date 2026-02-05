from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, List
import json
import os
from datetime import datetime

from database import get_db, User, Message, SessionLocal
import auth as auth_lib

app = FastAPI(title="Encrypted Chat API")

# Enable CORS for frontend
# In production, set FRONTEND_URL environment variable to your Netlify URL
allowed_origins = os.getenv("FRONTEND_URL", "*").split(",")
if allowed_origins == ["*"]:
    # Development mode - allow localhost on any port
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # check existing username/email
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user = auth_lib.create_user(db, payload.username, payload.email, payload.password)
    return {"id": user.id, "username": user.username, "email": user.email}


@app.post("/api/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = auth_lib.authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = auth_lib.create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer", "user_id": user.id}


class ConnectionManager:
    def __init__(self):
        # room -> list of websockets
        self.active: Dict[str, List[WebSocket]] = {}
        self.ws_meta: Dict[WebSocket, Dict] = {}

    async def connect(self, websocket: WebSocket, room: str, user_id: int):
        await websocket.accept()
        self.active.setdefault(room, []).append(websocket)
        self.ws_meta[websocket] = {"room": room, "user_id": user_id}

    def disconnect(self, websocket: WebSocket):
        meta = self.ws_meta.get(websocket)
        if not meta:
            return
        room = meta["room"]
        if room in self.active and websocket in self.active[room]:
            self.active[room].remove(websocket)
        del self.ws_meta[websocket]

    async def broadcast(self, room: str, message: str):
        conns = list(self.active.get(room, []))
        for ws in conns:
            try:
                await ws.send_text(message)
            except Exception:
                # ignore individual send errors
                pass


manager = ConnectionManager()


@app.websocket("/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str, token: str = Query(None)):
    # token must be provided as query param: ?token=...
    print(f"[WS] New connection attempt to room: {room}")
    if token is None:
        print("[WS] Rejected: No token provided")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    user_id = auth_lib.decode_token(token)
    if not user_id:
        print("[WS] Rejected: Invalid token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # validate user exists
    db = SessionLocal()
    try:
        user = auth_lib.get_user_by_id(db, int(user_id))
    except Exception as e:
        print(f"[WS] Error getting user: {e}")
        db.close()
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    finally:
        db.close()
    if not user:
        print(f"[WS] Rejected: User {user_id} not found in database")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    print(f"[WS] User {user.username} (ID: {user.id}) connecting to room: {room}")
    await manager.connect(websocket, room, user.id)
    print(f"[WS] Connection established for {user.username}")
    try:
        while True:
            data = await websocket.receive_text()
            print(f"[WS] Received message from {user.username}: {data[:50]}...")
            # data is expected to be an encrypted string payload (opaque to server)
            # persist message to DB and broadcast to room
            db = SessionLocal()
            try:
                msg = Message(sender_id=user.id, room=room, encrypted_content=data)
                db.add(msg)
                db.commit()
                db.refresh(msg)
            except Exception as e:
                print(f"[WS] Error saving message: {e}")
            finally:
                db.close()

            # broadcast the same encrypted payload along with sender id and timestamp
            payload = json.dumps({
                "sender_id": user.id,
                "room": room,
                "encrypted_content": data,
                "created_at": datetime.utcnow().isoformat()
            })
            await manager.broadcast(room, payload)
    except WebSocketDisconnect:
        print(f"[WS] {user.username} disconnected from {room}")
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS] Unexpected error for {user.username}: {e}")
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
