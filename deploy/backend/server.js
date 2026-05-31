const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json());

// Allow requests from the frontend origin.
// In production behind Nginx the frontend and backend share the same domain,
// so CORS is only needed during local development.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, same-origin via Nginx)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Sample endpoint
app.get("/api/hello", (_req, res) => {
  res.json({
    message: "Hello from the Express backend!",
    environment: process.env.NODE_ENV || "development",
  });
});

// 404 handler for unknown API routes
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
