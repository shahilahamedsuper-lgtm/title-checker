import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff,
  KeyRound, Chrome, AlertCircle, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { loginWithPassword, sendOTP, verifyOTP } from "../api/authApi";

type Mode = "password" | "otp-send" | "otp-verify";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("shahil@gmail.com");
  const [password, setPassword] = useState("shahil98");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Prevent duplicate toasts
  const lastToastId = useRef<string | null>(null);

  function showError(msg: string) {
    setInlineError(msg);
    // Dismiss previous error toast before showing new one
    if (lastToastId.current) toast.dismiss(lastToastId.current);
    lastToastId.current = toast.error(msg, { id: "login-error" });
  }

  function clearError() {
    setInlineError(null);
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!email.trim()) { showError("Please enter your email"); return; }
    if (!password) { showError("Please enter your password"); return; }
    setLoading(true);
    try {
      const data = await loginWithPassword(email.trim(), password);
      toast.dismiss("login-error");
      toast.success(`Welcome back, ${data.user.name}! 🎉`, { id: "login-success" });
      login(data.access_token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      // Distinguish network errors from credential errors
      if (msg.toLowerCase().includes("unavailable") || msg.toLowerCase().includes("network")) {
        showError("Cannot reach the server. Make sure the backend is running on port 8000.");
      } else {
        showError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!email.trim()) { showError("Please enter your email"); return; }
    setLoading(true);
    try {
      const data = await sendOTP(email.trim());
      setDemoOtp(data.otp);
      setMode("otp-verify");
      toast.success("OTP sent!", { id: "otp-sent" });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!otp) { showError("Please enter the OTP"); return; }
    setLoading(true);
    try {
      const data = await verifyOTP(email.trim(), otp);
      toast.dismiss("login-error");
      toast.success(`Welcome, ${data.user.name}! 🎉`, { id: "login-success" });
      login(data.access_token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      showError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f1e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">Semantic</p>
            <p className="text-purple-400 font-bold text-xl leading-tight">Validator</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          <h1 className="text-white text-2xl font-bold mb-1">
            {mode === "password" ? "Sign in" : mode === "otp-send" ? "Sign in with OTP" : "Verify OTP"}
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            {mode === "password"
              ? "Enter your credentials to access the dashboard"
              : mode === "otp-send"
              ? "We'll send a one-time code to your email"
              : `Enter the OTP sent to ${email}`}
          </p>

          {/* Inline error banner */}
          <AnimatePresence>
            {inlineError && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{inlineError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* ── Password login ── */}
            {mode === "password" && (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handlePasswordLogin}
                className="space-y-4"
              >
                <div>
                  <label className="text-slate-300 text-xs font-medium mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); clearError(); }}
                      placeholder="shahil@gmail.com"
                      autoComplete="email"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 text-xs font-medium mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); clearError(); }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)]"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                    : <><ArrowRight className="w-4 h-4" /> Sign In</>
                  }
                </button>

                {/* Divider */}
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-slate-500 text-xs">or continue with</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* OTP button */}
                <button
                  type="button"
                  onClick={() => { setMode("otp-send"); clearError(); }}
                  className="w-full flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300 font-medium rounded-xl py-2.5 transition text-sm"
                >
                  <KeyRound className="w-4 h-4" />
                  Sign in with OTP
                </button>

                {/* Google button (UI only — OAuth ready) */}
                <button
                  type="button"
                  onClick={() => toast("Google login coming soon!", { icon: "🔜", id: "google" })}
                  className="w-full flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300 font-medium rounded-xl py-2.5 transition text-sm"
                >
                  <Chrome className="w-4 h-4 text-blue-400" />
                  Sign in with Google
                </button>
              </motion.form>
            )}

            {/* ── OTP send ── */}
            {mode === "otp-send" && (
              <motion.form
                key="otp-send"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSendOTP}
                className="space-y-4"
              >
                <div>
                  <label className="text-slate-300 text-xs font-medium mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); clearError(); }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 transition"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    : <><ArrowRight className="w-4 h-4" /> Send OTP</>
                  }
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("password"); clearError(); }}
                  className="w-full text-slate-400 hover:text-white text-sm transition text-center"
                >
                  ← Back to password login
                </button>
              </motion.form>
            )}

            {/* ── OTP verify ── */}
            {mode === "otp-verify" && (
              <motion.form
                key="otp-verify"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleVerifyOTP}
                className="space-y-4"
              >
                {demoOtp && (
                  <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-blue-300 text-sm font-semibold">Your OTP: <span className="tracking-widest">{demoOtp}</span></p>
                      <p className="text-blue-400/70 text-xs">Shown here for demo purposes only</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-slate-300 text-xs font-medium mb-1.5 block">One-Time Password</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); clearError(); }}
                    placeholder="• • • • • •"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg text-center tracking-[0.5em] placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 transition"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                    : <><ArrowRight className="w-4 h-4" /> Verify & Sign In</>
                  }
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("otp-send"); setOtp(""); setDemoOtp(null); clearError(); }}
                  className="w-full text-slate-400 hover:text-white text-sm transition text-center"
                >
                  ← Resend OTP
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Demo credentials hint */}
          <div className="mt-6 rounded-xl px-4 py-3" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 0 8px rgba(99,102,241,0.1)" }}>
            <p className="text-xs text-slate-500">
              <span className="text-slate-400 font-medium">Demo:</span>{" "}
              <button
                type="button"
                onClick={() => { setEmail("shahil@gmail.com"); setPassword("shahil98"); setMode("password"); clearError(); }}
                className="text-blue-400 hover:text-blue-300 transition underline underline-offset-2"
              >
                shahil@gmail.com / shahil98
              </button>
              <span className="text-slate-600 ml-1">(click to fill)</span>
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Make sure the backend is running: <code className="text-slate-500">uvicorn app.main:app --reload</code>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

