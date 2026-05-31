import { useState, useMemo, useRef } from "react";
import { useInView } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import type { ExcelAnalysisState, ExcelAnalysisResult } from "../types";
import { SkeletonLoader } from "./ui/SkeletonLoader";
import { NeonButton } from "./ui/NeonButton";
import { colors } from "../styles/tokens";

interface ExcelDashboardProps {
  state: ExcelAnalysisState;
  onDismissError: () => void;
}

type Tab = "summary" | "table" | "charts";

const PAGE_SIZE = 100;

const CHART_COLORS = colors.chartPalette;

// ── Summary Tab ──────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function SummaryTab({ result }: { result: ExcelAnalysisResult }) {
  const totalMissing = result.column_stats.reduce((s, c) => s + c.missing_count, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Rows" value={result.rows.length} />
        <StatCard label="Columns" value={result.headers.length} />
        <StatCard label="Missing Values" value={totalMissing} />
        <StatCard label="Duplicate Rows" value={result.duplicate_row_count} />
      </div>

      {/* Column stats table */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Column Statistics</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-700 border-b border-slate-200 dark:border-zinc-600">
              <tr>
                {["Column", "Type", "Missing", "Unique", "Min", "Max", "Mean"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
              {result.column_stats.map((col) => (
                <tr key={col.name} className="hover:bg-slate-50 dark:hover:bg-zinc-700">
                  <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100 truncate max-w-[160px]">{col.name}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      col.dtype === "numeric" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" :
                      col.dtype === "text" ? "bg-slate-100 dark:bg-zinc-600 text-slate-600 dark:text-slate-300" :
                      col.dtype === "date" ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" :
                      col.dtype === "boolean" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" :
                      "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300"
                    }`}>{col.dtype}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{col.missing_count}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{col.unique_count}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{col.numeric_stats?.min ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{col.numeric_stats?.max ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{col.numeric_stats?.mean ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Summary */}
      <div className="rounded-lg border border-slate-200 dark:border-zinc-700 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-zinc-500 mb-2">AI Summary</p>
        {result.ai_summary ? (
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{result.ai_summary}</p>
        ) : (
          <p className="text-sm text-slate-400 dark:text-zinc-500 italic">AI summary unavailable.</p>
        )}
      </div>
    </div>
  );
}

// ── Data Table Tab ────────────────────────────────────────────────────────────

function DataTableTab({ result }: { result: ExcelAnalysisResult }) {
  const [filterText, setFilterText] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!filterText.trim()) return result.rows;
    const q = filterText.toLowerCase();
    return result.rows.filter((row) =>
      row.some((cell) => cell !== null && String(cell).toLowerCase().includes(q))
    );
  }, [result.rows, filterText]);

  const sorted = useMemo(() => {
    if (sortCol === null) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? "";
      const bv = b[sortCol] ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(idx: number) {
    if (sortCol === idx) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(idx);
      setSortDir("asc");
    }
    setPage(1);
  }

  function handleFilter(v: string) {
    setFilterText(v);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter */}
      <input
        type="text"
        placeholder="Filter rows..."
        value={filterText}
        onChange={(e) => handleFilter(e.target.value)}
        className="w-full rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-zinc-700 border-b border-slate-200 dark:border-zinc-600">
            <tr>
              {result.headers.map((h, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-600 select-none whitespace-nowrap"
                >
                  {h}
                  {sortCol === i && (
                    <span className="ml-1 text-blue-500">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={result.headers.length} className="px-3 py-6 text-center text-slate-400 dark:text-zinc-500 text-sm">
                  No rows match the filter.
                </td>
              </tr>
            ) : (
              pageRows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-zinc-700">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-[200px] truncate">
                      {cell === null ? <span className="text-slate-300 dark:text-zinc-600 italic">null</span> : String(cell)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} rows
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-slate-300 dark:border-zinc-600 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-700"
            >
              Previous
            </button>
            <span className="px-2 py-1 text-xs">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded border border-slate-300 dark:border-zinc-600 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Charts Tab ────────────────────────────────────────────────────────────────

function ChartsTab({ result }: { result: ExcelAnalysisResult }) {
  const chartsRef = useRef<HTMLDivElement>(null);
  const inView = useInView(chartsRef, { once: true });
  // Bar chart: missing values per column
  const missingData = result.column_stats.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    missing: c.missing_count,
  }));

  // Line chart: first numeric column values
  const numericCol = result.column_stats.find((c) => c.dtype === "numeric");
  const numericIdx = numericCol ? result.headers.indexOf(numericCol.name) : -1;
  const lineData = numericIdx >= 0
    ? result.rows.slice(0, 200).map((row, i) => ({
        index: i + 1,
        value: row[numericIdx] as number | null,
      })).filter((d) => d.value !== null)
    : [];

  // Pie chart: first text column with ≤10 unique values
  const pieCol = result.column_stats.find(
    (c) => c.dtype === "text" && c.unique_count <= 10 && c.unique_count > 0
  );
  const pieIdx = pieCol ? result.headers.indexOf(pieCol.name) : -1;
  const pieData = useMemo(() => {
    if (pieIdx < 0) return [];
    const counts: Record<string, number> = {};
    for (const row of result.rows) {
      const v = row[pieIdx];
      if (v !== null) {
        const key = String(v);
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [result.rows, pieIdx]);

  return (
    <div ref={chartsRef} className="flex flex-col gap-8">
      {/* Missing values bar chart */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Missing Values per Column</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={missingData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
            <Bar dataKey="missing" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} isAnimationActive={inView} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart — first numeric column */}
      {lineData.length > 0 && numericCol && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            {numericCol.name} — Values by Row Index
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="index" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[1]} dot={false} strokeWidth={2} isAnimationActive={inView} animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pie chart — first low-cardinality text column */}
      {pieData.length > 0 && pieCol && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            {pieCol.name} — Value Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
                isAnimationActive={inView}
                animationDuration={800}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Main ExcelDashboard ───────────────────────────────────────────────────────

export default function ExcelDashboard({ state, onDismissError }: ExcelDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const tabs: { id: Tab; label: string }[] = [
    { id: "summary", label: "Summary" },
    { id: "table", label: "Data Table" },
    { id: "charts", label: "Charts" },
  ];

  if (state.status === "loading") {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Excel Analysis</h2>
        <SkeletonLoader rows={6} rowHeight={24} />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="p-6 flex flex-col gap-4">
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm font-medium text-red-300">{state.message}</p>
        </div>
        <NeonButton variant="secondary" onClick={onDismissError} className="self-start">
          Dismiss
        </NeonButton>
      </div>
    );
  }

  if (state.status !== "success") return null;

  const { result } = state;

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="pb-0 border-b border-white/10 mb-0">
        <h2 className="text-lg font-semibold text-white mb-4">Excel Analysis</h2>
        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition ${
                activeTab === tab.id
                  ? "border-neon-blue text-neon-blue bg-blue-500/10"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="pt-6">
        {activeTab === "summary" && <SummaryTab result={result} />}
        {activeTab === "table" && <DataTableTab result={result} />}
        {activeTab === "charts" && <ChartsTab result={result} />}
      </div>
    </div>
  );
}
