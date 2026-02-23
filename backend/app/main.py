from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import ai, blog, admin, user, auth, bookmarks, settings
from .database import engine, get_db
from . import models
from sqlalchemy.exc import OperationalError

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Blog Platform API", version="1.0.0")


# Enable CORS for frontend
# Trigger reload
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os

# Create static/avatars directory if it doesn't exist
os.makedirs("static/avatars", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(blog.router, prefix="/api/blog", tags=["Blog"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(bookmarks.router, prefix="/api/bookmarks", tags=["Bookmarks"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
from .routes import comments
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])

@app.on_event("startup")
def seed_admin_user():
    """Ensure a default admin user exists.

    Wrapped in try/except so that missing columns in an existing SQLite DB
    (e.g. after adding new fields to the User model) do NOT prevent the
    application from starting during development.
    """
    try:
        db = next(get_db())
        admin_email = "lavanyanm75@gmail.com"
        admin_user = (
            db.query(models.User).filter(models.User.email == admin_email).first()
        )

        if not admin_user:
            new_admin = models.User(
                email=admin_email,
                full_name="Admin Lavanya",
                password="lav@123",  # In production, hash this!
                role="admin",
                bio="System Administrator",
                social_links={},
            )
            db.add(new_admin)
            db.commit()
            print(f"Admin user created: {admin_email} / lav123")
        else:
            admin_user.password = "lav@123"
            admin_user.role = "admin"
            db.commit()
            print(f"Admin user updated: {admin_email}")
    except OperationalError as e:
        # Database schema is out of date (e.g. missing new columns).
        # Log and continue so the API still starts.
        print(f"[startup] Skipping admin seeding due to DB schema issue: {e}")
    except Exception as e:
        print(f"[startup] Unexpected error while seeding admin user: {e}")



@app.get("/")
def root():
    return {"message": "AI Blog Platform API", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
