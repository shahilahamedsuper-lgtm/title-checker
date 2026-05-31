import { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, Eye, EyeOff, LogOut } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { NeonButton } from "../components/ui/NeonButton";
import { sectionVariants } from "../styles/tokens";
import { useAuth } from "../context/AuthContext";
import { updateProfile, changePassword } from "../api/authApi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-blue-600" : "bg-white/10"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile
  const [name, setName] = useState(user?.name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Preferences
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setSavingProfile(true);
    try {
      await updateProfile(name.trim());
      await refreshUser();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    setSavingPw(true);
    try {
      await changePassword(currentPw, newPw);
      toast.success("Password changed successfully!");
      setCurrentPw(""); setNewPw("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  }

  function handleLogout() {
    logout();
    toast.success("Logged out");
    navigate("/login", { replace: true });
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and application preferences</p>
      </motion.div>

      <div className="space-y-4">
        {/* Profile card */}
        <motion.div variants={sectionVariants} initial="hidden" animate="visible">
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" /> Profile
            </h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                {(user?.name ?? "A")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold">{user?.name ?? "Admin User"}</p>
                <p className="text-slate-400 text-sm">{user?.email ?? ""}</p>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Pro Plan
                </span>
              </div>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-slate-300 text-xs font-medium mb-1.5 block">Display Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                />
              </div>
              <div>
                <label className="text-slate-300 text-xs font-medium mb-1.5 block">Email</label>
                <input
                  value={user?.email ?? ""}
                  disabled
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2.5 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
              <NeonButton type="submit" variant="primary" isLoading={savingProfile} loadingLabel="Saving…" className="text-sm">
                Save Profile
              </NeonButton>
            </form>
          </GlassCard>
        </motion.div>

        {/* Change password */}
        <motion.div variants={sectionVariants} initial="hidden" animate="visible">
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-slate-300 text-xs font-medium mb-1.5 block">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-10 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-slate-300 text-xs font-medium mb-1.5 block">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-10 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <NeonButton type="submit" variant="success" isLoading={savingPw} loadingLabel="Updating…" className="text-sm">
                Update Password
              </NeonButton>
            </form>
          </GlassCard>
        </motion.div>

        {/* Preferences */}
        <motion.div variants={sectionVariants} initial="hidden" animate="visible">
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-400" /> Preferences
            </h3>
            <div className="space-y-4">
              {[
                { label: "Push Notifications", desc: "Receive alerts when analysis completes", value: notifications, set: () => setNotifications(v => !v) },
                { label: "Email Alerts", desc: "Get email summaries of your activity", value: emailAlerts, set: () => setEmailAlerts(v => !v) },
                { label: "Auto-Analyze on Upload", desc: "Automatically start analysis after file upload", value: autoAnalyze, set: () => setAutoAnalyze(v => !v) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle checked={item.value} onChange={item.set} />
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Danger zone */}
        <motion.div variants={sectionVariants} initial="hidden" animate="visible">
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <LogOut className="w-4 h-4 text-red-400" /> Session
            </h3>
            <p className="text-slate-400 text-sm mb-4">Sign out of your account on this device.</p>
            <NeonButton variant="danger" onClick={handleLogout} className="text-sm">
              Sign Out
            </NeonButton>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
