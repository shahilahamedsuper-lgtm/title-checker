# Semantic Validator

An AI-powered web application that analyzes the meaning, tone, and clarity of submitted text and suggests improvements.

## Project Structure

```
semantic-validator/
├── backend/          # FastAPI service
└── frontend/         # React + Vite + Tailwind SPA
```

---

## Backend Setup

### Prerequisites

- Python 3.11+

### Install dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Configure environment

```bash
cp .env.example .env
# Edit .env and set AI_API_KEY to your OpenAI (or compatible) API key
```

### Run the development server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### Run backend tests

```bash
pytest
```

---

## Frontend Setup

### Prerequisites

- Node.js 18+

### Install dependencies

```bash
cd frontend
npm install
```

### Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Run frontend tests

```bash
npm test
```

### Build for production

```bash
npm run build
```

---

## API

### `POST /api/analyze`

**Request body:**

```json
{
  "title": "My Article Title",
  "text": "Body content to analyze..."
}
```

**Response (200):**

```json
{
  "meaning": "Summary of the content's meaning",
  "tone": "formal",
  "clarity_score": 82,
  "suggestions": [
    "Consider shortening the introduction.",
    "Use more active voice."
  ]
}
```

**Error responses:**

| Status | Cause |
|--------|-------|
| 422 | Missing or invalid request fields |
| 502 | AI provider returned an error |
| 504 | AI provider timed out (>30s) |
