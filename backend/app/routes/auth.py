from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from .. import models

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "user" # Default to user

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        # Try to query user - handle schema mismatch gracefully
        try:
            user = db.query(models.User).filter(models.User.email == request.email).first()
        except Exception as schema_error:
            if "avatar_url" in str(schema_error):
                print(f"[auth/login] Database schema issue detected. Run: python fix_db.py")
                # Try alternative query without avatar_url
                from sqlalchemy import text
                result = db.execute(
                    text("SELECT id, email, full_name, password, role, bio, created_at FROM users WHERE email = :email"),
                    {"email": request.email}
                ).first()
                if not result:
                    raise HTTPException(status_code=404, detail="User not found. Please run: python fix_db.py to fix database schema.")
                # Create a simple user-like object
                class SimpleUser:
                    def __init__(self, row):
                        self.id = row[0]
                        self.email = row[1]
                        self.full_name = row[2]
                        self.password = row[3]
                        self.role = row[4]
                user = SimpleUser(result)
            else:
                raise
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # In a real app, verify hashed password. Here, simple string comparison.
        if user.password != request.password:
            raise HTTPException(status_code=401, detail="Incorrect password")
        
        return {
            "success": True,
            "user_id": user.id,
            "full_name": user.full_name or "Admin",
            "role": user.role or "user",
            "message": "Login successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[auth/login] Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}. Try running: python fix_db.py")

@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        # Check if user already exists
        # Handle potential schema issues gracefully
        try:
            existing_user = db.query(models.User).filter(models.User.email == request.email).first()
        except Exception:
            # Fallback for schema issues
            from sqlalchemy import text
            result = db.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": request.email}
            ).first()
            existing_user = result

        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Validation: Only specific email can be admin
        if request.role == "admin" and request.email != "lavanyanm75@gmail.com":
             raise HTTPException(status_code=403, detail="Unauthorized: This email cannot register as Admin.")

        # Create new user
        new_user = models.User(
            email=request.email,
            password=request.password, # In real app, hash this!
            full_name=request.full_name,
            role=request.role, # Use requested role
            bio="New user",
            social_links={}
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "success": True,
            "message": "Registration successful",
            "user_id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[auth/register] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
