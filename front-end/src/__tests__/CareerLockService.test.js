import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchLockStatus, markModalShown } from "../services/CareerLockService";

describe("CareerLockService", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("fetchLockStatus", () => {
    it("fetches status successfully and returns JSON payload", async () => {
      const mockStatus = {
        isLocked: true,
        remainingDays: 5,
        remainingAttempts: 2,
        firstVisitModalShown: true,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockStatus,
      });

      const result = await fetchLockStatus();

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/career-agent/direction-lock/status",
        { credentials: "include" }
      );
      expect(result).toEqual(mockStatus);
    });

    it("returns null on 401 Unauthorized", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await fetchLockStatus();
      expect(result).toBeNull();
    });

    it("returns null on non-ok HTTP status (e.g. 500)", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await fetchLockStatus();
      expect(result).toBeNull();
    });

    it("returns null when fetch throws network error", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network failed"));

      const result = await fetchLockStatus();
      expect(result).toBeNull();
    });
  });

  describe("markModalShown", () => {
    it("sends PUT request to /api/career-agent/direction-lock/mark-modal-shown", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await markModalShown();

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/career-agent/direction-lock/mark-modal-shown",
        {
          method: "PUT",
          credentials: "include",
        }
      );
    });

    it("catches error silently if fetch throws network error", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Connection error"));

      await expect(markModalShown()).resolves.toBeUndefined();
    });
  });
});
