from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

from sqlalchemy.orm import Session
from fastapi import Depends
from ..database import get_db
from .. import models

# In-memory storage REMOVED
# blogs_db = []
# users_db = []

# Request/Response models
class BlogCreate(BaseModel):
    title: str
    content: str
    author: Optional[str] = "Anonymous"
    user_id: Optional[int] = None
    tags: Optional[List[str]] = []


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None


class BlogResponse(BaseModel):
    id: int
    title: str
    content: str
    author: str
    user_id: Optional[int]
    tags: List[str]
    created_at: str
    updated_at: str


@router.get("/")
def get_all_blogs(search: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all blogs, optionally filtered by search query"""
    query = db.query(models.Blog)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.Blog.title.ilike(search_filter)) | 
            (models.Blog.content.ilike(search_filter))
        )
    
    blogs = query.order_by(models.Blog.created_at.desc()).all()
    # Convert SQLAlchemy objects to dicts for JSON serialization
    blogs_list = [
        {
            "id": blog.id,
            "title": blog.title,
            "content": blog.content,
            "author": blog.author,
            "user_id": blog.user_id,
            "tags": blog.tags if blog.tags else [],
            "created_at": blog.created_at,
            "updated_at": blog.updated_at
        }
        for blog in blogs
    ]
    return {
        "success": True,
        "blogs": blogs_list,
        "total": len(blogs_list)
    }


@router.get("/{blog_id}")
def get_blog(blog_id: int, db: Session = Depends(get_db)):
    """Get a specific blog by ID"""
    blog = db.query(models.Blog).filter(models.Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return {"success": True, "blog": blog}


@router.get("/user/{user_id}")
def get_user_blogs(user_id: int, db: Session = Depends(get_db)):
    """Get all blogs for a specific user"""
    blogs = db.query(models.Blog).filter(models.Blog.user_id == user_id).order_by(models.Blog.created_at.desc()).all()
    blogs_list = [
        {
            "id": blog.id,
            "title": blog.title,
            "content": blog.content,
            "author": blog.author,
            "user_id": blog.user_id,
            "tags": blog.tags if blog.tags else [],
            "created_at": blog.created_at,
            "updated_at": blog.updated_at
        }
        for blog in blogs
    ]
    return {
        "success": True,
        "blogs": blogs_list,
        "total": len(blogs_list)
    }


@router.post("/create")
def create_blog(blog: BlogCreate, db: Session = Depends(get_db)):
    """Create a new blog post"""
    new_blog = models.Blog(
        title=blog.title,
        content=blog.content,
        author=blog.author,
        user_id=blog.user_id,
        tags=blog.tags or [],
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )
    db.add(new_blog)
    db.commit()
    db.refresh(new_blog)
    return {
        "success": True,
        "message": "Blog created successfully",
        "blog": new_blog
    }


@router.put("/{blog_id}")
def update_blog(blog_id: int, blog_update: BlogUpdate, db: Session = Depends(get_db)):
    """Update an existing blog"""
    blog = db.query(models.Blog).filter(models.Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    if blog_update.title:
        blog.title = blog_update.title
    if blog_update.content:
        blog.content = blog_update.content
    if blog_update.tags is not None:
        blog.tags = blog_update.tags
    
    blog.updated_at = datetime.now().isoformat()
    db.commit()
    db.refresh(blog)
    
    return {
        "success": True,
        "message": "Blog updated successfully",
        "blog": blog
    }


@router.delete("/{blog_id}")
def delete_blog(blog_id: int, db: Session = Depends(get_db)):
    """Delete a blog post"""
    blog = db.query(models.Blog).filter(models.Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    db.delete(blog)
    db.commit()
    
    return {
        "success": True,
        "message": "Blog deleted successfully"
    }


@router.get("/stats/overview")
def get_stats():
    """Get dashboard statistics"""
    return {
        "success": True,
        "stats": {
            "total_blogs": 0, # TODO: implement db count
            "total_users": 0,
            "ai_usage_count": 0  # TODO: Track AI usage
        }
    }
