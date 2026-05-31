"""
Title Similarity Service
Uses TF-IDF cosine similarity to compare a query title against a stored corpus.
The corpus is populated automatically whenever files are uploaded/analyzed.
"""
from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter
from typing import TypedDict


# ── Simple TF-IDF implementation (no heavy ML deps beyond what's already installed) ──

def _tokenize(text: str) -> list[str]:
    text = unicodedata.normalize("NFKD", text.lower())
    return re.findall(r"[a-z0-9]+", text)


def _tf(tokens: list[str]) -> dict[str, float]:
    if not tokens:
        return {}
    c = Counter(tokens)
    total = len(tokens)
    return {w: count / total for w, count in c.items()}


def _idf(corpus_tokens: list[list[str]]) -> dict[str, float]:
    n = len(corpus_tokens)
    if n == 0:
        return {}
    df: dict[str, int] = {}
    for tokens in corpus_tokens:
        for w in set(tokens):
            df[w] = df.get(w, 0) + 1
    return {w: math.log((n + 1) / (count + 1)) + 1 for w, count in df.items()}


def _tfidf_vector(tokens: list[str], idf: dict[str, float]) -> dict[str, float]:
    tf = _tf(tokens)
    return {w: tf_val * idf.get(w, 1.0) for w, tf_val in tf.items()}


def _cosine(a: dict[str, float], b: dict[str, float]) -> float:
    common = set(a) & set(b)
    if not common:
        return 0.0
    dot = sum(a[w] * b[w] for w in common)
    mag_a = math.sqrt(sum(v * v for v in a.values()))
    mag_b = math.sqrt(sum(v * v for v in b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


# ── In-memory title corpus ────────────────────────────────────────────────────

_CORPUS: list[str] = [
    # Pre-seeded sample titles so the checker works even before any uploads
    "AI based disease prediction system",
    "Machine learning for disease detection",
    "AI driven healthcare diagnosis system",
    "Deep learning image classification",
    "Natural language processing sentiment analysis",
    "Blockchain based supply chain management",
    "IoT smart home automation system",
    "Face recognition attendance system",
    "Recommendation system using collaborative filtering",
    "Stock market prediction using LSTM",
    "Fraud detection in banking transactions",
    "Autonomous vehicle navigation system",
    "Chatbot using transformer architecture",
    "Plant disease detection using CNN",
    "Customer churn prediction model",
]

_CHECKED_HISTORY: list[dict] = []   # recent checks log


def add_title(title: str) -> None:
    """Add a title to the corpus (called when files are uploaded)."""
    t = title.strip()
    if t and t not in _CORPUS:
        _CORPUS.append(t)


class SimilarityMatch(TypedDict):
    title: str
    score: int          # 0–100


class SimilarityResult(TypedDict):
    query: str
    score: int          # highest match score 0–100
    status: str         # "Unique" | "Similar" | "Duplicate"
    matches: list[SimilarityMatch]


def check_similarity(query: str, top_n: int = 5) -> SimilarityResult:
    """
    Compare *query* against the stored corpus using TF-IDF cosine similarity.
    Returns the top-N matches and an overall status.
    """
    query = query.strip()
    if not query:
        return SimilarityResult(query=query, score=0, status="Unique", matches=[])

    corpus = list(_CORPUS)
    if not corpus:
        return SimilarityResult(query=query, score=0, status="Unique", matches=[])

    # Tokenise everything
    query_tokens = _tokenize(query)
    corpus_tokens = [_tokenize(t) for t in corpus]

    # Build IDF over corpus + query
    all_tokens = corpus_tokens + [query_tokens]
    idf = _idf(all_tokens)

    query_vec = _tfidf_vector(query_tokens, idf)
    scores: list[tuple[float, str]] = []
    for title, tokens in zip(corpus, corpus_tokens):
        vec = _tfidf_vector(tokens, idf)
        sim = _cosine(query_vec, vec)
        scores.append((sim, title))

    scores.sort(key=lambda x: x[0], reverse=True)
    top = scores[:top_n]

    best_score = int(round(top[0][0] * 100)) if top else 0

    if best_score >= 90:
        status = "Duplicate"
    elif best_score >= 60:
        status = "Similar"
    else:
        status = "Unique"

    matches: list[SimilarityMatch] = [
        SimilarityMatch(title=title, score=int(round(sim * 100)))
        for sim, title in top
        if sim > 0.05
    ]

    result = SimilarityResult(query=query, score=best_score, status=status, matches=matches)

    # Log to history (keep last 50)
    from datetime import datetime, timezone
    _CHECKED_HISTORY.insert(0, {
        "query": query,
        "score": best_score,
        "status": status,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    })
    if len(_CHECKED_HISTORY) > 50:
        _CHECKED_HISTORY.pop()

    return result


def get_checked_history(limit: int = 10) -> list[dict]:
    return _CHECKED_HISTORY[:limit]


def get_corpus() -> list[str]:
    return list(_CORPUS)
