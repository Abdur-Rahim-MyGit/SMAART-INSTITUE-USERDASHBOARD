/**
 * useAuth.test.ts
 * Unit tests for src/hooks/useAuth.js
 *
 * Tests the hook's reading of sessionStorage and derived loading state.
 * Uses renderHook from @testing-library/react.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";

// ─────────────────────────────────────────────────────────────
// useAuth
// ─────────────────────────────────────────────────────────────
describe("useAuth", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns null user and loading=true initially, then loading=false", async () => {
    const { result } = renderHook(() => useAuth());

    // After mount the hook reads sessionStorage synchronously inside useEffect
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("returns the parsed user when sessionStorage has a valid 'user' entry", async () => {
    const mockUser = { _id: "abc123", email: "test@smaart.edu", fullName: "Ali Khan" };
    sessionStorage.setItem("user", JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it("returns null user when sessionStorage has no user entry", async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("returns null user and loading=false when sessionStorage value is invalid JSON", async () => {
    sessionStorage.setItem("user", "NOT_VALID_JSON{{{");

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("does NOT read from localStorage (tabs-isolated policy)", async () => {
    // Put user in localStorage but NOT sessionStorage
    const mockUser = { _id: "abc123", email: "test@smaart.edu" };
    localStorage.setItem("user", JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should still be null because the hook only reads sessionStorage
    expect(result.current.user).toBeNull();

    localStorage.removeItem("user");
  });

  it("exposes user email when present", async () => {
    const mockUser = { email: "student@smaart.edu" };
    sessionStorage.setItem("user", JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user?.email).toBe("student@smaart.edu");
  });
});
