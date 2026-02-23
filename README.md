# 🚀 AI Powered Blog Platform

A modern, full-stack blogging platform supercharged with AI capabilities. Generate high-quality blog posts, summaries, headlines, and images instantly using advanced AI models (Llama 3, GPT-4, DALL-E 3).

## ✨ Features

### 🤖 AI Utilities
- **AI Blog Generator**: Create full-length, SEO-optimized blog posts from a simple topic.
- **AI Summarizer**: Condense long articles into concise summaries.
- **AI Headline Generator**: Catchy, click-worthy titles for your content.
- **AI Tone Changer**: Adjust the rewriting style (Professional, Casual, Humorous).
- **AI Image Generation**: Auto-generate relevant header images for your blogs.
- **Plagiarism Checker**: Ensure content originality.

### 🛡️ Admin & User Dashboard
- **Admin Dashboard**: Real-time analytics, user management, and content moderation.
- **Content Analytics**: Visualized tag distribution and AI usage trends.
- **System Settings**: Configure site name, default AI models, and style presets.
- **Profile Management**: Profile picture upload, bio updates, and password management.
- **Role-Based Access**: Secure Admin and User roles with protected routes.

### 🎨 UI/UX
- **Modern Design**: Glassmorphism aesthetic with floating inputs and smooth transitions.
- **Dynamic Visuals**: Animated backgrounds (Starfield, Neural Network) and responsive charts.
- **Dark Mode**: Sleek, eye-friendly dark interface.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, Framer Motion, Recharts
- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **AI Integration**: Groq (Llama 3.1), OpenAI (GPT-4o, DALL-E 3)
- **Authentication**: JWT (JSON Web Tokens)

## 🏗️ Architecture

The platform is designed with a modern **Layered Micro-Backend Architecture**, ensuring a clear separation of concerns between the UI, business logic, AI services, and data storage.

### 📊 System Architecture Diagram

```
                    ┌──────────────────────────┐
                    │       User Browser        │
                    │   (Chrome / Edge / etc.)  │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │     Next.js Frontend      │
                    │  - UI / Dark Mode         │
                    │  - Blog Editor & Viewer   │
                    │  - Auth Pages (JWT)       │
                    │  - Admin Dashboard        │
                    └────────────┬─────────────┘
                                 │  REST API (HTTP/JSON)
                                 ▼
                    ┌──────────────────────────┐
                    │     FastAPI Backend       │
                    │  - JWT Authentication     │
                    │  - Role-Based Access      │
                    │  - Prompt Builder         │
                    │  - API Controllers        │
                    └────────────┬─────────────┘
                                 │
               ┌─────────────────┴──────────────────┐
               │                                     │
               ▼                                     ▼
  ┌────────────────────────┐          ┌─────────────────────────┐
  │     AI Provider Layer  │          │      Database Layer      │
  │                        │          │                          │
  │  ┌──────────────────┐  │          │  ┌───────────────────┐  │
  │  │   Groq API       │  │          │  │  SQLite (Dev)     │  │
  │  │  (Llama 3.1)     │  │          │  │  PostgreSQL (Prod)│  │
  │  └──────────────────┘  │          │  └───────────────────┘  │
  │  ┌──────────────────┐  │          │  ┌───────────────────┐  │
  │  │   OpenAI API     │  │          │  │  Static Storage   │  │
  │  │  (GPT-4 / DALL-E)│  │          │  │  (Avatars/Images) │  │
  │  └──────────────────┘  │          │  └───────────────────┘  │
  └────────────────────────┘          └─────────────────────────┘
```

### 🧱 Architectural Layers

| Layer | Technology | Responsibility |
|---|---|---|
| **Presentation** | Next.js 14, React, Framer Motion | UI rendering, routing, and state management |
| **Application** | FastAPI, Pydantic | Auth (JWT), RBAC, request validation |
| **Intelligence** | Groq (Llama 3), OpenAI (GPT-4) | AI content generation, prompt engineering |
| **Data** | SQLAlchemy ORM, SQLite/PostgreSQL | Blog, user, and config persistence |

### 📂 Structural Map
```
├── frontend/           # Presentation Layer (Next.js)
├── backend/            # Application & Intelligence Layer (FastAPI)
│   ├── app/routes/     # API Controllers (blog, ai, auth, user...)
│   ├── app/models.py   # Database Schema (SQLAlchemy)
│   └── static/         # Uploaded files & avatars
└── api/                # Vercel Serverless entry point
```


## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Python 3.8+
- Groq / OpenAI API Keys

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ai-blog-platform.git
    cd ai-blog-platform
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # Mac/Linux
    # source venv/bin/activate
    
    pip install -r requirements.txt
    ```

3.  **Environment Variables:**
    Create a `.env` file in `backend/` and add:
    ```env
    DATABASE_URL=sqlite:///./blog.db
    SECRET_KEY=your_secret_key
    GROQ_API_KEY=your_groq_key
    OPENAI_API_KEY=your_openai_key
    ```

4.  **Frontend Setup:**
    ```bash
    cd ../frontend/ai-blog-frontend
    npm install
    ```

### ▶️ Usage

1.  **Start the Backend:**
    ```bash
    # In backend/ directory
    python -m uvicorn app.main:app --reload --port 8000
    ```

2.  **Start the Frontend:**
    ```bash
    # In frontend/ai-blog-frontend/ directory
    npm run dev
    ```

3.  **Visit:** `http://localhost:3000`

## 👥 Contributing

Contributions are welcome! Please fork the repo and create a pull request.

## 📄 License

MIT License
