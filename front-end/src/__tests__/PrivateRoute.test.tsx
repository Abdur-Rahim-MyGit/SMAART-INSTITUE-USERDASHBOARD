/**
 * PrivateRoute.test.tsx
 * Unit tests for src/components/PrivateRoute.jsx
 *
 * PrivateRoute reads sessionStorage for 'token'.
 * - No token  → redirects to "/"
 * - Token present → renders <Outlet />
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "@/components/PrivateRoute";

// Helper: wrap PrivateRoute in a MemoryRouter and catch any redirect.
// We check whether a sentinel component renders, which only happens if the
// Outlet (protected child) is rendered.
const ProtectedPage = () => <div data-testid="protected-content">Protected</div>;
const LoginPage = () => <div data-testid="login-page">Login</div>;

const renderApp = (initialPath = "/protected") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {/* Public (login) route */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected routes wrapped by PrivateRoute */}
        <Route element={<PrivateRoute />}>
          <Route path="/protected" element={<ProtectedPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────
describe("PrivateRoute", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("redirects to '/' when no token is in sessionStorage", () => {
    renderApp();

    // The login page should be shown
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
    // The protected content must NOT be shown
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders the protected Outlet when a token is present in sessionStorage", () => {
    sessionStorage.setItem("token", "valid-jwt-token");

    renderApp();

    // Protected content should now be visible
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    // Login page must NOT be shown
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
  });

  it("redirects to '/' when token is an empty string", () => {
    sessionStorage.setItem("token", "");

    renderApp();

    // Empty string is falsy — should redirect
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders Outlet for a non-empty token value", () => {
    sessionStorage.setItem("token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.some.token");

    renderApp();

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });
});
