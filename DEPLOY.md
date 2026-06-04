# Deployment Guide — Render (backend) + Vercel (frontend) + Supabase (database)

## 1. Supabase Setup
1. Go to https://supabase.com and create a new project
2. In SQL Editor, paste and run the contents of `backend/supabase_schema.sql`
3. Go to Settings → API and copy:
   - Project URL → `SUPABASE_URL`
   - service_role key (secret) → `SUPABASE_SERVICE_KEY`

## 2. Deploy Backend to Render
1. Push code to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - Root Directory: `backend`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `AI_API_KEY` = your Gemini API key
   - `CORS_ORIGIN` = https://your-app.vercel.app (set after Vercel deploy)
   - `SUPABASE_URL` = from step 1
   - `SUPABASE_SERVICE_KEY` = from step 1
   - `JWT_SECRET` = generate a random 64-char string
6. Deploy — copy the Render URL (e.g. https://semantic-validator-api.onrender.com)

## 3. Deploy Frontend to Vercel
1. Go to https://vercel.com → New Project → Import GitHub repo
2. Set Framework Preset: Vite
3. Set Root Directory: `frontend`
4. Add Environment Variable:
   - `VITE_API_URL` = your Render backend URL from step 2
5. Deploy

## 4. Update CORS on Render
After Vercel gives you your URL (e.g. https://semantic-validator.vercel.app):
- Go to Render → your service → Environment
- Update `CORS_ORIGIN` = https://semantic-validator.vercel.app
- Redeploy

## 5. Test
- Open your Vercel URL
- Register a new account
- Login and use the app
