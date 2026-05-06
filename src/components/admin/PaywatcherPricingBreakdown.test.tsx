import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaywatcherPricingBreakdown } from "./PaywatcherPricingBreakdown";

describe("PaywatcherPricingBreakdown", () => {
  it("shows network cost, service fee, margin, and total", () => {
    render(<PaywatcherPricingBreakdown amountUsdc={100} />);
    expect(screen.getByText(/Network cost/i)).toBeInTheDocument();
    expect(screen.getByText("$0.05")).toBeInTheDocument();
    expect(screen.getByText("$0.50")).toBeInTheDocument();
    expect(screen.getByText(/\+\$0\.45/)).toBeInTheDocument();
    expect(screen.getByText("$100.50")).toBeInTheDocument();
    expect(screen.getByText(/100\.00 USDC/)).toBeInTheDocument();
  });
});