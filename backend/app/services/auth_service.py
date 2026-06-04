"""
Auth service — backed by Supabase PostgreSQL.

Uses supabase-py v2 to query the `users` table.
OTP store remains in-memory (no database needed for short-lived codes).
JWT helpers are unchanged.
"""
import random
import string
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status

from app.config import settings

# ── Supabase client (singleton) ───────────────────────────────────────────────

from supabase import create_client, Client

_supabase: Client | None = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _supabase


# ── Password hashing ──────────────────────────────────────────────────────────

_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Hash a plaintext password with bcrypt. Call only at request time."""
    return _pwd_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return _pwd_ctx.verify(plain, hashed)


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


# ── Helpers ───────────────────────────────────────────────────────────────────

def _row_to_user(row: dict) -> dict:
    """Normalize a Supabase row into the shape the rest of the app expects."""
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "hashed_password": row.get("password_hash", ""),
    }


# ── Public API ────────────────────────────────────────────────────────────────

def login(email: str, password: str) -> dict | None:
    """Returns user dict on success, None on failure."""
    try:
        res = get_supabase().table("users").select("*").eq("email", email.lower()).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error during login: {exc}",
        )
    rows = res.data or []
    if not rows:
        return None
    user = _row_to_user(rows[0])
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


def register_user(email: str, name: str, password: str) -> dict:
    """Creates a new user in Supabase. Raises HTTPException on duplicate email."""
    hashed = hash_password(password)
    try:
        res = (
            get_supabase()
            .table("users")
            .insert({"email": email.lower(), "name": name, "password_hash": hashed})
            .execute()
        )
    except Exception as exc:
        # supabase-py raises on unique constraint violations and other DB errors
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Registration failed: {exc}",
        )
    rows = res.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User created but no data returned.",
        )
    return _row_to_user(rows[0])


def send_otp(email: str) -> str:
    """
    Generates and stores an OTP.
    Returns the OTP (caller should email it).
    OTP store is in-memory — no Supabase call needed here.
    """
    otp = _generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(seconds=OTP_TTL_SECONDS)
    _OTP_STORE[email.lower()] = (otp, expires)
    return otp


def verify_otp(email: str, otp: str) -> dict | None:
    """Returns user dict if OTP is valid and not expired, else None."""
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
    # Look up (or lazily create) the user in Supabase
    return get_user_by_email(email)


def get_user_by_email(email: str) -> dict | None:
    """Fetch user from Supabase by email. Returns None if not found."""
    try:
        res = (
            get_supabase()
            .table("users")
            .select("*")
            .eq("email", email.lower())
            .execute()
        )
    except Exception:
        return None
    rows = res.data or []
    return _row_to_user(rows[0]) if rows else None


def get_user_by_id(user_id: str) -> dict | None:
    """Fetch user from Supabase by primary key. Returns None if not found."""
    try:
        res = (
            get_supabase()
            .table("users")
            .select("*")
            .eq("id", user_id)
            .execute()
        )
    except Exception:
        return None
    rows = res.data or []
    return _row_to_user(rows[0]) if rows else None


def update_profile(user_id: str, name: str) -> dict | None:
    """Update display name in Supabase. Returns updated user dict or None."""
    try:
        res = (
            get_supabase()
            .table("users")
            .update({"name": name})
            .eq("id", user_id)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error updating profile: {exc}",
        )
    rows = res.data or []
    return _row_to_user(rows[0]) if rows else None


def change_password(user_id: str, current_password: str, new_password: str) -> bool:
    """Verify current password then update hash in Supabase."""
    user = get_user_by_id(user_id)
    if not user:
        return False
    if not verify_password(current_password, user["hashed_password"]):
        return False
    try:
        get_supabase().table("users").update(
            {"password_hash": hash_password(new_password)}
        ).eq("id", user_id).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error updating password: {exc}",
        )
    return True
