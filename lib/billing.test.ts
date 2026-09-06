import { describe, expect, it } from "vitest";

import { calculateUsageCost } from "./billing";

describe("usage billing", () => {
  it("calculates input and output token cost correctly", () => {
    const cost = calculateUsageCost(1000, 1000);

    expect(cost).toBeCloseTo(0.003);
  });

  it("calculates the sample usage correctly", () => {
    const cost = calculateUsageCost(8, 175);

    expect(cost).toBeCloseTo(0.000358);
  });
});
