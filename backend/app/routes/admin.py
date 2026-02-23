from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, defer
from sqlalchemy import func
from ..database import get_db
from .. import models
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    """
    Get real-time statistics for the admin dashboard.
    """
    try:
        # 1. Counts
        total_blogs = db.query(models.Blog).count()
        total_users = db.query(models.User).count()
        total_ai_requests = db.query(models.AIUsage).count()
    except Exception as e:
        # If database has schema issues, return safe defaults
        print(f"[admin/stats] Database error: {e}")
        return {
            "success": True,
            "stats": {
                "total_blogs": 0,
                "total_users": 0,
                "ai_requests": 0,
            },
            "chart_data": []
        }

    try:
        # 2. AI Usage Trends (Last 7 days)
        today = datetime.now()
        seven_days_ago = today - timedelta(days=6)
        
        recent_usage = db.query(models.AIUsage).filter(
            models.AIUsage.timestamp >= seven_days_ago.isoformat()
        ).all()
        
        analytics_data = {}
        # Initialize last 7 days with 0
        for i in range(7):
            d = seven_days_ago + timedelta(days=i)
            day_name = d.strftime("%a") # Mon, Tue...
            analytics_data[day_name] = 0

        for usage in recent_usage:
            try:
                ts = datetime.fromisoformat(usage.timestamp)
                day_name = ts.strftime("%a")
                if day_name in analytics_data:
                    analytics_data[day_name] += 1
            except:
                pass

        # Convert to list for Recharts
        chart_data = [{"name": k, "requests": v} for k, v in analytics_data.items()]
    except Exception as e:
        print(f"[admin/stats] Chart data error: {e}")
        chart_data = []
    try:
        # 3. Content Categories (Tags distribution)
        # Fetch all tags from all blogs. Defer content loading for performance.
        all_blogs = db.query(models.Blog).options(defer(models.Blog.content)).all()
        
        tag_counts = {}
        for blog in all_blogs:
            if blog.tags:
                try:
                    import json
                    # Handle if it is a list or a JSON string
                    if isinstance(blog.tags, list):
                        tags_list = blog.tags
                    elif isinstance(blog.tags, str):
                        try:
                            # Try to parse '["AI Generated"]'
                            tags_list = json.loads(blog.tags)
                            if not isinstance(tags_list, list):
                                # Maybe it's just a comma-separated string? "AI Generated, Tech"
                                tags_list = [t.strip() for t in blog.tags.split(",")]
                        except:
                            # Fallback if JSON parse fails
                            tags_list = [t.strip() for t in blog.tags.split(",")]
                    else:
                        tags_list = []
                    
                    for tag in tags_list:
                        if not isinstance(tag, str): continue
                        # Normalize tag: Title case
                        clean_tag = tag.strip().title()
                        if clean_tag:
                            tag_counts[clean_tag] = tag_counts.get(clean_tag, 0) + 1
                except:
                    pass
        
        # Sort by count and take top 5
        sorted_tags = sorted(tag_counts.items(), key=lambda item: item[1], reverse=True)[:5]
        
        category_data = [{"name": tag, "value": count} for tag, count in sorted_tags]
        
        # If no data, provide a placeholder so chart isn't empty
        if not category_data:
            category_data = [{"name": "No Data", "value": 1}]

    except Exception as e:
        print(f"[admin/stats] Category data error: {e}")
        category_data = [{"name": "Error", "value": 1}]

    return {
        "success": True,
        "stats": {
            "total_blogs": total_blogs,
            "total_users": total_users,
            "ai_requests": total_ai_requests,
        },
        "chart_data": chart_data,
        "category_data": category_data
    }

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    """Get all users for admin management."""
    try:
        users = db.query(models.User).order_by(models.User.created_at.desc()).all()
        # Convert SQLAlchemy objects to dicts for JSON serialization
        users_list = [
            {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name or "Unknown",
                "role": user.role or "user",
                "bio": user.bio or "",
                "created_at": user.created_at or datetime.now().isoformat()
            }
            for user in users
        ]
        return {
            "success": True,
            "users": users_list
        }
    except Exception as e:
        print(f"[admin/users] Database error: {e}")
        return {
            "success": True,
            "users": []
        }
