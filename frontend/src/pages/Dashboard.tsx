import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search, Sparkles, Trash2, MessageSquare, ArrowRight,
  Database, Columns, AlertTriangle, Copy, Upload,
  FileSpreadsheet, MoreVertical, Brain, TrendingUp, TrendingDown,
  RefreshCw, Loader2, CheckCircle2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";
import { GlassCard } from "../components/ui/GlassCard";
import { NeonButton } from "../components/ui/NeonButton";
import { useAuth } from "../context/AuthContext";
import { fetchDashboardStats, fetchHistory, type DashboardStats, type HistoryEntry } from "../api/dashboardApi";
import { uploadFile } from "../api/uploadApi";
import { deduplicateText } from "../api/deduplicateApi";
import type { UploadResult } from "../types";

function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spotlight-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spotlight-y", `${e.clientY - rect.top}px`);
    el.style.setProperty("--spotlight-opacity", "1");
  }, []);
  const onMouseLeave = useCallback(() => {
    ref.current?.style.setProperty("--spotlight-opacity", "0");
  }, []);
  return { ref, onMouseMove, onMouseLeave };
}

const FALLBACK_LINE = [
  { day: "Mon", value: 400 }, { day: "Tue", value: 700 },
  { day: "Wed", value: 1100 }, { day: "Thu", value: 1450 },
  { day: "Fri", value: 1200 }, { day: "Sat", value: 900 }, { day: "Sun", value: 480 },
];

const quickActions = [
  { label: "Analyze Excel", desc: "Analyze your file with AI", icon: Search,
    gradient: "from-blue-600/20 to-cyan-600/10", border: "border-blue-500/30",
    iconBg: "bg-blue-500/20", iconColor: "text-neon-blue",
    glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]", route: "/analyze-excel" },
  { label: "Populate Form", desc: "Extract and populate data", icon: Sparkles,
    gradient: "from-purple-600/20 to-pink-600/10", border: "border-purple-500/30",
    iconBg: "bg-purple-500/20", iconColor: "text-neon-purple",
    glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]", route: "/upload" },
  { label: "Remove Duplicates", desc: "Clean and optimize data", icon: Trash2,
    gradient: "from-pink-600/20 to-rose-600/10", border: "border-pink-500/30",
    iconBg: "bg-pink-500/20", iconColor: "text-pink-400",
    glow: "hover:shadow-[0_0_30px_rgba(236,72,153,0.25)]", route: null },
  { label: "Chat with File", desc: "Ask AI about your data", icon: MessageSquare,
    gradient: "from-emerald-600/20 to-teal-600/10", border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400",
    glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]", route: "/chat" },
];

const statCardDefs = [
  { label: "Total Rows", key: "total_rows", icon: Database,
    iconBg: "bg-blue-500/10", iconColor: "text-neon-blue",
    border: "border-blue-500/20", glow: "shadow-[0_0_20px_rgba(59,130,246,0.08)]",
    spotClass: "spotlight-blue", fallback: "0" },
  { label: "Total Columns", key: "total_columns", icon: Columns,
    iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400",
    border: "border-emerald-500/20", glow: "shadow-[0_0_20px_rgba(16,185,129,0.08)]",
    spotClass: "spotlight-green", fallback: "0" },
  { label: "Missing Values", key: "missing_values", icon: AlertTriangle,
    iconBg: "bg-orange-500/10", iconColor: "text-orange-400",
    border: "border-orange-500/20", glow: "shadow-[0_0_20px_rgba(249,115,22,0.08)]",
    spotClass: "spotlight-orange", fallback: "0" },
  { label: "Duplicate Rows", key: "duplicate_rows", icon: Copy,
    iconBg: "bg-pink-500/10", iconColor: "text-pink-400",
    border: "border-pink-500/20", glow: "shadow-[0_0_20px_rgba(236,72,153,0.08)]",
    spotClass: "spotlight-pink", fallback: "0" },
];

// ── PART_BREAK ──

function AnimatedSection({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      className={className}
    >{children}</motion.div>
  );
}

function UploadCard({ onUploaded }: { onUploaded: (r: UploadResult) => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    setUploading(true); setProgress(0); setDone(null);
    try {
      const r = await uploadFile(file, setProgress);
      setDone(r); onUploaded(r);
      toast.success(`"${r.filename}" uploaded!`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploading(false); }
  }

  return (
    <GlassCard className="overflow-hidden" spotlightColor="rgba(6,182,212,0.18)">
      <div
        className={`relative flex flex-col sm:flex-row items-center gap-6 px-6 py-5 transition-all ${dragging ? "bg-blue-500/5" : ""} ${uploading ? "cursor-wait" : "cursor-pointer"}`}
        onDragOver={e => { e.preventDefault(); if (!uploading) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f && !uploading) handle(f); }}
        onClick={() => { if (!uploading) inputRef.current?.click(); }}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.pdf,.docx,.txt" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${done ? "bg-emerald-500/20 border-emerald-500/30" : "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30"}`}>
          {uploading ? <Loader2 className="w-7 h-7 text-neon-blue animate-spin" />
            : done ? <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            : <Upload className="w-7 h-7 text-neon-blue" />}
        </div>
        <div className="flex-1 min-w-0">
          {uploading ? (
            <><h3 className="text-white font-semibold text-lg">Uploading…</h3>
            <div className="mt-2 w-full max-w-xs">
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-slate-400 text-xs mt-1">{progress}% complete</p>
            </div></>
          ) : done ? (
            <><h3 className="text-white font-semibold text-lg truncate">{done.filename}</h3>
            <p className="text-emerald-400 text-sm mt-0.5">Upload complete — ready to analyze</p>
            <button onClick={e => { e.stopPropagation(); setDone(null); }} className="text-slate-500 hover:text-slate-300 text-xs mt-1 transition">Upload another</button></>
          ) : (
            <><h3 className="text-white font-semibold text-lg">Upload Your File</h3>
            <p className="text-slate-400 text-sm mt-0.5">Drag &amp; drop your file here</p>
            <p className="text-sm mt-0.5">or <span className="text-neon-blue hover:underline">click to browse</span></p></>
          )}
        </div>
        <div className="hidden sm:block absolute right-48 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-br from-blue-500/25 to-purple-600/15 blur-2xl pointer-events-none" />
        {!uploading && !done && (
          <div className="shrink-0 ml-auto flex flex-col items-end gap-1" onClick={e => e.stopPropagation()}>
            <NeonButton variant="secondary" onClick={() => inputRef.current?.click()} className="gap-2">
              <Upload className="w-4 h-4" />Browse File
            </NeonButton>
            <p className="text-slate-500 text-xs">xlsx, xls, csv, pdf, docx</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function QuickActionCard({ action, uploadedFile, onRefresh }: {
  action: typeof quickActions[0];
  uploadedFile: UploadResult | null;
  onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const { ref, onMouseMove, onMouseLeave } = useSpotlight<HTMLButtonElement>();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (action.route && action.label !== "Remove Duplicates") { navigate(action.route); return; }
    if (!uploadedFile) { toast.error("Upload a file first", { id: "no-file" }); return; }
    setLoading(true);
    try {
      await deduplicateText(uploadedFile.extracted_text, uploadedFile.content_type);
      toast.success("Duplicates removed!"); onRefresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Action failed"); }
    finally { setLoading(false); }
  }

  const spotMap: Record<string, string> = {
    "Analyze Excel": "spotlight-blue", "Populate Form": "spotlight-purple",
    "Remove Duplicates": "spotlight-pink", "Chat with File": "spotlight-green",
  };

  return (
    <motion.button ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      onClick={handleClick} disabled={loading}
      whileHover={loading ? {} : { scale: 1.02 }} whileTap={loading ? {} : { scale: 0.98 }}
      className={`spotlight-card ${spotMap[action.label] ?? "spotlight-blue"} relative flex items-center gap-3 p-4 rounded-xl border bg-gradient-to-br ${action.gradient} ${action.border} transition-all duration-200 ${action.glow} text-left group disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      <div className={`w-9 h-9 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0`}>
        {loading ? <Loader2 className={`w-4 h-4 ${action.iconColor} animate-spin`} />
          : <action.icon className={`w-4 h-4 ${action.iconColor}`} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold leading-tight">{action.label}</p>
        <p className="text-slate-400 text-xs mt-0.5 leading-tight">{action.desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
    </motion.button>
  );
}

// ── PART_BREAK_2 ──

function StatCardItem({ def, stats }: { def: typeof statCardDefs[0]; stats: DashboardStats | null }) {
  const { ref, onMouseMove, onMouseLeave } = useSpotlight<HTMLDivElement>();
  const raw = stats ? (stats as unknown as Record<string, number>)[def.key] ?? 0 : null;
  const value = raw !== null ? raw.toLocaleString() : def.fallback;
  return (
    <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      className={`spotlight-card ${def.spotClass} relative rounded-xl border ${def.border} ${def.glow} bg-white/[0.04] p-4`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-slate-400 text-xs font-medium">{def.label}</p>
        <div className={`w-8 h-8 rounded-lg ${def.iconBg} flex items-center justify-center`}>
          <def.icon className={`w-4 h-4 ${def.iconColor}`} />
        </div>
      </div>
      <p className="text-white text-2xl font-bold">{value}</p>
      <div className="flex items-center gap-1 mt-1.5">
        {stats ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-slate-600" />}
        <span className="text-slate-500 text-xs">{stats ? "from last analysis" : "no data yet"}</span>
      </div>
    </div>
  );
}

function DonutChart({ stats, history }: { stats: DashboardStats | null; history: HistoryEntry[] }) {
  const hasData = stats !== null && (stats.total_rows > 0 || stats.files_analyzed > 0);
  const total = hasData ? Math.max(stats!.total_rows, 1) : 0;
  const missing = hasData ? Math.min(stats!.missing_values, total) : 0;
  const dupes = hasData ? Math.min(stats!.duplicate_rows, total) : 0;
  const valid = hasData ? Math.max(0, total - missing - dupes) : 0;
  const pct = hasData && total > 0 ? Math.round((valid / total) * 100) : 0;
  const analyzed = history.filter(h => h.status === "analyzed").length;
  const failed = history.filter(h => h.status === "failed").length;
  const total_ops = history.length;

  const data = hasData
    ? [
        { name: "Valid Data",   value: Math.max(valid, 1),   color: "#3b82f6" },
        { name: "Missing Data", value: Math.max(missing, 0), color: "#ec4899" },
        { name: "Duplicates",   value: Math.max(dupes, 0),   color: "#f43f5e" },
      ].filter(d => d.value > 0)
    : total_ops > 0
    ? [
        { name: "Analyzed", value: Math.max(analyzed, 1), color: "#3b82f6" },
        { name: "Failed",   value: Math.max(failed, 0),   color: "#f43f5e" },
      ].filter(d => d.value > 0)
    : [{ name: "No data", value: 1, color: "#1e293b" }];

  const displayPct = hasData ? `${pct}%` : total_ops > 0 ? `${analyzed}/${total_ops}` : "—";
  const displayLabel = hasData ? "Quality Score" : total_ops > 0 ? "Files OK" : "No data";

  return (
    <GlassCard className="p-5 h-full" spotlightColor="rgba(59,130,246,0.18)">
      <h2 className="text-slate-300 text-sm font-semibold mb-4">Data Quality Overview</h2>
      {!hasData && total_ops === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center">
            <span className="text-slate-500 text-xs text-center px-4">Analyze an Excel file to see quality data</span>
          </div>
          <p className="text-slate-500 text-xs">Upload → Analyze Excel to populate</p>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="relative w-40 h-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={data.length > 1 ? 3 : 0} dataKey="value" isAnimationActive animationDuration={800}>
                  {data.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                </Pie>
                <RechartsTooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-white text-2xl font-bold">{displayPct}</span>
              <span className="text-slate-400 text-[10px]">{displayLabel}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {data.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-400 text-xs">{d.name}</span>
                </div>
                <span className="text-white text-xs font-semibold">{d.name === "No data" ? "—" : d.value}</span>
              </div>
            ))}
            {hasData && (
              <div className="mt-1 pt-2 border-t border-white/5">
                <p className="text-slate-500 text-[11px]">Based on last Excel analysis</p>
              </div>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

// ── PART_BREAK_3 ──

function DataTrendsChart({ history }: { history: HistoryEntry[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const dayData: Record<string, number> = {};
  days.forEach(d => { dayData[d] = 0; });
  history.forEach(h => {
    const d = new Date(h.uploaded_at);
    const diffMs = now.getTime() - d.getTime();
    if (diffMs <= 7 * 24 * 60 * 60 * 1000) {
      const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      dayData[days[dayIdx]] = (dayData[days[dayIdx]] ?? 0) + 1;
    }
  });
  const hasRealData = Object.values(dayData).some(v => v > 0);
  const data = hasRealData ? days.map(day => ({ day, value: dayData[day] })) : FALLBACK_LINE;
  const weekCount = history.filter(h => {
    const diffMs = now.getTime() - new Date(h.uploaded_at).getTime();
    return diffMs <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <GlassCard className="p-5 h-full" spotlightColor="rgba(168,85,247,0.18)">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-300 text-sm font-semibold">Data Trends</h2>
        <div className="flex items-center gap-2">
          {!hasRealData && <span className="text-[10px] text-slate-600 italic">sample</span>}
          <span className="text-xs text-slate-500 border border-white/10 rounded-lg px-3 py-1">This Week</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <RechartsTooltip
            contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [v, "Files"]}
          />
          <Line type="monotone" dataKey="value" stroke="url(#lineGrad)" strokeWidth={2.5}
            dot={{ fill: "#a855f7", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#3b82f6" }}
            isAnimationActive animationDuration={800} />
        </LineChart>
      </ResponsiveContainer>
      {hasRealData && (
        <p className="text-slate-600 text-[11px] mt-2 text-right">{weekCount} file operations this week</p>
      )}
    </GlassCard>
  );
}

function RecentFilesCard({ history }: { history: HistoryEntry[] }) {
  const statusStyle: Record<string, string> = {
    analyzed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    pending:  "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    failed:   "text-red-400 bg-red-400/10 border-red-400/20",
  };
  const shown = history.slice(0, 5);
  return (
    <GlassCard className="p-5 h-full" spotlightColor="rgba(16,185,129,0.15)">
      <h2 className="text-slate-300 text-sm font-semibold mb-4">Recent Files</h2>
      {shown.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">No files yet. Upload a file to get started.</p>
      ) : (
        <div className="space-y-3">
          {shown.map((file) => (
            <div key={file.id} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{file.filename}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {new Date(file.uploaded_at).toLocaleString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${statusStyle[file.status] ?? statusStyle.pending}`}>
                {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
              </span>
              <button className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-white">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function AIInsightsCard({ stats }: { stats: DashboardStats | null }) {
  const n = stats?.files_analyzed ?? 0;
  return (
    <GlassCard className="p-5 h-full" spotlightColor="rgba(168,85,247,0.20)">
      <h2 className="text-slate-300 text-sm font-semibold mb-4">AI Insights</h2>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
          <Brain className="w-6 h-6 text-neon-purple" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">
            {n > 0 ? `${n} file${n !== 1 ? "s" : ""} analyzed. Data quality is excellent! 🎉` : "Upload and analyze a file to see AI insights."}
          </p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            {n > 0 ? "Your data is clean and ready to use." : "Start by uploading an Excel or CSV file."}
          </p>
          <NeonButton variant="primary" className="mt-3 text-xs py-2 px-4">View Details →</NeonButton>
        </div>
      </div>
    </GlassCard>
  );
}

// ── PART_BREAK_4 ──

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);

  const loadData = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [s, h] = await Promise.allSettled([fetchDashboardStats(), fetchHistory()]);
      if (s.status === "fulfilled") setStats(s.value);
      if (h.status === "fulfilled") setHistory(h.value);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-[1400px] mx-auto space-y-5">
      <AnimatedSection>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Welcome back, {user?.name ?? "Admin"} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">Upload, analyze and validate your content with AI</p>
          </div>
          <button onClick={loadData} disabled={statsLoading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition">
            <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.05}>
        <UploadCard onUploaded={(r) => { setUploadedFile(r); loadData(); }} />
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <GlassCard className="p-5" spotlightColor="rgba(99,102,241,0.12)">
          <h2 className="text-slate-300 text-sm font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {quickActions.map(a => (
              <QuickActionCard key={a.label} action={a} uploadedFile={uploadedFile} onRefresh={loadData} />
            ))}
          </div>
        </GlassCard>
      </AnimatedSection>

      <AnimatedSection delay={0.15}>
        <GlassCard className="p-5" spotlightColor="rgba(99,102,241,0.10)">
          <h2 className="text-slate-300 text-sm font-semibold mb-4">Excel Analysis Summary</h2>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {statCardDefs.map(d => <StatCardItem key={d.label} def={d} stats={stats} />)}
          </div>
        </GlassCard>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AnimatedSection delay={0.2}><DonutChart stats={stats} history={history} /></AnimatedSection>
        <AnimatedSection delay={0.25}><DataTrendsChart history={history} /></AnimatedSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AnimatedSection delay={0.3}><RecentFilesCard history={history} /></AnimatedSection>
        <AnimatedSection delay={0.35}><AIInsightsCard stats={stats} /></AnimatedSection>
      </div>
    </div>
  );
}
