import { useState, useEffect } from "react";

// API base URL — empty in production (same-origin), set for dev if needed
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchHello() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/hello`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHello();
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>React + Express Production Setup</h1>
      <p>Frontend served by Nginx, backend proxied via /api</p>

      <div style={{ marginTop: "2rem", padding: "1rem", background: "#f5f5f5", borderRadius: "8px" }}>
        <h2>Backend Response:</h2>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {message && <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>}
        <button
          onClick={fetchHello}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default App;
