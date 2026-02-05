from datetime import datetime, timedelta
from typing import Optional
import os
import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Use pbkdf2_sha256 to avoid bcrypt native-extension issues in some environments
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(*, subject: str, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = {"sub": subject}
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None


# --- Database helpers (lightweight, used by app endpoints) ---
from typing import Optional as _Opt
from sqlalchemy.orm import Session
try:
    # Preferred: relative import when this file is part of a package
    from .database import User
except Exception:
    # Fallback: allow running as a script where package-style imports may not work
    from database import User


def get_user(db: Session, username: str) -> _Opt[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int) -> _Opt[User]:
    return db.query(User).filter(User.id == int(user_id)).first()


def create_user(db: Session, username: str, email: str, password: str) -> User:
    hashed = get_password_hash(password)
    user = User(username=username, email=email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> _Opt[User]:
    user = get_user(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
