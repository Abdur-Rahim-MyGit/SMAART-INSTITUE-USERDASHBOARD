/**
 * UserContext.test.tsx
 * Tests for src/contexts/UserContextFixed.jsx (UserProvider + useUser hook)
 *
 * Mocks:
 *  - @/services/api   (startTokenRenewal, stopTokenRenewal, API_BASE_URL)
 *  - @/utils/assessmentTimerStorage (clearAssessmentTimerStorage)
 *
 * Does NOT mock window.location.replace because jsdom supports it;
 * we spy on it instead.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, renderHook, waitFor } from "@testing-library/react";
import React from "react";

// ── Mock heavy/external dependencies ──────────────────────────
vi.mock("@/services/api", () => ({
  API_BASE_URL: "http://localhost:5000/api",
  startTokenRenewal: vi.fn(),
  stopTokenRenewal: vi.fn(),
}));

vi.mock("@/utils/assessmentTimerStorage", () => ({
  clearAssessmentTimerStorage: vi.fn(),
}));

// Import AFTER mocks are set up
import { UserProvider, useUser, clearCareerAgentStorage } from "@/contexts/UserContextFixed";
import { startTokenRenewal, stopTokenRenewal } from "@/services/api";
import { clearAssessmentTimerStorage } from "@/utils/assessmentTimerStorage";

// ── Helper: render a component wrapped in UserProvider ─────────
const renderWithUserProvider = (ui: React.ReactNode) => {
  return render(<UserProvider>{ui}</UserProvider>);
};

// ── Helper: renderHook wrapped in UserProvider ─────────────────
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>{children}</UserProvider>
);

// ─────────────────────────────────────────────────────────────
// clearCareerAgentStorage (utility exported from context file)
// ─────────────────────────────────────────────────────────────
describe("clearCareerAgentStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("removes known smaart_* keys from localStorage", () => {
    localStorage.setItem("smaart_student_name", "Ali");
    localStorage.setItem("smaart_analysis", "data");
    localStorage.setItem("unrelated_key", "keep-me");

    clearCareerAgentStorage();

    expect(localStorage.getItem("smaart_student_name")).toBeNull();
    expect(localStorage.getItem("smaart_analysis")).toBeNull();
    // Unrelated key should still be present
    expect(localStorage.getItem("unrelated_key")).toBe("keep-me");
  });

  it("does not throw when localStorage is empty", () => {
    expect(() => clearCareerAgentStorage()).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// UserProvider — initial state
// ─────────────────────────────────────────────────────────────
describe("UserProvider — initial state", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders children without crashing", () => {
    renderWithUserProvider(<div data-testid="child">Hello</div>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("starts with user=null when sessionStorage has no user", async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("restores user from sessionStorage on mount", async () => {
    const mockUser = { _id: "u1", email: "test@smaart.edu", fullName: "Test User" };
    sessionStorage.setItem("user", JSON.stringify(mockUser));
    // No token → background fetch is skipped
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.email).toBe("test@smaart.edu");
  });
});

// ─────────────────────────────────────────────────────────────
// UserProvider — login
// ─────────────────────────────────────────────────────────────
describe("UserProvider — login()", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("sets user state after login()", async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const mockUser = { _id: "u42", email: "student@smaart.edu", fullName: "Student One" };

    act(() => {
      result.current.login(mockUser, "fake-jwt-token");
    });

    expect(result.current.user?.email).toBe("student@smaart.edu");
  });

  it("persists user to sessionStorage on login()", async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const mockUser = { _id: "u42", email: "student@smaart.edu" };

    act(() => {
      result.current.login(mockUser, "fake-jwt-token");
    });

    const stored = JSON.parse(sessionStorage.getItem("user") || "null");
    expect(stored?.email).toBe("student@smaart.edu");
  });

  it("persists token to sessionStorage on login()", async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.login({ _id: "u1", email: "x@x.com" }, "my-token-xyz");
    });

    expect(sessionStorage.getItem("token")).toBe("my-token-xyz");
  });

  it("calls startTokenRenewal when a token is provided", async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.login({ _id: "u1", email: "x@x.com" }, "a-token");
    });

    expect(startTokenRenewal).toHaveBeenCalledTimes(1);
  });

  it("does NOT store a token when none is provided", async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.login({ _id: "u1", email: "x@x.com" }, undefined);
    });

    expect(sessionStorage.getItem("token")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// UserProvider — updateUser
// ─────────────────────────────────────────────────────────────
describe("UserProvider — updateUser()", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("merges new fields into existing user state", async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const initialUser = { _id: "u1", email: "a@b.com", fullName: "Old Name" };
    act(() => {
      result.current.login(initialUser, "token");
    });

    act(() => {
      result.current.updateUser({ fullName: "New Name" });
    });

    expect(result.current.user?.fullName).toBe("New Name");
    expect(result.current.user?.email).toBe("a@b.com"); // unchanged
  });

  it("persists updated user to sessionStorage", async () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.login({ _id: "u1", email: "a@b.com" }, "token");
    });

    act(() => {
      result.current.updateUser({ phone: "1234567890" });
    });

    const stored = JSON.parse(sessionStorage.getItem("user") || "null");
    expect(stored?.phone).toBe("1234567890");
  });
});

// ─────────────────────────────────────────────────────────────
// useUser outside UserProvider — fallback
// ─────────────────────────────────────────────────────────────
describe("useUser outside UserProvider", () => {
  it("returns a fallback object instead of crashing", () => {
    // Suppress the console.warn that the fallback fires
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useUser());

    expect(result.current).toBeDefined();
    expect(result.current.user).toBeNull();
    expect(typeof result.current.login).toBe("function");
    expect(typeof result.current.logout).toBe("function");

    warn.mockRestore();
  });
});
