import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import MicroAssessmentPlayer from "../pages/MicroAssessmentPlayer";
import { courseEnrollmentAPI } from "../services/api";

const mockNavigate = vi.fn();
let mockLocationState = null;

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: mockLocationState,
  }),
  useParams: () => ({ id: "asm-1" }),
}));

vi.mock("@/hooks/useUser", () => ({
  default: () => ({
    user: { _id: "stu_100", name: "Student Test" },
  }),
}));

vi.mock("../services/api", () => ({
  courseEnrollmentAPI: {
    updateTaskResult: vi.fn(),
  },
}));

// Mock framer-motion
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
    circle: (props) => <circle {...props} />,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe("MicroAssessmentPlayer", () => {
  const sampleAssessment = {
    title: "Intro Quiz",
    courseTitle: "Intro to AI",
    moduleTitle: "Foundations",
    studentId: "stu_100",
    courseCode: "CRS01",
    moduleId: "mod_1",
    dayId: 1,
    assessmentData: {
      maxDurationMinutes: 5,
      shuffleQuestions: false,
      questions: [
        {
          question: "What does AI stand for?",
          options: ["Artificial Intelligence", "Auto Interface", "Applied Info"],
          correctAnswer: 0,
          explanation: "AI is Artificial Intelligence.",
          points: 1,
          originalIndex: 0,
        },
        {
          question: "What is Machine Learning?",
          options: ["Subfield of AI", "A hardware component"],
          correctAnswer: 0,
          explanation: "ML is a subfield of AI.",
          points: 2,
          originalIndex: 1,
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockLocationState = { assessment: sampleAssessment };
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("redirects to /dashboard/micro-assessments when assessment data is missing", () => {
    mockLocationState = null;

    render(<MicroAssessmentPlayer />);

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/micro-assessments", { replace: true });
  });

  it("renders the start phase with rules and begins assessment on click", () => {
    render(<MicroAssessmentPlayer />);

    expect(screen.getAllByText("Intro Quiz").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Assessment Rules")).toBeInTheDocument();
    expect(screen.getByText("Begin Assessment")).toBeInTheDocument();

    // Click Begin Assessment
    fireEvent.click(screen.getByText("Begin Assessment"));

    // Transitions to taking phase
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("What does AI stand for?")).toBeInTheDocument();
  });

  it("handles answer selection, shows explanation, and navigates between questions", () => {
    render(<MicroAssessmentPlayer />);

    // Start
    fireEvent.click(screen.getByText("Begin Assessment"));

    // Select the first option: "Artificial Intelligence"
    const option1 = screen.getByText("Artificial Intelligence");
    fireEvent.click(option1);

    // Explanation should appear
    expect(screen.getByText("AI is Artificial Intelligence.")).toBeInTheDocument();

    // Next button should be enabled
    const nextBtn = screen.getByRole("button", { name: /Next/i });
    expect(nextBtn).toBeEnabled();

    // Click Next
    fireEvent.click(nextBtn);

    // Question 2 should now be visible
    expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("What is Machine Learning?")).toBeInTheDocument();

    // Click Prev to go back to Question 1
    const prevBtn = screen.getByRole("button", { name: /Prev/i });
    fireEvent.click(prevBtn);
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
  });

  it("completes full submission flow, calls updateTaskResult, and transitions to result phase", async () => {
    courseEnrollmentAPI.updateTaskResult.mockResolvedValueOnce({ success: true });

    render(<MicroAssessmentPlayer />);

    // Start
    fireEvent.click(screen.getByText("Begin Assessment"));

    // Q1 answer
    fireEvent.click(screen.getByText("Artificial Intelligence"));
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Q2 answer
    fireEvent.click(screen.getByText("Subfield of AI"));

    // Last question shows Submit Assessment
    const submitBtn = screen.getByRole("button", { name: /Submit Assessment/i });
    expect(submitBtn).toBeEnabled();

    // Submit
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(courseEnrollmentAPI.updateTaskResult).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: "stu_100",
        courseCode: "CRS01",
        moduleId: "mod_1",
        dayId: 1,
        score: 3,
        totalPoints: 3,
      })
    );

    // Result phase rendered
    expect(screen.getByText("Assessment Complete")).toBeInTheDocument();
    expect(screen.getByText("3 / 3 pts")).toBeInTheDocument();

    // Review answers
    fireEvent.click(screen.getByText("Review Answers"));
    expect(screen.getByText("Answer Review")).toBeInTheDocument();
    expect(screen.getByText("Score: 100%")).toBeInTheDocument();

    // Close review navigates to hub
    fireEvent.click(screen.getByText("Close Review"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/micro-assessments");
  });

  it("handles submission failure gracefully by staying in taking phase", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    courseEnrollmentAPI.updateTaskResult.mockRejectedValueOnce(new Error("Network Error"));

    render(<MicroAssessmentPlayer />);

    fireEvent.click(screen.getByText("Begin Assessment"));
    fireEvent.click(screen.getByText("Artificial Intelligence"));
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    fireEvent.click(screen.getByText("Subfield of AI"));

    const submitBtn = screen.getByRole("button", { name: /Submit Assessment/i });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(alertSpy).toHaveBeenCalledWith("Failed to submit assessment. Please try again.");
    expect(screen.queryByText("Assessment Complete")).not.toBeInTheDocument();
    alertSpy.mockRestore();
  });

  it("submits automatically when timer expires", async () => {
    courseEnrollmentAPI.updateTaskResult.mockResolvedValueOnce({ success: true });

    render(<MicroAssessmentPlayer />);

    fireEvent.click(screen.getByText("Begin Assessment"));

    // TotalQ = 2 questions * 90s = 180s
    await act(async () => {
      vi.advanceTimersByTime(185 * 1000);
    });

    expect(courseEnrollmentAPI.updateTaskResult).toHaveBeenCalled();
  });

  it("prompts before navigating back during taking phase", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<MicroAssessmentPlayer />);

    fireEvent.click(screen.getByText("Begin Assessment"));

    // Click Back in header
    fireEvent.click(screen.getByText("Back"));

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/micro-assessments");
    confirmSpy.mockRestore();
  });

  it("does not navigate if user cancels exit confirmation", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<MicroAssessmentPlayer />);

    fireEvent.click(screen.getByText("Begin Assessment"));

    fireEvent.click(screen.getByText("Back"));

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith("/dashboard/micro-assessments");
    confirmSpy.mockRestore();
  });
});
