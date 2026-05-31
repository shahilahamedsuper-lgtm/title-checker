import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ResultsPanel from "../components/ResultsPanel";
import type { PanelState } from "../types";

describe("ResultsPanel", () => {
  it("renders placeholder when status is idle", () => {
    const state: PanelState = { status: "idle" };
    render(<ResultsPanel state={state} />);
    expect(screen.getByText(/submit content to see analysis results/i)).toBeInTheDocument();
  });

  it("renders spinner when status is loading", () => {
    const state: PanelState = { status: "loading" };
    render(<ResultsPanel state={state} />);
    expect(screen.getByText(/analyzing your content/i)).toBeInTheDocument();
  });

  it("renders error message when status is error", () => {
    const state: PanelState = { status: "error", message: "Something went wrong" };
    render(<ResultsPanel state={state} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders analysis results when status is success", () => {
    const state: PanelState = {
      status: "success",
      result: {
        meaning: "This text discusses testing.",
        tone: "Neutral",
        clarity_score: 85,
        suggestions: ["Be more concise.", "Add examples."],
      },
    };
    render(<ResultsPanel state={state} />);

    expect(screen.getByText("This text discusses testing.")).toBeInTheDocument();
    expect(screen.getByText("Neutral")).toBeInTheDocument();
    expect(screen.getByText("85/100")).toBeInTheDocument();
    expect(screen.getByText("Be more concise.")).toBeInTheDocument();
    expect(screen.getByText("Add examples.")).toBeInTheDocument();
  });
});
