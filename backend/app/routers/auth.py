from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.models.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    SendOTPRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserProfile,
    VerifyOTPRequest,
)
from app.services import auth_service
from app.services.auth_service import create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    user = auth_service.login(body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(user["id"], user["email"])
    return TokenResponse(
        access_token=token,
        user=UserProfile(id=user["id"], email=user["email"], name=user["name"]),
    )


@router.post("/send-otp")
async def send_otp(body: SendOTPRequest):
    otp = auth_service.send_otp(body.email)
    # In production: send via email/SMS. For demo we return it directly.
    return {"message": "OTP sent", "otp": otp, "expires_in_seconds": 300}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(body: VerifyOTPRequest):
    user = auth_service.verify_otp(body.email, body.otp)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP",
        )
    token = create_access_token(user["id"], user["email"])
    return TokenResponse(
        access_token=token,
        user=UserProfile(id=user["id"], email=user["email"], name=user["name"]),
    )


@router.get("/me", response_model=UserProfile)
async def me(current_user: dict = Depends(get_current_user)):
    return UserProfile(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
    )


@router.put("/profile", response_model=UserProfile)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    updated = auth_service.update_profile(current_user["id"], body.name)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfile(id=updated["id"], email=updated["email"], name=updated["name"])


@router.put("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    ok = auth_service.change_password(
        current_user["id"], body.current_password, body.new_password
    )
    if not ok:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    return {"message": "Password updated successfully"}
