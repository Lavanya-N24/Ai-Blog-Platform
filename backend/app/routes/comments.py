from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from pydantic import BaseModel
from datetime import datetime
from typing import List

router = APIRouter()

class CommentCreate(BaseModel):
    content: str
    author: str = "Anonymous"

class CommentResponse(BaseModel):
    id: int
    content: str
    author: str
    blog_id: int
    created_at: str

@router.post("/{blog_id}", response_model=CommentResponse)
def create_comment(blog_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    """Add a comment to a blog post"""
    # Verify blog exists
    blog = db.query(models.Blog).filter(models.Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    new_comment = models.Comment(
        content=comment.content,
        author=comment.author,
        blog_id=blog_id,
        created_at=datetime.now().isoformat()
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.get("/{blog_id}", response_model=List[CommentResponse])
def get_comments(blog_id: int, db: Session = Depends(get_db)):
    """Get all comments for a blog post"""
    comments = db.query(models.Comment).filter(models.Comment.blog_id == blog_id).order_by(models.Comment.created_at.desc()).all()
    return comments

@router.delete("/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    """Delete a comment"""
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    db.delete(comment)
    db.commit()
    return {"success": True, "message": "Comment deleted"}
