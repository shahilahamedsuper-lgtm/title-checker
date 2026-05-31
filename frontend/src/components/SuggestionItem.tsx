import { useState } from "react";

interface SuggestionItemProps {
  suggestion: string;
  index: number;
}

export default function SuggestionItem({ suggestion, index }: SuggestionItemProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left flex items-start gap-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 px-4 py-3 transition group"
      aria-label={`Copy suggestion ${index + 1} to clipboard`}
    >
      {/* Copy icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 mt-0.5 shrink-0 text-slate-400 dark:text-zinc-500 group-hover:text-blue-500 transition"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>

      <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{suggestion}</span>

      {copied && (
        <span className="shrink-0 text-xs font-medium text-green-600 bg-green-100 rounded-full px-2 py-0.5">
          Copied!
        </span>
      )}
    </button>
  );
}
