"""
Auth service — demo implementation using in-memory stores.

IMPORTANT: No hashing happens at module import time.
The demo user's password is hashed lazily on first access via _ensure_seeded().
"""
import random
import string
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# ── Password hashing ──────────────────────────────────────────────────────────

_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Hash a plaintext password with bcrypt. Call only at request time."""
    return _pwd_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return _pwd_ctx.verify(plain, hashed)


# ── In-memory user store ──────────────────────────────────────────────────────
# Populated lazily by _ensure_seeded() — NO hashing at import time.

_USERS: dict[str, dict] = {}
_SEEDED = False


def _ensure_seeded() -> None:
    """
    Seed the demo user on first call.
    Hashing happens here (at request time), never at import time.
    """
    global _SEEDED
    if _SEEDED:
        return
    _SEEDED = True
    _USERS["shahil@gmail.com"] = {
        "id": "usr_demo",
        "email": "shahil@gmail.com",
        "name": "Shahil",
        "hashed_password": hash_password("shahil98"),
    }


# ── In-memory OTP store  {email: (otp, expires_at)} ──────────────────────────

_OTP_STORE: dict[str, tuple[str, datetime]] = {}

OTP_TTL_SECONDS = 300  # 5 minutes


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Raises JWTError on invalid / expired token."""
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


# ── Public API ────────────────────────────────────────────────────────────────

def login(email: str, password: str) -> dict | None:
    """Returns user dict on success, None on failure."""
    _ensure_seeded()
    user = _USERS.get(email.lower())
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


def send_otp(email: str) -> str:
    """Generates and stores an OTP. Returns the OTP (caller should email it)."""
    _ensure_seeded()
    otp = _generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(seconds=OTP_TTL_SECONDS)
    _OTP_STORE[email.lower()] = (otp, expires)
    # Auto-register unknown emails on first OTP request
    if email.lower() not in _USERS:
        _USERS[email.lower()] = {
            "id": f"usr_{uuid.uuid4().hex[:8]}",
            "email": email.lower(),
            "name": email.split("@")[0].capitalize(),
            "hashed_password": hash_password(uuid.uuid4().hex),
        }
    return otp


def verify_otp(email: str, otp: str) -> dict | None:
    """Returns user dict if OTP is valid and not expired, else None."""
    _ensure_seeded()
    entry = _OTP_STORE.get(email.lower())
    if not entry:
        return None
    stored_otp, expires = entry
    if datetime.now(timezone.utc) > expires:
        del _OTP_STORE[email.lower()]
        return None
    if stored_otp != otp:
        return None
    del _OTP_STORE[email.lower()]
    return _USERS.get(email.lower())


def get_user_by_id(user_id: str) -> dict | None:
    _ensure_seeded()
    for u in _USERS.values():
        if u["id"] == user_id:
            return u
    return None


def update_profile(user_id: str, name: str) -> dict | None:
    user = get_user_by_id(user_id)
    if not user:
        return None
    user["name"] = name
    return user


def change_password(user_id: str, current_password: str, new_password: str) -> bool:
    user = get_user_by_id(user_id)
    if not user:
        return False
    if not verify_password(current_password, user["hashed_password"]):
        return False
    user["hashed_password"] = hash_password(new_password)
    return True
