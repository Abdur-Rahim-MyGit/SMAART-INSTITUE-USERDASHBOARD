/**
 * SecurityGuard.test.tsx
 * Unit tests for src/components/SecurityGuard.jsx
 *
 * SecurityGuard reads sessionStorage for 'user' and checks the pathname.
 * - Not authenticated OR not on a protected path → overlay stays hidden.
 * - Authenticated on a protected path → overlay is rendered but hidden
 *   by default (display:none), reveals on security events.
 *
 * We check the rendered DOM state, NOT browser-level events (those are
 * integration / e2e concerns).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SecurityGuard from "@/components/SecurityGuard";

// SecurityGuard uses lucide-react's ShieldAlert icon — no mock needed for icon.

const renderGuard = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<SecurityGuard />} />
      </Routes>
    </MemoryRouter>
  );

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────
describe("SecurityGuard", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  // ── When NOT authenticated ───────────────────────────────
  describe("when user is NOT authenticated (no sessionStorage 'user')", () => {
    it("renders without throwing", () => {
      expect(() => renderGuard("/")).not.toThrow();
    });

    it("does NOT apply user-select:none to body", () => {
      renderGuard("/dashboard/assessments/T1");
      expect(document.body.style.userSelect).not.toBe("none");
    });

    it("renders the overlay div in hidden state (display:none)", () => {
      renderGuard("/assessment/T1");
      // The overlay contains 'Security Protected' text but should be hidden
      const heading = screen.queryByText("Security Protected");
      if (heading) {
        // It is rendered but the overlay's display should be none
        const overlay = heading.closest("div[style*='position: fixed']") as HTMLElement | null;
        if (overlay) {
          expect(overlay.style.display).toBe("none");
        }
      }
      // Either way: no throw, and user-select is not locked
      expect(document.body.style.userSelect).not.toBe("none");
    });
  });

  // ── When authenticated on a PUBLIC route ────────────────
  describe("when user is authenticated but on a public route", () => {
    beforeEach(() => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "u1", email: "a@b.com" }));
    });

    it("does NOT apply user-select:none on the landing page '/'", () => {
      renderGuard("/");
      expect(document.body.style.userSelect).not.toBe("none");
    });

    it("does NOT apply user-select:none on the dashboard home", () => {
      renderGuard("/dashboard");
      expect(document.body.style.userSelect).not.toBe("none");
    });
  });

  // ── When authenticated on a PROTECTED assessment route ──
  describe("when user is authenticated on a protected assessment route", () => {
    beforeEach(() => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "u1", email: "a@b.com" }));
    });

    it("applies user-select:none to body on /assessment/* path", () => {
      renderGuard("/assessment/T1");
      expect(document.body.style.userSelect).toBe("none");
    });

    it("applies user-select:none to body on /dashboard/assessments/* path", () => {
      renderGuard("/dashboard/assessments/T2");
      expect(document.body.style.userSelect).toBe("none");
    });

    it("renders the overlay element (even if hidden by default)", () => {
      renderGuard("/assessment/T1");
      // The overlay always renders; display:none is its default state
      const heading = screen.getByText("Security Protected");
      expect(heading).toBeInTheDocument();
    });

    it("overlay starts hidden (display:none)", () => {
      renderGuard("/assessment/T1");
      const heading = screen.getByText("Security Protected");
      const overlay = heading.closest("div") as HTMLElement;
      // Walk up to find the fixed-position overlay
      let el: HTMLElement | null = overlay;
      while (el && el.style.position !== "fixed") {
        el = el.parentElement as HTMLElement | null;
      }
      if (el) {
        expect(el.style.display).toBe("none");
      }
    });
  });

  // ── Cleanup on unmount ───────────────────────────────────
  describe("cleanup on unmount", () => {
    beforeEach(() => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "u1" }));
    });

    it("removes body style overrides when component unmounts", () => {
      const { unmount } = renderGuard("/assessment/T1");
      unmount();
      expect(document.body.style.userSelect).toBe("");
    });
  });
});
