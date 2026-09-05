import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import SkillAssessmentPlayer from "../pages/SkillAssessmentPlayer";
import { assessmentApi } from "../services/assessmentApi";
import { toast } from "sonner";

const mockNavigate = vi.fn();
let mockParams = { skillName: "Python" };

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark" }),
}));

vi.mock("@/services/assessmentApi", () => ({
  assessmentApi: {
    startAssessment: vi.fn(),
    saveAnswer: vi.fn(),
    submitAssessment: vi.fn(),
  },
}));

vi.mock("@/hooks/useProctoringEngine", () => ({
  default: vi.fn(() => ({
    warningsCount: 0,
    maxWarnings: 3,
    diagnostics: {},
    riskFlagged: false,
    isWarningVisible: false,
    lastViolationType: null,
    acknowledgeWarning: vi.fn(),
    isCameraActive: true,
    isFaceDetected: true,
    faceCount: 1,
    cameraError: null,
    stream: null,
    isFullScreen: true,
    fullscreenCountdown: null,
    requestFullscreen: vi.fn(),
    showAttentionCheck: false,
    passAttentionCheck: vi.fn(),
    failAttentionCheck: vi.fn(),
    verificationStatus: "verified",
    similarityScore: 0.95,
    gazeDirection: "center",
    tier: "ok",
    nudgeMessage: null,
    pauseObservations: [],
    isPaused: false,
    resumeFromPause: vi.fn(),
    showInactivityOverlay: false,
    dismissInactivityOverlay: vi.fn(),
    failInactivityCheck: vi.fn(),
  })),
}));

// Mock sub-components
vi.mock("@/components/ui/NeuralBackground", () => ({
  default: () => <div data-testid="neural-bg" />,
}));

vi.mock("@/components/proctoring/ProctoringSetup", () => ({
  default: ({ onComplete, assessmentTitle }) => (
    <div data-testid="proctoring-setup">
      <h1>{assessmentTitle}</h1>
      <button
        data-testid="complete-setup-btn"
        onClick={() =>
          onComplete({
            faceDescriptor: [0.1, 0.2],
            allEmbeddings: [[0.1, 0.2]],
            registrationQualityScore: 0.9,
            framesCaptured: 10,
            registrationCropUrl: "blob:test",
          })
        }
      >
        Complete Setup
      </button>
    </div>
  ),
}));

vi.mock("@/components/proctoring/ProctoringOverlay", () => ({
  default: () => <div data-testid="proctoring-overlay" />,
}));
vi.mock("@/components/proctoring/ProctoringPause", () => ({
  default: () => null,
}));
vi.mock("@/components/proctoring/ProctoringNotice", () => ({
  default: () => null,
}));
vi.mock("@/components/proctoring/ProctoringStatusPill", () => ({
  default: () => <div data-testid="proctoring-pill">Status Pill</div>,
}));
vi.mock("@/components/proctoring/InactivityOverlay", () => ({
  default: () => null,
}));
vi.mock("@/components/proctoring/AttentionCheck", () => ({
  default: () => null,
}));
vi.mock("@/components/CertificateModal", () => ({
  default: ({ skillName, onConfirm, onClose }) => (
    <div data-testid="cert-modal">
      <span>{skillName} Modal</span>
      <button onClick={() => onConfirm(skillName, new File([], "cert.pdf"))}>Confirm Cert</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Framer motion mock
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, onClick, ...props }) => (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    ),
    button: ({ children, className, onClick, disabled, ...props }) => (
      <button className={className} onClick={onClick} disabled={disabled} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe("SkillAssessmentPlayer", () => {
  const originalFetch = global.fetch;

  const mockAssessmentDoc = {
    _id: "assess_py_101",
    name: "Python",
    duration: 15,
  };

  const mockStartResponse = {
    success: true,
    data: {
      resultId: "res_abc_999",
      assessmentToken: "token_secret_123",
      duration: 15,
      questions: [
        {
          _id: "q_1",
          order: 1,
          questionText: "What is the output of print(2 ** 3)?",
          options: [
            { value: "A", label: "6" },
            { value: "B", label: "8" },
          ],
        },
        {
          _id: "q_2",
          order: 2,
          questionText: "Which keyword is used to define a function in Python?",
          options: [
            { value: "A", label: "func" },
            { value: "B", label: "def" },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockParams = { skillName: "Python" };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("shows loading indicator initially and handles assessment fetch error", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(<SkillAssessmentPlayer />);

    expect(screen.getByText("Loading Skill Assessment...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText(/Failed to load skill assessment/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Back to Roadmap"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/career-agent/dashboard");
  });

  it("renders ProctoringSetup after successful assessment fetch and starts exam on setup completion", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAssessmentDoc }),
    });

    assessmentApi.startAssessment.mockResolvedValueOnce(mockStartResponse);

    render(<SkillAssessmentPlayer />);

    await waitFor(() => {
      expect(screen.getByTestId("proctoring-setup")).toBeInTheDocument();
      expect(screen.getByText("Python Assessment")).toBeInTheDocument();
    });

    // Complete setup
    fireEvent.click(screen.getByTestId("complete-setup-btn"));

    // Assessment player is rendered
    await waitFor(() => {
      expect(screen.getByText("What is the output of print(2 ** 3)?")).toBeInTheDocument();
    });
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
  });

  it("handles option selection, calls assessmentApi.saveAnswer, and navigates between questions", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAssessmentDoc }),
    });
    assessmentApi.startAssessment.mockResolvedValueOnce(mockStartResponse);
    assessmentApi.saveAnswer.mockResolvedValueOnce({ success: true });

    render(<SkillAssessmentPlayer />);

    await waitFor(() => {
      expect(screen.getByTestId("proctoring-setup")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("complete-setup-btn"));

    await waitFor(() => {
      expect(screen.getByText("What is the output of print(2 ** 3)?")).toBeInTheDocument();
    });

    // Select option B ("8")
    const optB = screen.getByText("8");
    await act(async () => {
      fireEvent.click(optB);
    });

    expect(assessmentApi.saveAnswer).toHaveBeenCalledWith(
      "res_abc_999",
      "q_1",
      "B",
      "What is the output of print(2 ** 3)?",
      "token_secret_123"
    );

    // Next question button appears
    const nextBtn = screen.getByRole("button", { name: /Next Question/i });
    expect(nextBtn).toBeInTheDocument();

    fireEvent.click(nextBtn);

    // Question 2 should now be active
    expect(
      screen.getByText("Which keyword is used to define a function in Python?")
    ).toBeInTheDocument();
  });

  it("submits the assessment and displays passed results when score >= 70%", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAssessmentDoc }),
    });
    assessmentApi.startAssessment.mockResolvedValueOnce(mockStartResponse);
    assessmentApi.saveAnswer.mockResolvedValue({ success: true });
    assessmentApi.submitAssessment.mockResolvedValueOnce({
      success: true,
      data: {
        score: 2,
        totalQuestions: 2,
        percentage: 100,
        passed: true,
      },
    });

    render(<SkillAssessmentPlayer />);

    await waitFor(() => screen.getByTestId("proctoring-setup"));
    fireEvent.click(screen.getByTestId("complete-setup-btn"));

    await waitFor(() => screen.getByText("What is the output of print(2 ** 3)?"));

    // Answer Q1
    fireEvent.click(screen.getByText("8"));
    fireEvent.click(screen.getByRole("button", { name: /Next Question/i }));

    // Answer Q2
    fireEvent.click(screen.getByText("def"));

    // Submit button appears
    const submitBtn = screen.getByRole("button", { name: /Submit Assessment/i });
    expect(submitBtn).toBeEnabled();

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(assessmentApi.submitAssessment).toHaveBeenCalledWith(
      "res_abc_999",
      "token_secret_123",
      expect.objectContaining({
        submissionReason: "manual",
      })
    );

    // Results screen
    await waitFor(() => {
      expect(screen.getByText("Assessment Passed!")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    // Mark completed directly
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    fireEvent.click(screen.getByText("Mark Completed Directly"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/career-agent/dashboard");
    });
  });

  it("displays failed results when score < 70% and handles retry", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAssessmentDoc }),
    });
    assessmentApi.startAssessment.mockResolvedValueOnce(mockStartResponse);
    assessmentApi.saveAnswer.mockResolvedValue({ success: true });
    assessmentApi.submitAssessment.mockResolvedValueOnce({
      success: true,
      data: {
        score: 1,
        totalQuestions: 2,
        percentage: 50,
        passed: false,
      },
    });

    render(<SkillAssessmentPlayer />);

    await waitFor(() => screen.getByTestId("proctoring-setup"));
    fireEvent.click(screen.getByTestId("complete-setup-btn"));

    await waitFor(() => screen.getByText("What is the output of print(2 ** 3)?"));

    // Dev fail button
    const failDevBtn = screen.getByRole("button", { name: /Fail Test/i });
    await act(async () => {
      fireEvent.click(failDevBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("Assessment Failed")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    expect(screen.getByText("Retry Assessment")).toBeInTheDocument();
  });

  it("handles exit warning modal correctly", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockAssessmentDoc }),
    });
    assessmentApi.startAssessment.mockResolvedValueOnce(mockStartResponse);

    render(<SkillAssessmentPlayer />);

    await waitFor(() => screen.getByTestId("proctoring-setup"));
    fireEvent.click(screen.getByTestId("complete-setup-btn"));

    await waitFor(() => screen.getByText("What is the output of print(2 ** 3)?"));

    // Click Exit
    fireEvent.click(screen.getByRole("button", { name: /Exit/i }));

    expect(screen.getByText("Leave Assessment?")).toBeInTheDocument();

    // Click Continue Assessment
    fireEvent.click(screen.getByText("Continue Assessment"));
    expect(screen.queryByText("Leave Assessment?")).not.toBeInTheDocument();

    // Click Exit again and choose Leave
    fireEvent.click(screen.getByRole("button", { name: /Exit/i }));
    fireEvent.click(screen.getByText("Leave"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/career-agent/dashboard");
  });
});
