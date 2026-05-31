import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnalysisForm from "../components/AnalysisForm";

describe("AnalysisForm", () => {
  it("renders title input and body textarea", () => {
    render(<AnalysisForm onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/body/i)).toBeInTheDocument();
  });

  it("shows error when submitting with empty title", async () => {
    const user = userEvent.setup();
    render(<AnalysisForm onSubmit={vi.fn()} isLoading={false} />);

    await user.type(screen.getByLabelText(/body/i), "Some body text");
    await user.click(screen.getByRole("button", { name: /analyze/i }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
  });

  it("shows error when submitting with empty body", async () => {
    const user = userEvent.setup();
    render(<AnalysisForm onSubmit={vi.fn()} isLoading={false} />);

    await user.type(screen.getByLabelText(/title/i), "Some title");
    await user.click(screen.getByRole("button", { name: /analyze/i }));

    expect(screen.getByText("Body text is required.")).toBeInTheDocument();
  });

  it("calls onSubmit with correct values when form is valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AnalysisForm onSubmit={onSubmit} isLoading={false} />);

    await user.type(screen.getByLabelText(/title/i), "My Title");
    await user.type(screen.getByLabelText(/body/i), "My body text");
    await user.click(screen.getByRole("button", { name: /analyze/i }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith("My Title", "My body text");
  });
});
