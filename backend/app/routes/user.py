from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from .. import models
from datetime import datetime
import shutil
import os

router = APIRouter()

# --- Schemas ---
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    social_links: Optional[dict] = None

class UserProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    bio: Optional[str]
    avatar_url: Optional[str] = ""
    social_links: Optional[dict] = {}
    created_at: str
    blog_count: int = 0

# --- Endpoints ---

@router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Get user profile details."""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
    except Exception as e:
        if "avatar_url" in str(e):
            # Database schema issue - try alternative query
            from sqlalchemy import text
            result = db.execute(
                text("SELECT id, email, full_name, password, role, bio, created_at FROM users WHERE id = :user_id"),
                {"user_id": user_id}
            ).first()
            if result:
                return {
                    "id": result[0],
                    "email": result[1],
                    "full_name": result[2] or "User",
                    "bio": result[5] or "",
                    "avatar_url": "",
                    "social_links": {},
                    "created_at": result[6] or datetime.now().isoformat(),
                    "blog_count": 0
                }
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Count blogs
    try:
        blog_count = db.query(models.Blog).filter(models.Blog.author == user.full_name).count()
    except:
        blog_count = 0

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name or "User",
        "bio": user.bio or "",
        "avatar_url": getattr(user, 'avatar_url', '') or "",
        "social_links": user.social_links if hasattr(user, 'social_links') and user.social_links else {},
        "created_at": user.created_at or datetime.now().isoformat(),
        "blog_count": blog_count
    }

@router.put("/{user_id}")
def update_user_profile(user_id: int, profile: UserProfileUpdate, db: Session = Depends(get_db)):
    """Update user profile."""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if profile.full_name:
            user.full_name = profile.full_name
        if profile.email:
            user.email = profile.email
        if profile.bio:
            user.bio = profile.bio
        if profile.social_links is not None:
            user.social_links = profile.social_links
        
        db.commit()
        db.refresh(user)
        
        return {"success": True, "message": "Profile updated", "user": {
            "id": user.id,
            "full_name": user.full_name or "",
            "email": user.email or "",
            "bio": getattr(user, 'bio', '') or "",
            "avatar_url": getattr(user, 'avatar_url', '') or "",
            "social_links": getattr(user, 'social_links', {}) or {}
        }}
    except Exception as e:
        print(f"[user/update] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@router.post("/{user_id}/avatar")
def upload_avatar(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload user avatar."""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Ensure directory exists
        os.makedirs("static/avatars", exist_ok=True)
        
        # Save file
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"avatar_{user_id}_{int(datetime.now().timestamp())}.{file_extension}"
        file_path = f"static/avatars/{filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Update user (Use absolute URL for frontend convenience)
        avatar_url = f"http://localhost:8000/static/avatars/{filename}"
        if hasattr(user, 'avatar_url'):
            user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)
        
        return {"success": True, "avatar_url": avatar_url}
    except Exception as e:
        print(f"[user/avatar] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str

@router.put("/{user_id}/password")
def update_user_password(user_id: int, password_data: UserPasswordUpdate, db: Session = Depends(get_db)):
    """Update user password."""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password (simple comparison for now, should be hashed in production)
        if user.password != password_data.current_password:
            raise HTTPException(status_code=400, detail="Incorrect current password")
        
        # Update password
        user.password = password_data.new_password
        db.commit()
        
        return {"success": True, "message": "Password updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[user/password] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update password: {str(e)}")
