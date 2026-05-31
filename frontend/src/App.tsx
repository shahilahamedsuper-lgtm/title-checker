import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import UploadFilePage from "./pages/UploadFilePage";
import AnalyzeExcelPage from "./pages/AnalyzeExcelPage";
import ChatWithAIPage from "./pages/ChatWithAIPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import SimilarityCheckerPage from "./pages/SimilarityCheckerPage";
import ExcelDedupPage from "./pages/ExcelDedupPage";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { SoundProvider } from "./context/SoundContext";
import { AIAssistantProvider } from "./context/AIAssistantContext";
import { ParticleField } from "./components/ui/ParticleField";
import { AIAssistantWidget } from "./components/AIAssistant";

function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  const [trails, setTrails] = useState<{ id: number; x: number; y: number }[]>([]);
  const trailId = useCallback(() => Math.random(), []);
  useEffect(() => {
    let last = 0;
    const h = (e: MouseEvent) => {
      const now = Date.now();
      if (now - last < 40) return;
      last = now;
      setTrails(p => [...p.slice(-8), { id: now, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setTrails(p => p.filter(t => t.id !== now)), 600);
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [trailId]);

  return (
    <div className="flex min-h-screen bg-[#020408]" style={{ position: 'relative', zIndex: 2 }}>
      {/* Deep space background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#020408] via-[#050d1a] to-[#0a0520]" />
        <div className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full bg-blue-600/[0.12] blur-[180px]" />
        <div className="absolute top-1/4 -right-60 w-[600px] h-[600px] rounded-full bg-purple-600/[0.14] blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-cyan-600/[0.10] blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-indigo-900/[0.08] blur-[220px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-pink-600/[0.08] blur-[130px]" />
        <div className="light-streak top-[15%]" style={{ animationDelay: "0s" }} />
        <div className="light-streak top-[45%]" style={{ animationDelay: "2.5s" }} />
        <div className="light-streak top-[75%]" style={{ animationDelay: "5s" }} />
      </div>

      {/* Cursor trails */}
      {!isMobile && trails.map((t, i) => (
        <div key={t.id} className="cursor-trail" style={{
          left: t.x, top: t.y,
          opacity: (i + 1) / trails.length * 0.7,
          width: `${4 + (i / trails.length) * 6}px`,
          height: `${4 + (i / trails.length) * 6}px`,
        }} />
      ))}

      <ParticleField count={100} disabled={isMobile} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex flex-col flex-1 min-w-0">
        <Navbar onHamburgerClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/upload"        element={<UploadFilePage />} />
            <Route path="/analyze-excel" element={<AnalyzeExcelPage />} />
            <Route path="/similarity"    element={<SimilarityCheckerPage />} />
            <Route path="/excel-dedup"   element={<ExcelDedupPage />} />
            <Route path="/chat"          element={<ChatWithAIPage />} />
            <Route path="/history"       element={<HistoryPage />} />
            <Route path="/settings"      element={<SettingsPage />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global AI Assistant widget — fixed-positioned, floats over all pages */}
      <AIAssistantWidget />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AIAssistantProvider>
          <SoundProvider>
            <ErrorBoundary>
              <BrowserRouter>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      background: "rgba(13, 18, 36, 0.95)",
                      color: "#f1f5f9",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      fontSize: "13px",
                      backdropFilter: "blur(12px)",
                    },
                    success: { iconTheme: { primary: "#10b981", secondary: "#0b0f1e" } },
                    error:   { iconTheme: { primary: "#ef4444", secondary: "#0b0f1e" } },
                  }}
                />
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <AppShell />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          </SoundProvider>
        </AIAssistantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
