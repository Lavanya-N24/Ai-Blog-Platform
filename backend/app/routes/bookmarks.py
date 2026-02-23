from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from pydantic import BaseModel
from typing import List

router = APIRouter()

class BookmarkRequest(BaseModel):
    user_id: int
    blog_id: int

@router.post("/toggle")
def toggle_bookmark(request: BookmarkRequest, db: Session = Depends(get_db)):
    # Check if bookmark exists
    bookmark = db.query(models.Bookmark).filter(
        models.Bookmark.user_id == request.user_id,
        models.Bookmark.blog_id == request.blog_id
    ).first()

    if bookmark:
        # Remove bookmark
        db.delete(bookmark)
        db.commit()
        return {"success": True, "bookmarked": False, "message": "Bookmark removed"}
    else:
        # Add bookmark
        new_bookmark = models.Bookmark(user_id=request.user_id, blog_id=request.blog_id)
        db.add(new_bookmark)
        db.commit()
        return {"success": True, "bookmarked": True, "message": "Bookmark added"}

@router.get("/{user_id}")
def get_user_bookmarks(user_id: int, db: Session = Depends(get_db)):
    bookmarks = db.query(models.Bookmark).filter(models.Bookmark.user_id == user_id).all()
    
    # Get details of bookmarked blogs
    if not bookmarks:
        return {"success": True, "bookmarks": []}
        
    blog_ids = [b.blog_id for b in bookmarks]
    blogs = db.query(models.Blog).filter(models.Blog.id.in_(blog_ids)).all()
    
    return {"success": True, "bookmarks": blogs}
