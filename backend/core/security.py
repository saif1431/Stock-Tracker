from datetime import datetime, timedelta
from typing import Optional
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
import bcrypt

from core.config import settings

# Configuration
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using bcrypt - handles long passwords safely"""
    try:
        # bcrypt has a 72-byte limit, so we truncate if necessary
        password_bytes = plain_password.encode()[:72]
        return bcrypt.checkpw(password_bytes, hashed_password.encode())
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt - handles long passwords safely"""
    try:
        # bcrypt has a 72-byte limit, so we truncate if necessary
        password_bytes = password.encode()[:72]
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode()
    except Exception as e:
        print(f"Password hashing error: {e}")
        raise

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
