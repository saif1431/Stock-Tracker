from datetime import timedelta

from fastapi import APIRouter, Depends, Form, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.database import get_db
from core import security
from models.user import User
from routes.auth_utils import get_current_user
from schemas.token_schema import Token
from schemas.user_schema import UserCreate, UserResponse
from services.two_fa_service import TwoFAService

router = APIRouter(prefix="/auth", tags=["auth"])


class TwoFAEnableRequest(BaseModel):
    secret: str = Field(min_length=16)
    token: str = Field(min_length=6, max_length=16)


class TwoFADisableRequest(BaseModel):
    token: str = Field(min_length=6, max_length=16)


class LoginWith2FARequest(BaseModel):
    username: str
    password: str
    token: str = Field(min_length=6, max_length=16)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_in.email) | (User.username == user_in.username)
    ).first()
    
    if existing_user:
        if existing_user.email == user_in.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Create new user with hashed password
    hashed_password = security.get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        is_active=True,
        is_admin=False,
        is_banned=False,
        subscription="free",
        two_fa_enabled=False,
    )
    
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. Please try again."
        )


@router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    two_fa_token: str | None = Form(default=None),
    db: Session = Depends(get_db)
):
    """Login and get access token"""
    try:
        # Find user by username or email
        user = db.query(User).filter(
            (User.username == form_data.username) | (User.email == form_data.username)
        ).first()
        
        # Verify password
        if not user or not security.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        if user.is_banned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is banned"
            )

        if user.two_fa_enabled:
            if not two_fa_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="2FA token required",
                )

            valid_totp = bool(user.two_fa_secret) and TwoFAService.verify_token(user.two_fa_secret, two_fa_token)
            backup_codes = list(user.backup_codes or [])
            used_backup_code = two_fa_token in backup_codes

            if not valid_totp and not used_backup_code:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid 2FA token",
                )

            if used_backup_code:
                backup_codes.remove(two_fa_token)
                user.backup_codes = backup_codes
                db.commit()
    except Exception as e:
        import traceback
        print(f"DEBUG: Login Crash in Production: {str(e)}")
        print(traceback.format_exc())
        # Re-raise if it's an HTTPException, otherwise raise 500
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error during login: {type(e).__name__}"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.username, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current logged-in user information"""
    return current_user


@router.post("/2fa/setup")
def setup_two_fa(
    current_user: User = Depends(get_current_user),
):
    secret = TwoFAService.generate_secret()
    qr_code = TwoFAService.get_qr_code_base64(secret, current_user.email)
    backup_codes = TwoFAService.generate_backup_codes()

    return {
        "secret": secret,
        "qr_code": qr_code,
        "backup_codes": backup_codes,
    }


@router.post("/2fa/enable")
def enable_two_fa(
    payload: TwoFAEnableRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not TwoFAService.verify_token(payload.secret, payload.token):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA token")

    backup_codes = TwoFAService.generate_backup_codes()
    current_user.two_fa_enabled = True
    current_user.two_fa_secret = payload.secret
    current_user.backup_codes = backup_codes
    db.commit()

    return {
        "status": "enabled",
        "backup_codes": backup_codes,
    }


@router.post("/2fa/disable")
def disable_two_fa(
    payload: TwoFADisableRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.two_fa_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled")

    valid_totp = bool(current_user.two_fa_secret) and TwoFAService.verify_token(current_user.two_fa_secret, payload.token)
    backup_codes = list(current_user.backup_codes or [])
    used_backup_code = payload.token in backup_codes

    if not valid_totp and not used_backup_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA token")

    if used_backup_code:
        backup_codes.remove(payload.token)

    current_user.two_fa_enabled = False
    current_user.two_fa_secret = None
    current_user.backup_codes = backup_codes
    db.commit()

    return {"status": "disabled"}


@router.post("/login-2fa", response_model=Token)
def login_with_two_fa(
    payload: LoginWith2FARequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter((User.username == payload.username) | (User.email == payload.username)).first()

    if not user or not security.verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.is_banned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is banned")

    if not user.two_fa_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled")

    valid_totp = bool(user.two_fa_secret) and TwoFAService.verify_token(user.two_fa_secret, payload.token)
    backup_codes = list(user.backup_codes or [])
    used_backup_code = payload.token in backup_codes

    if not valid_totp and not used_backup_code:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA token")

    if used_backup_code:
        backup_codes.remove(payload.token)
        user.backup_codes = backup_codes
        db.commit()

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(subject=user.username, expires_delta=access_token_expires)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
