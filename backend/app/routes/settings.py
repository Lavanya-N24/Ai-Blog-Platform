from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SystemConfig
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class SettingsUpdate(BaseModel):
    site_name: str
    ai_model: str
    image_model: str
    image_style: str

@router.get("/")
def get_settings(db: Session = Depends(get_db)):
    config = db.query(SystemConfig).first()
    if not config:
        # Create default config if none exists
        config = SystemConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    
    return {
        "success": True,
        "settings": {
            "site_name": config.site_name,
            "ai_model": config.ai_model,
            "image_model": config.image_model,
            "image_style": config.image_style
        }
    }

@router.put("/")
def update_settings(settings: SettingsUpdate, db: Session = Depends(get_db)):
    config = db.query(SystemConfig).first()
    if not config:
        config = SystemConfig()
        db.add(config)
    
    config.site_name = settings.site_name
    config.ai_model = settings.ai_model
    config.image_model = settings.image_model
    config.image_style = settings.image_style
    config.updated_at = datetime.now().isoformat()
    
    db.commit()
    
    return {"success": True, "message": "Settings updated successfully"}
