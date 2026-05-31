import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle2, AlertTriangle, XCircle,
  Clock, RefreshCw, Loader2, Sparkles, ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { GlassCard } from "../components/ui/GlassCard";
import { NeonButton } from "../components/ui/NeonButton";
import {
  checkTitleSimilarity,
  fetchSimilarityHistory,
  type SimilarityResult,
  type SimilarityHistoryEntry,
} from "../api/similarityApi";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Unique: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    bar: "bg-emerald-500",
    label: "Unique",
    desc: "This title appears to be unique in the database.",
  },
  Similar: {
    icon: AlertTriangle,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    bar: "bg-yellow-500",
    label: "Similar",
    desc: "This title is similar to existing titles in the database.",
  },
  Duplicate: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    bar: "bg-red-500",
    label: "Duplicate",
    desc: "This title is very similar or identical to an existing title.",
  },
} as const;

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score, status }: { score: number; status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.Unique;
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-slate-400 text-xs">Similarity Score</span>
        <span className={`text-2xl font-bold ${cfg.color}`}>{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${cfg.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: SimilarityResult }) {
  const cfg = STATUS_CONFIG[result.status] ?? STATUS_CONFIG.Unique;
  const Icon = cfg.icon;
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? result.matches : result.matches.slice(0, 3);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result.query}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Status banner */}
        <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
          <div className="flex items-center gap-3 mb-1">
            <Icon className={`w-5 h-5 ${cfg.color} shrink-0`} />
            <span className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</span>
          </div>
          <p className="text-slate-400 text-sm">{cfg.desc}</p>
          <ScoreBar score={result.score} status={result.status} />
        </div>

        {/* Top matches */}
        {result.matches.length > 0 && (
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-3">Top Matching Titles</h3>
            <div className="space-y-2">
              {displayed.map((m, i) => (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-slate-500 text-xs font-mono shrink-0">{i + 1}.</span>
                    <span className="text-white text-sm truncate">{m.title}</span>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${
                    m.score >= 90 ? "text-red-400" : m.score >= 60 ? "text-yellow-400" : "text-emerald-400"
                  }`}>{m.score}%</span>
                </motion.div>
              ))}
            </div>
            {result.matches.length > 3 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="mt-3 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition"
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAll ? "rotate-90" : ""}`} />
                {showAll ? "Show less" : `View all ${result.matches.length} matches`}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── History row ───────────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: SimilarityHistoryEntry }) {
  const cfg = STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.Unique;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm truncate">{entry.query}</p>
        <p className="text-slate-500 text-[11px] mt-0.5">
          {new Date(entry.checked_at).toLocaleString("en-US", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
        {entry.status}
      </span>
      <span className={`text-sm font-bold shrink-0 ${cfg.color}`}>{entry.score}%</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SimilarityCheckerPage() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimilarityResult | null>(null);
  const [history, setHistory] = useState<SimilarityHistoryEntry[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadHistory() {
    setHistLoading(true);
    try {
      const data = await fetchSimilarityHistory(10);
      setHistory(data);
    } catch { /* ignore */ }
    finally { setHistLoading(false); }
  }

  useEffect(() => { loadHistory(); }, []);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Please enter a title to check", { id: "no-title" }); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await checkTitleSimilarity(title.trim());
      setResult(data);
      await loadHistory();
      if (data.status === "Duplicate") toast.error("Duplicate title detected!", { id: "dup" });
      else if (data.status === "Similar") toast("Similar title found — review matches.", { icon: "⚠️", id: "sim" });
      else toast.success("Title appears unique!", { id: "uniq" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSampleTitle(t: string) {
    setTitle(t);
    setResult(null);
    inputRef.current?.focus();
  }

  const samples = [
    "AI based disease prediction system",
    "Blockchain supply chain tracker",
    "Smart irrigation using IoT sensors",
  ];

  return (
    <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Title Similarity Checker</h1>
            <p className="text-slate-400 text-sm">Check if your title is unique or similar to existing titles using AI</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Input + Result ── */}
        <div className="space-y-5">
          {/* Input card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
            <GlassCard className="p-6" spotlightColor="rgba(168,85,247,0.18)">
              <h2 className="text-white font-semibold mb-1">Check Title Similarity</h2>
              <p className="text-slate-400 text-sm mb-5">Enter a new title to check against existing titles</p>

              <form onSubmit={handleCheck} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={title}
                    onChange={e => { setTitle(e.target.value); setResult(null); }}
                    placeholder="Enter your title here…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition"
                  />
                </div>

                <NeonButton
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  loadingLabel="Checking…"
                  className="w-full justify-center"
                  style={{ background: "linear-gradient(to right, #7c3aed, #4f46e5)" } as React.CSSProperties}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Check Similarity
                </NeonButton>
              </form>

              {/* Sample titles */}
              <div className="mt-4">
                <p className="text-slate-500 text-xs mb-2">Try a sample:</p>
                <div className="flex flex-wrap gap-2">
                  {samples.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSampleTitle(s)}
                      className="text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1 transition truncate max-w-[180px]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Result card */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <GlassCard className="p-6" spotlightColor={
                  result.status === "Unique" ? "rgba(16,185,129,0.18)"
                  : result.status === "Duplicate" ? "rgba(239,68,68,0.18)"
                  : "rgba(234,179,8,0.18)"
                }>
                  <h2 className="text-white font-semibold mb-4">Similarity Result</h2>
                  <ResultCard result={result} />
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <GlassCard className="p-8 flex flex-col items-center text-center" disableSpotlight>
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-white font-medium mb-1">No result yet</p>
                <p className="text-slate-400 text-sm">Enter a title above and click "Check Similarity" to see results</p>
              </GlassCard>
            </motion.div>
          )}
        </div>

        {/* ── Right: History ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <GlassCard className="p-6 h-full" spotlightColor="rgba(99,102,241,0.15)">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h2 className="text-white font-semibold">Recent Checked Titles</h2>
              </div>
              <button
                onClick={loadHistory}
                disabled={histLoading}
                className="text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1 transition flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${histLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {histLoading && history.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-8 h-8 text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm">No checks yet</p>
                <p className="text-slate-500 text-xs mt-1">Your checked titles will appear here</p>
              </div>
            ) : (
              <div>
                {history.map((entry, i) => (
                  <motion.div
                    key={`${entry.query}-${i}`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <HistoryRow entry={entry} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* How it works */}
            <div className="mt-6 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p className="text-slate-300 text-xs font-semibold mb-2">How it works</p>
              <ul className="space-y-1.5 text-slate-500 text-xs">
                <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">●</span>TF-IDF cosine similarity compares your title against the corpus</li>
                <li className="flex items-start gap-2"><span className="text-yellow-400 shrink-0">●</span>Score ≥ 60% → Similar · Score ≥ 90% → Duplicate</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 shrink-0">●</span>Corpus grows automatically as files are uploaded</li>
              </ul>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}


