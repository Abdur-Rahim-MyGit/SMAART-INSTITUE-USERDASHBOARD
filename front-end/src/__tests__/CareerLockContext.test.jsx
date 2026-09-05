import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { CareerLockProvider, useCareerLock } from "../contexts/CareerLockContext";
import * as CareerLockService from "../services/CareerLockService";

vi.mock("../services/CareerLockService", () => ({
  fetchLockStatus: vi.fn(),
  markModalShown: vi.fn(),
}));

// Test consumer component
const TestConsumer = () => {
  const {
    isLoading,
    isLocked,
    attemptsUsed,
    maxAttempts,
    remainingAttempts,
    remainingDays,
    firstVisitModalShown,
    hasAnalysis,
    lockStatus,
    refreshLockStatus,
  } = useCareerLock();

  return (
    <div>
      <div data-testid="isLoading">{String(isLoading)}</div>
      <div data-testid="isLocked">{String(isLocked)}</div>
      <div data-testid="attemptsUsed">{attemptsUsed}</div>
      <div data-testid="maxAttempts">{maxAttempts}</div>
      <div data-testid="remainingAttempts">{remainingAttempts}</div>
      <div data-testid="remainingDays">{remainingDays}</div>
      <div data-testid="firstVisitModalShown">{String(firstVisitModalShown)}</div>
      <div data-testid="hasAnalysis">{String(hasAnalysis)}</div>
      <div data-testid="lockStatus">{JSON.stringify(lockStatus)}</div>
      <button onClick={refreshLockStatus} data-testid="refresh-btn">
        Refresh
      </button>
    </div>
  );
};

describe("CareerLockContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws an error when useCareerLock is used outside of CareerLockProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      "useCareerLock must be used inside CareerLockProvider"
    );

    consoleError.mockRestore();
  });

  it("provides default fallback values when fetchLockStatus returns null", async () => {
    CareerLockService.fetchLockStatus.mockResolvedValueOnce(null);

    render(
      <CareerLockProvider>
        <TestConsumer />
      </CareerLockProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("isLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("isLocked").textContent).toBe("false");
    expect(screen.getByTestId("attemptsUsed").textContent).toBe("0");
    expect(screen.getByTestId("maxAttempts").textContent).toBe("5");
    expect(screen.getByTestId("remainingAttempts").textContent).toBe("5");
    expect(screen.getByTestId("remainingDays").textContent).toBe("14");
    expect(screen.getByTestId("firstVisitModalShown").textContent).toBe("true");
    expect(screen.getByTestId("hasAnalysis").textContent).toBe("false");
    expect(screen.getByTestId("lockStatus").textContent).toBe("null");
  });

  it("loads and exposes lock status data correctly when service returns status", async () => {
    const mockData = {
      isLocked: true,
      attemptsUsed: 2,
      maxAttempts: 5,
      remainingAttempts: 3,
      remainingDays: 9,
      firstVisitModalShown: false,
      found: true,
    };

    CareerLockService.fetchLockStatus.mockResolvedValueOnce(mockData);

    render(
      <CareerLockProvider>
        <TestConsumer />
      </CareerLockProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("isLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("isLocked").textContent).toBe("true");
    expect(screen.getByTestId("attemptsUsed").textContent).toBe("2");
    expect(screen.getByTestId("maxAttempts").textContent).toBe("5");
    expect(screen.getByTestId("remainingAttempts").textContent).toBe("3");
    expect(screen.getByTestId("remainingDays").textContent).toBe("9");
    expect(screen.getByTestId("firstVisitModalShown").textContent).toBe("false");
    expect(screen.getByTestId("hasAnalysis").textContent).toBe("true");
    expect(screen.getByTestId("lockStatus").textContent).toBe(JSON.stringify(mockData));
  });

  it("handles refreshLockStatus to reload lock state", async () => {
    CareerLockService.fetchLockStatus.mockResolvedValueOnce({
      isLocked: false,
      attemptsUsed: 1,
      remainingAttempts: 4,
    });

    render(
      <CareerLockProvider>
        <TestConsumer />
      </CareerLockProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("isLocked").textContent).toBe("false");
    });

    CareerLockService.fetchLockStatus.mockResolvedValueOnce({
      isLocked: true,
      attemptsUsed: 5,
      remainingAttempts: 0,
    });

    await act(async () => {
      screen.getByTestId("refresh-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("isLocked").textContent).toBe("true");
      expect(screen.getByTestId("attemptsUsed").textContent).toBe("5");
      expect(screen.getByTestId("remainingAttempts").textContent).toBe("0");
    });
  });

  it("handles lockStatus being empty object gracefully", async () => {
    CareerLockService.fetchLockStatus.mockResolvedValueOnce({});

    render(
      <CareerLockProvider>
        <TestConsumer />
      </CareerLockProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("isLoading").textContent).toBe("false");
    });

    expect(screen.getByTestId("isLocked").textContent).toBe("false");
    expect(screen.getByTestId("hasAnalysis").textContent).toBe("false");
  });
});
