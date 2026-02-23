# Deploying AI Blog Platform to Vercel

This project is configured for a **Monorepo-style deployment** on Vercel, where both the Next.js Frontend and FastAPI Backend run within the same Vercel project.

## Prerequisites

1.  **GitHub Account**: Your code must be pushed to a GitHub repository.
2.  **Vercel Account**: Linked to your GitHub.

## Step 1: Push Code to GitHub

Ensure all your latest changes (including `vercel.json` and `api/` folder) are committed and pushed.

```bash
# Verify your remote is set correctly
git remote -v

# Push to main
git push origin main
```

> **Tip:** If GitHub blocks your push due to "Secret Scanning", it means you accidentally committed an API key (like in `.env`).
> 1. Ensure `.env` is in your `.gitignore`.
> 2. Remove the secret from the file or history.
> 3. Run `git push` again.

## Step 2: Import Project in Vercel

1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your **AI_Blog_Platform_Full_Project** repository.

## Step 3: Configure Project Settings

**IMPORTANT:** You must configure the Root Directory correctly for the frontend to build, while the `vercel.json` handles the backend validation.

However, since we have a mixed structure with `vercel.json` at the root, **do NOT change the "Root Directory" in Vercel settings yet.** Leave it as the repository root (`./`).

Vercel should automatically detect the `vercel.json` and the Next.js app in `frontend/ai-blog-frontend`.

**Framework Preset:**
*   Vercel might autodetect "Next.js". If not, select it.
*   **Root Directory (overridden):** If the build fails saying it can't find `package.json`, go to **Settings > General** and change **Root Directory** to `frontend/ai-blog-frontend`.
    *   *Note:* Changing Root Directory might break the Python backend visibility.
    *   **Recommended Strategy:** Keep Root Directory as `./` (Empty).
    *   Go to **Settings > Build & Development Settings**:
        *   **Build Command:** `cd frontend/ai-blog-frontend && npm install && npm run build`
        *   **Output Directory:** `frontend/ai-blog-frontend/.next`
        *   **Install Command:** `cd frontend/ai-blog-frontend && npm install`

## Step 4: Environment Variables

Go to **Settings > Environment Variables** and add:

1.  `GROQ_API_KEY`: `gsk_...` (Your key)
2.  `OPENAI_API_KEY`: `sk-proj-...` (Your key)
3.  `NEXT_PUBLIC_API_URL`: `/api` (This ensures frontend talks to the Vercel Function)

## Step 5: Database Warning ⚠️

This project currently uses **SQLite** (`blog.db`).
*   **Vercel is Serverless/Ephemeral**: The filesystem is **Read-Only** (except /tmp) and **Resets** on every deployment.
*   **Result**: Any blogs you create properly **will disappear** on the next deploy.
*   **Solution**: For production, connect your backend to a cloud database (like **Supabase**, **Neon** (Postgres), or **MongoDB Atlas**) and update the `DATABASE_URL` in `.env`.

## Troubleshooting

*   **404 on /api/Generate-blog:** Ensure `vercel.json` rewrites are working.
*   **500 Error:** Check Vercel Function Logs. It might be a missing dependency in `api/requirements.txt`.
