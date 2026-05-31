import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

frontend_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

print("FRONTEND PATH =", frontend_path)
print("EXISTS =", frontend_path.exists())

from app.config import settings
from app.routers import analyze, analyze_excel, assistant, auth, chat, deduplicate, download, excel_dedup, history, similarity, upload

app = FastAPI(title="Semantic Validator API")

# Confirm config on startup so you can verify .env is loading correctly
print(f"[CONFIG] AI_API_URL  = {settings.AI_API_URL}")
print(f"[CONFIG] AI_MODEL    = {settings.AI_MODEL}")
print(f"[CONFIG] AI_API_KEY  = {settings.AI_API_KEY[:12]}..." if settings.AI_API_KEY else "[CONFIG] AI_API_KEY  = (empty!)")

# Allow the configured origin AND any localhost port (handles Vite auto-incrementing)
_LOCALHOST_RE = re.compile(r"^http://localhost:\d+$")


def _is_allowed_origin(origin: str) -> bool:
    return origin == settings.CORS_ORIGIN or bool(_LOCALHOST_RE.match(origin))


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # broad allow — fine for local dev
    allow_credentials=False,      # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(upload.router)
app.include_router(deduplicate.router)
app.include_router(download.router)
app.include_router(analyze_excel.router)
app.include_router(chat.router)
app.include_router(assistant.router)
app.include_router(history.router)
app.include_router(similarity.router)
app.include_router(excel_dedup.router)
# Frontend build path
# Frontend build path
frontend_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if frontend_path.exists():
    app.mount("/assets", StaticFiles(directory=frontend_path / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        index_file = frontend_path / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return {"error": "Frontend build not found"}