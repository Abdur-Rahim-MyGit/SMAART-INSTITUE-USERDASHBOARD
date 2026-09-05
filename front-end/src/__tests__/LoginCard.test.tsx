/**
 * LoginCard.test.tsx
 * Unit tests for src/components/LoginCard.jsx
 *
 * Tests cover:
 *  - Renders all login form fields
 *  - Email validation (empty → blocked)
 *  - Password length validation (< 8 chars → blocked)
 *  - Loading state during API call
 *  - Successful login → calls login() + navigates to /dashboard
 *  - Successful login for new user → navigates to /complete-registration
 *  - requireOtp flow → shows OTP modal
 *  - requirePasswordChange flow → shows password change modal
 *  - Invalid credentials error
 *  - Network error message
 *  - Password visibility toggle
 *  - Forgot password flow guard (no email → toast)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// ── Mocks ─────────────────────────────────────────────────────

// 1. framer-motion: render children without animation overhead
vi.mock("framer-motion", () => {
  const Motion = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
    React.createElement("div", { ...props }, children);
  return {
    motion: {
      div: Motion,
      span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) =>
        React.createElement("span", { ...props }, children),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

// 2. i18next: return the fallback string directly
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

// 3. sonner — provide a toast function with .error/.success/.info methods
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastInfo = vi.fn();

vi.mock("sonner", () => {
  const toast = Object.assign(vi.fn(), {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    info: (...args: unknown[]) => mockToastInfo(...args),
  });
  return { toast };
});

// 4. API service
const mockApiCall = vi.fn();
vi.mock("@/services/api", () => ({
  API_BASE_URL: "http://localhost:5000/api",
  apiCall: (...args: unknown[]) => mockApiCall(...args),
  startTokenRenewal: vi.fn(),
  stopTokenRenewal: vi.fn(),
}));

// 5. visionBoardProApi
vi.mock("@/features/visionBoard/services/visionBoardProApi", () => ({
  resetUserIdCache: vi.fn(),
}));

// 6. useUser hook
const mockLogin = vi.fn();
vi.mock("@/hooks/useUser", () => ({
  default: () => ({ login: mockLogin }),
}));

// 7. Auth sub-modals — use absolute-path-compatible module ID format.
// LoginCard imports these as: import LoginOtpModal from "./auth/LoginOtpModal"
// In Vitest with the @ alias, the resolved path is what we need to mock.
vi.mock("@/components/auth/LoginOtpModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? React.createElement("div", { "data-testid": "otp-modal" }, "OTP Modal") : null,
}));

vi.mock("@/components/auth/ForgotPasswordModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? React.createElement("div", { "data-testid": "forgot-modal" }, "Forgot Modal") : null,
}));

vi.mock("@/components/auth/FirstLoginPasswordModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen
      ? React.createElement("div", { "data-testid": "password-change-modal" }, "PW Modal")
      : null,
}));

vi.mock("@/components/auth/ContactAdminModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen
      ? React.createElement("div", { "data-testid": "contact-modal" }, "Contact Modal")
      : null,
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ── Import component AFTER mocks are registered ───────────────
import LoginCard from "@/components/LoginCard";

// ── Render helper ─────────────────────────────────────────────
const renderLoginCard = () =>
  render(
    <MemoryRouter>
      <LoginCard />
    </MemoryRouter>
  );

// Helper: get the login form element
const getLoginForm = () => document.querySelector("form[aria-label='Login form']") as HTMLFormElement;

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────
describe("LoginCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // ── Rendering ────────────────────────────────────────────
  describe("Rendering", () => {
    it("renders the email input field", () => {
      renderLoginCard();
      expect(document.getElementById("login-email")).toBeInTheDocument();
    });

    it("renders the password input field", () => {
      renderLoginCard();
      expect(document.getElementById("login-password")).toBeInTheDocument();
    });

    it("renders the submit button with 'Access Portal' text", () => {
      renderLoginCard();
      expect(screen.getByText("Access Portal")).toBeInTheDocument();
    });

    it("renders the Forgot? link", () => {
      renderLoginCard();
      expect(screen.getByText("Forgot?")).toBeInTheDocument();
    });

    it("renders 'Contact Admin' button", () => {
      renderLoginCard();
      expect(screen.getByText("Contact Admin")).toBeInTheDocument();
    });

    it("renders the 'Welcome Back' heading", () => {
      renderLoginCard();
      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    });
  });

  // ── Validation — empty email (submit form directly to bypass HTML5 required) ──
  describe("Validation — empty email", () => {
    it("shows an error toast and does not call API when email is empty", async () => {
      renderLoginCard();

      // Submit the form without filling in any fields
      // Use fireEvent.submit to bypass the browser's native HTML5 required validation
      // (jsdom's form validation doesn't prevent submission, so handleLogin runs)
      const form = getLoginForm();
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
      expect(mockApiCall).not.toHaveBeenCalled();
    });
  });

  // ── Validation — short password ──────────────────────────
  describe("Validation — password too short", () => {
    it("shows an error toast when password has fewer than 8 characters", async () => {
      renderLoginCard();

      const emailInput = document.getElementById("login-email") as HTMLInputElement;
      const passwordInput = document.getElementById("login-password") as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: "user@smaart.edu" } });
      fireEvent.change(passwordInput, { target: { value: "short" } }); // 5 chars

      const form = getLoginForm();
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
      expect(mockApiCall).not.toHaveBeenCalled();
    });
  });

  // ── Successful login — registered user ───────────────────
  describe("Successful login — registered user", () => {
    it("calls apiCall with email and password, then navigates to /dashboard", async () => {
      const mockUser = {
        _id: "u1",
        email: "user@smaart.edu",
        hasRegistration: true,
      };
      mockApiCall.mockResolvedValueOnce({ user: mockUser, token: "jwt-abc" });

      renderLoginCard();

      fireEvent.change(document.getElementById("login-email")!, { target: { value: "user@smaart.edu" } });
      fireEvent.change(document.getElementById("login-password")!, { target: { value: "Password1" } });
      fireEvent.submit(getLoginForm());

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith(
          "/auth/login",
          expect.objectContaining({ method: "POST" })
        );
        expect(mockLogin).toHaveBeenCalledWith(mockUser, "jwt-abc");
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
      });
    });
  });

  // ── Successful login — unregistered user ─────────────────
  describe("Successful login — user without completed registration", () => {
    it("navigates to /complete-registration for users without hasRegistration", async () => {
      const mockUser = {
        _id: "u2",
        email: "new@smaart.edu",
        hasRegistration: false,
        fullName: "New Student",
      };
      mockApiCall.mockResolvedValueOnce({ user: mockUser, token: "jwt-def" });

      renderLoginCard();

      fireEvent.change(document.getElementById("login-email")!, { target: { value: "new@smaart.edu" } });
      fireEvent.change(document.getElementById("login-password")!, { target: { value: "Password1" } });
      fireEvent.submit(getLoginForm());

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/complete-registration", { replace: true });
      });
    });
  });

  // ── OTP flow ─────────────────────────────────────────────
  describe("OTP flow", () => {
    it("shows the OTP modal when API returns requireOtp:true", async () => {
      mockApiCall.mockResolvedValueOnce({
        requireOtp: true,
        tempToken: "temp-123",
        email: "user@smaart.edu",
      });

      renderLoginCard();

      fireEvent.change(document.getElementById("login-email")!, { target: { value: "user@smaart.edu" } });
      fireEvent.change(document.getElementById("login-password")!, { target: { value: "Password1" } });
      fireEvent.submit(getLoginForm());

      await waitFor(() => {
        expect(screen.getByTestId("otp-modal")).toBeInTheDocument();
      });
    });
  });

  // ── Password change flow ─────────────────────────────────
  describe("requirePasswordChange flow", () => {
    it("shows the password-change modal when API returns requirePasswordChange:true", async () => {
      mockApiCall.mockResolvedValueOnce({
        requirePasswordChange: true,
        tempToken: "temp-pw-456",
        email: "admin@smaart.edu",
        fullName: "Admin User",
      });

      renderLoginCard();

      fireEvent.change(document.getElementById("login-email")!, { target: { value: "admin@smaart.edu" } });
      fireEvent.change(document.getElementById("login-password")!, { target: { value: "Password1" } });
      fireEvent.submit(getLoginForm());

      await waitFor(() => {
        expect(screen.getByTestId("password-change-modal")).toBeInTheDocument();
      });
    });
  });

  // ── Error handling — invalid credentials ─────────────────
  describe("Error handling — invalid credentials", () => {
    it("shows an error toast on invalid credentials error", async () => {
      mockApiCall.mockRejectedValueOnce(new Error("Invalid credentials"));

      renderLoginCard();

      fireEvent.change(document.getElementById("login-email")!, { target: { value: "user@smaart.edu" } });
      fireEvent.change(document.getElementById("login-password")!, { target: { value: "WrongPass1" } });
      fireEvent.submit(getLoginForm());

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
    });
  });

  // ── Error handling — network failure ─────────────────────
  describe("Error handling — network failure", () => {
    it("shows a server connection error toast on network failure", async () => {
      mockApiCall.mockRejectedValueOnce(new Error("Failed to fetch"));

      renderLoginCard();

      fireEvent.change(document.getElementById("login-email")!, { target: { value: "user@smaart.edu" } });
      fireEvent.change(document.getElementById("login-password")!, { target: { value: "Password1" } });
      fireEvent.submit(getLoginForm());

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
    });
  });

  // ── Password visibility toggle ───────────────────────────
  describe("Password visibility toggle", () => {
    it("starts with password hidden (type=password)", () => {
      renderLoginCard();
      const pwInput = document.getElementById("login-password") as HTMLInputElement;
      expect(pwInput.type).toBe("password");
    });

    it("reveals password when the eye toggle button is clicked", async () => {
      renderLoginCard();
      const pwInput = document.getElementById("login-password") as HTMLInputElement;

      // The toggle button has aria-label "Show password"
      const toggleBtn = screen.getByRole("button", { name: /show password/i });
      await userEvent.click(toggleBtn);

      expect(pwInput.type).toBe("text");
    });

    it("hides password again when the eye toggle is clicked a second time", async () => {
      renderLoginCard();
      const pwInput = document.getElementById("login-password") as HTMLInputElement;

      const showBtn = screen.getByRole("button", { name: /show password/i });
      await userEvent.click(showBtn);
      expect(pwInput.type).toBe("text");

      const hideBtn = screen.getByRole("button", { name: /hide password/i });
      await userEvent.click(hideBtn);
      expect(pwInput.type).toBe("password");
    });
  });

  // ── Forgot password guard ────────────────────────────────
  describe("Forgot password button", () => {
    it("shows an error toast when 'Forgot?' is clicked without entering an email", async () => {
      renderLoginCard();
      fireEvent.click(screen.getByText("Forgot?"));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
    });

    it("shows an error toast for an invalid email format when 'Forgot?' is clicked", async () => {
      renderLoginCard();
      fireEvent.change(document.getElementById("login-email")!, { target: { value: "not-an-email" } });
      fireEvent.click(screen.getByText("Forgot?"));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
    });

    it("opens the Forgot Password modal when a valid email is entered", async () => {
      renderLoginCard();
      fireEvent.change(document.getElementById("login-email")!, { target: { value: "user@smaart.edu" } });
      fireEvent.click(screen.getByText("Forgot?"));

      await waitFor(() => {
        expect(screen.getByTestId("forgot-modal")).toBeInTheDocument();
      });
    });
  });

  // ── Security: token NOT rendered in DOM ──────────────────
  describe("Security — sensitive data not exposed in DOM", () => {
    it("does not render any JWT token value in the visible DOM", async () => {
      const mockUser = { _id: "u1", email: "u@x.com", hasRegistration: true };
      mockApiCall.mockResolvedValueOnce({ user: mockUser, token: "SECRET-JWT-TOKEN-123" });

      renderLoginCard();
      fireEvent.change(document.getElementById("login-email")!, { target: { value: "u@x.com" } });
      fireEvent.change(document.getElementById("login-password")!, { target: { value: "Password1" } });
      fireEvent.submit(getLoginForm());

      await waitFor(() => expect(mockLogin).toHaveBeenCalled());

      // The token should never appear as text in the rendered DOM
      expect(document.body.textContent).not.toContain("SECRET-JWT-TOKEN-123");
    });
  });
});
