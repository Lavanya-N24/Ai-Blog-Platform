from sqlalchemy import Column, Integer, String, JSON
from .database import Base
from datetime import datetime

class Blog(Base):
    __tablename__ = "blogs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(String)
    author = Column(String, default="Anonymous")
    user_id = Column(Integer, index=True, nullable=True) # Link to User model
    tags = Column(JSON, default=[])
    created_at = Column(String, default=datetime.now().isoformat())
    updated_at = Column(String, default=datetime.now().isoformat())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    password = Column(String) # In real app, hash this!
    role = Column(String, default="user") # "admin" or "user"
    bio = Column(String, default="No bio yet.")
    avatar_url = Column(String, default="") # URL to profile picture
    social_links = Column(JSON, default={}) # Stores {"twitter": "", "linkedin": "", "github": ""}
    created_at = Column(String, default=datetime.now().isoformat())

class AIUsage(Base):
    __tablename__ = "ai_usage"

    id = Column(Integer, primary_key=True, index=True)
    tool_used = Column(String) # e.g., "blog_generator", "summarizer"
    timestamp = Column(String, default=datetime.now().isoformat())
    success = Column(Integer, default=1) # 1 for success, 0 for failure

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    blog_id = Column(Integer, index=True)
    created_at = Column(String, default=datetime.now().isoformat())

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    author = Column(String, default="Anonymous")
    blog_id = Column(Integer, index=True)
    created_at = Column(String, default=datetime.now().isoformat())

class SystemConfig(Base):
    __tablename__ = "system_config"

    id = Column(Integer, primary_key=True, index=True)
    site_name = Column(String, default="AI Blog Platform")
    ai_model = Column(String, default="Llama 3.1 (Groq)")
    image_model = Column(String, default="DALL-E 3 (OpenAI)")
    image_style = Column(String, default="Digital Art")
    updated_at = Column(String, default=datetime.now().isoformat())
