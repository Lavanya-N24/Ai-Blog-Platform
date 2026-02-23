# AI Blog Platform - Backend API

FastAPI backend for the AI Blog Platform.

## Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://localhost:8000

## API Endpoints

### AI Routes (/api/ai)
- POST /api/ai/generate-blog - Generate a full blog post
- POST /api/ai/summarize - Summarize blog content
- POST /api/ai/generate-headline - Generate headlines
- POST /api/ai/change-tone - Change content tone
- POST /api/ai/plagiarism-check - Check for plagiarism
- POST /api/ai/image-caption - Generate image captions

### Blog Routes (/api/blog)
- GET /api/blog/ - Get all blogs
- GET /api/blog/{blog_id} - Get a specific blog
- POST /api/blog/create - Create a new blog
- PUT /api/blog/{blog_id} - Update a blog
- DELETE /api/blog/{blog_id} - Delete a blog
- GET /api/blog/stats/overview - Get dashboard statistics

## API Documentation

Visit http://localhost:8000/docs for Swagger UI documentation.
