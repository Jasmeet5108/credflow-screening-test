import { describe, expect, it } from "vitest";

import { PROVISIONING_TIME_MS, shouldMarkDeploymentReady } from "./deployment";

describe("deployment provisioning", () => {
  it("becomes ready after 10 seconds", () => {
    const now = Date.now();

    const createdAt = new Date(now - PROVISIONING_TIME_MS);

    expect(shouldMarkDeploymentReady("provisioning", createdAt, now)).toBe(
      true,
    );
  });

  it("does not become ready before 10 seconds", () => {
    const now = Date.now();

    const createdAt = new Date(now - 5_000);

    expect(shouldMarkDeploymentReady("provisioning", createdAt, now)).toBe(
      false,
    );
  });
});
