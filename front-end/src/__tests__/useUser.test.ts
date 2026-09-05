/**
 * useUser.test.ts
 * Tests for src/hooks/useUser.js
 *
 * useUser.js is a thin re-export of useUser from UserContextFixed.jsx.
 * These tests confirm the re-export wires correctly: the hook returns the
 * same shape as the context and the fallback still works when called outside
 * a UserProvider.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";

// Mock external dependencies that UserContextFixed.jsx pulls in
vi.mock("@/services/api", () => ({
  API_BASE_URL: "http://localhost:5000/api",
  startTokenRenewal: vi.fn(),
  stopTokenRenewal: vi.fn(),
}));

vi.mock("@/utils/assessmentTimerStorage", () => ({
  clearAssessmentTimerStorage: vi.fn(),
}));

// Import AFTER mocks are set
import useUser from "@/hooks/useUser";
import { UserProvider } from "@/contexts/UserContextFixed";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(UserProvider, null, children);

describe("useUser hook (re-export)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("returns an object with user, loading, login, logout, updateUser, refreshUser", async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current).toHaveProperty("user");
    expect(result.current).toHaveProperty("loading");
    expect(typeof result.current.login).toBe("function");
    expect(typeof result.current.logout).toBe("function");
    expect(typeof result.current.updateUser).toBe("function");
    expect(typeof result.current.refreshUser).toBe("function");
  });

  it("returns null user when sessionStorage is empty", async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("returns user from sessionStorage on initialisation", async () => {
    const mockUser = { _id: "u5", email: "hook@smaart.edu" };
    sessionStorage.setItem("user", JSON.stringify(mockUser));

    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user?.email).toBe("hook@smaart.edu");
  });

  it("sets user after calling login()", async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.login({ _id: "u6", email: "new@smaart.edu" }, "tok");
    });

    expect(result.current.user?.email).toBe("new@smaart.edu");
  });

  it("returns a fallback when used outside UserProvider (no crash)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useUser());

    expect(result.current).toBeDefined();
    expect(result.current.user).toBeNull();
    expect(typeof result.current.login).toBe("function");

    warn.mockRestore();
  });
});
