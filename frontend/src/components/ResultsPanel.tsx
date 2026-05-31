import { AnimatePresence, motion } from "framer-motion";
import type { PanelState } from "../types";
import SuggestionItem from "./SuggestionItem";
import { crossFadeVariants } from "../styles/tokens";

interface ResultsPanelProps {
  state: PanelState;
}

function clarityColor(score: number): string {
  if (score < 40) return "bg-red-500";
  if (score <= 70) return "bg-yellow-400";
  return "bg-emerald-500";
}

function clarityLabel(score: number): string {
  if (score < 40) return "text-red-400";
  if (score <= 70) return "text-yellow-400";
  return "text-emerald-400";
}

export default function ResultsPanel({ state }: ResultsPanelProps) {
  return (
    <div className="min-h-[320px] flex flex-col">
      <AnimatePresence mode="wait">
        {state.status === "idle" && (
          <motion.div
            key="idle"
            variants={crossFadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">Submit content to see analysis results</p>
          </motion.div>
        )}

        {state.status === "loading" && (
          <motion.div
            key="loading"
            variants={crossFadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col items-center justify-center gap-3 py-8"
          >
            <svg
              className="animate-spin h-8 w-8 text-neon-blue"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-slate-400 text-sm">Analyzing your content…</p>
          </motion.div>
        )}

        {state.status === "error" && (
          <motion.div
            key="error"
            variants={crossFadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col justify-center"
          >
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-400 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-300">{state.message}</p>
                  <p className="text-xs text-red-400 mt-1">Please check your input and try again.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {state.status === "success" && (
          <motion.div
            key="success"
            variants={crossFadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col gap-6"
          >
            <h2 className="text-lg font-semibold text-white">Analysis Results</h2>

            {/* Meaning */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Meaning</p>
              <p className="text-sm text-slate-300 leading-relaxed">{state.result.meaning}</p>
            </div>

            {/* Tone */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Tone</p>
              <span className="inline-block bg-blue-500/20 text-neon-blue text-xs font-medium rounded-full px-3 py-1 border border-blue-500/30">
                {state.result.tone}
              </span>
            </div>

            {/* Clarity score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Clarity Score</p>
                <span className={`text-sm font-semibold ${clarityLabel(state.result.clarity_score)}`}>
                  {state.result.clarity_score}/100
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${clarityColor(state.result.clarity_score)}`}
                  style={{ width: `${state.result.clarity_score}%` }}
                  role="progressbar"
                  aria-valuenow={state.result.clarity_score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>

            {/* Suggestions */}
            {state.result.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Suggestions <span className="normal-case font-normal text-slate-500">(click to copy)</span>
                </p>
                <div className="flex flex-col gap-2">
                  {state.result.suggestions.map((s, i) => (
                    <SuggestionItem key={i} suggestion={s} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
