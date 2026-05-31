import { useState, useEffect } from "react";
import CharCounter from "./CharCounter";
import FieldError from "./FieldError";
import { NeonButton } from "./ui/NeonButton";

const TITLE_MAX = 200;
const TEXT_MAX = 5000;

interface AnalysisFormProps {
  onSubmit: (title: string, text: string) => void;
  isLoading: boolean;
  externalTitle?: string;
  externalText?: string;
}

export default function AnalysisForm({ onSubmit, isLoading, externalTitle, externalText }: AnalysisFormProps) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [titleError, setTitleError] = useState<string | undefined>();
  const [textError, setTextError] = useState<string | undefined>();

  useEffect(() => {
    if (externalTitle !== undefined) setTitle(externalTitle);
  }, [externalTitle]);

  useEffect(() => {
    if (externalText !== undefined) setText(externalText);
  }, [externalText]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let valid = true;

    if (!title.trim()) {
      setTitleError("Title is required.");
      valid = false;
    } else if (title.length > TITLE_MAX) {
      setTitleError(`Title must be ${TITLE_MAX} characters or fewer.`);
      valid = false;
    } else {
      setTitleError(undefined);
    }

    if (!text.trim()) {
      setTextError("Body text is required.");
      valid = false;
    } else if (text.length > TEXT_MAX) {
      setTextError(`Body must be ${TEXT_MAX} characters or fewer.`);
      valid = false;
    } else {
      setTextError(undefined);
    }

    if (valid) {
      onSubmit(title, text);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-5">Analyze Content</h2>
      <form onSubmit={handleSubmit} noValidate>
        {/* Title field */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="title" className="text-sm font-medium text-slate-300">
              Title
            </label>
            <CharCounter current={title.length} max={TITLE_MAX} />
          </div>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your content"
            className="w-full rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,130,246,0.3)", boxShadow: "inset 0 0 8px rgba(59,130,246,0.04)" }}
          />
          <FieldError message={titleError} />
        </div>

        {/* Body field */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="body" className="text-sm font-medium text-slate-300">
              Body
            </label>
            <CharCounter current={text.length} max={TEXT_MAX} />
          </div>
          <textarea
            id="body"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your content here..."
            rows={6}
            className="w-full rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition resize-y" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,130,246,0.3)", boxShadow: "inset 0 0 8px rgba(59,130,246,0.04)" }}
          />
          <FieldError message={textError} />
        </div>

        {/* Submit */}
        <NeonButton
          type="submit"
          variant="primary"
          isLoading={isLoading}
          loadingLabel="Analyzing…"
          tooltip="Analyze file content for meaning, tone & clarity"
          className="w-full"
        >
          Analyze
        </NeonButton>
      </form>
    </div>
  );
}

