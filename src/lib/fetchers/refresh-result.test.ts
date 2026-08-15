import { describe, expect, it } from "bun:test";
import { isAuthorizedRefresh, refreshHttpStatus } from "./refresh-result";

describe("isAuthorizedRefresh", () => {
  it("requires a configured secret and exact bearer token", () => {
    expect(isAuthorizedRefresh("Bearer secret", "secret")).toBe(true);
    expect(isAuthorizedRefresh(null, "secret")).toBe(false);
    expect(isAuthorizedRefresh("Bearer wrong", "secret")).toBe(false);
    expect(isAuthorizedRefresh("Bearer undefined", undefined)).toBe(false);
  });
});

describe("refreshHttpStatus", () => {
  it("returns success for a complete refresh", () => {
    expect(refreshHttpStatus({ synced: 42, errors: [] })).toBe(200);
  });

  it("marks a partial refresh as multi-status so monitoring cannot report a false green", () => {
    expect(refreshHttpStatus({ synced: 41, errors: ["[reddit] rate limited"] })).toBe(207);
  });

  it("marks a refresh with no successful writes as failed", () => {
    expect(refreshHttpStatus({ synced: 0, errors: ["database unavailable"] })).toBe(500);
  });
});
