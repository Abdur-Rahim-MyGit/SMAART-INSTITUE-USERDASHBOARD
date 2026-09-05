import { describe, it, expect, vi, beforeEach } from "vitest";
import { assessmentApi } from "../services/assessmentApi";
import { apiCall } from "../services/api";

vi.mock("../services/api", () => ({
  apiCall: vi.fn(),
}));

describe("assessmentApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("calls /assessments", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: [] });

      const result = await assessmentApi.getAll();

      expect(apiCall).toHaveBeenCalledWith("/assessments");
      expect(result).toEqual({ success: true, data: [] });
    });
  });

  describe("getByDescription", () => {
    it("encodes and calls /assessments/by-description/:description", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { _id: "desc-1" } });

      const result = await assessmentApi.getByDescription("Special Assessment / Test");

      expect(apiCall).toHaveBeenCalledWith(
        `/assessments/by-description/${encodeURIComponent("Special Assessment / Test")}`
      );
      expect(result).toEqual({ success: true, data: { _id: "desc-1" } });
    });
  });

  describe("getByCode", () => {
    it("calls /assessments/code/:code", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { code: "CRS01" } });

      const result = await assessmentApi.getByCode("CRS01");

      expect(apiCall).toHaveBeenCalledWith("/assessments/code/CRS01");
      expect(result).toEqual({ success: true, data: { code: "CRS01" } });
    });
  });

  describe("checkAssessmentStatus", () => {
    it("calls /assessments/code/:code/status", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { completed: true } });

      const result = await assessmentApi.checkAssessmentStatus("CRS02");

      expect(apiCall).toHaveBeenCalledWith("/assessments/code/CRS02/status");
      expect(result.data.completed).toBe(true);
    });
  });

  describe("startAssessment", () => {
    it("calls /results/assessment/:id/start", async () => {
      apiCall.mockResolvedValueOnce({
        success: true,
        data: { resultId: "res-123", assessmentToken: "tok-abc" },
      });

      const result = await assessmentApi.startAssessment("assess-1");

      expect(apiCall).toHaveBeenCalledWith("/results/assessment/assess-1/start");
      expect(result.data.resultId).toBe("res-123");
    });
  });

  describe("resetAssessment", () => {
    it("posts to /results/:resultId/reset", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { reset: true } });

      const result = await assessmentApi.resetAssessment("res-123");

      expect(apiCall).toHaveBeenCalledWith("/results/res-123/reset", {
        method: "POST",
      });
      expect(result.data.reset).toBe(true);
    });
  });

  describe("saveAnswer", () => {
    it("posts to /results/:resultId/answer with payload and auth token header", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { saved: true } });

      const result = await assessmentApi.saveAnswer(
        "res-123",
        "q-1",
        "A",
        "What is React?",
        "test-token"
      );

      expect(apiCall).toHaveBeenCalledWith("/results/res-123/answer", {
        method: "POST",
        headers: { "x-assessment-token": "test-token" },
        body: JSON.stringify({
          questionId: "q-1",
          selectedValue: "A",
          questionText: "What is React?",
        }),
      });
      expect(result.data.saved).toBe(true);
    });

    it("handles saveAnswer with default parameters and null token", async () => {
      apiCall.mockResolvedValueOnce({ success: true });

      await assessmentApi.saveAnswer("res-123", "q-1", "B");

      expect(apiCall).toHaveBeenCalledWith("/results/res-123/answer", {
        method: "POST",
        headers: {},
        body: JSON.stringify({
          questionId: "q-1",
          selectedValue: "B",
          questionText: "",
        }),
      });
    });
  });

  describe("submitAssessment", () => {
    it("posts to /results/:resultId/submit with token and submission options", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { score: 95 } });

      const options = { submissionReason: "timeout", forcePassDev: false };
      const result = await assessmentApi.submitAssessment("res-123", "token-xyz", options);

      expect(apiCall).toHaveBeenCalledWith("/results/res-123/submit", {
        method: "POST",
        headers: { "x-assessment-token": "token-xyz" },
        body: JSON.stringify(options),
      });
      expect(result.data.score).toBe(95);
    });

    it("defaults submission options to empty object and token to null when not provided", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { score: 80 } });

      await assessmentApi.submitAssessment("res-123");

      expect(apiCall).toHaveBeenCalledWith("/results/res-123/submit", {
        method: "POST",
        headers: {},
        body: JSON.stringify({}),
      });
    });
  });

  describe("getUserResults", () => {
    it("fetches user results without status query if omitted", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: [] });

      await assessmentApi.getUserResults("user-1");

      expect(apiCall).toHaveBeenCalledWith("/results/user/user-1");
    });

    it("fetches user results with status query when provided", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: [{ _id: "res-1" }] });

      await assessmentApi.getUserResults("user-1", "completed");

      expect(apiCall).toHaveBeenCalledWith("/results/user/user-1?status=completed");
    });
  });

  describe("getResult", () => {
    it("calls /results/:resultId", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { _id: "res-456" } });

      const result = await assessmentApi.getResult("res-456");

      expect(apiCall).toHaveBeenCalledWith("/results/res-456");
      expect(result.data._id).toBe("res-456");
    });
  });

  describe("getBaseLineResults", () => {
    it("calls /baselineresults/user/:userId", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { baselineScore: 88 } });

      const result = await assessmentApi.getBaseLineResults("usr-789");

      expect(apiCall).toHaveBeenCalledWith("/baselineresults/user/usr-789");
      expect(result.data.baselineScore).toBe(88);
    });
  });

  describe("Stage Assessments API", () => {
    it("getStageResults calls /stageresults/user/:userId", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: [] });
      await assessmentApi.getStageResults("usr-1");
      expect(apiCall).toHaveBeenCalledWith("/stageresults/user/usr-1");
    });

    it("getStageResult calls /stageresults/user/:userId/stage/:stage", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { stage: "T1" } });
      await assessmentApi.getStageResult("usr-1", "T1");
      expect(apiCall).toHaveBeenCalledWith("/stageresults/user/usr-1/stage/T1");
    });

    it("getStageStatus calls /stageresults/user/:userId/status", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { passed: ["T1"] } });
      const result = await assessmentApi.getStageStatus("usr-1");
      expect(apiCall).toHaveBeenCalledWith("/stageresults/user/usr-1/status");
      expect(result.data.passed).toEqual(["T1"]);
    });

    it("resetAllStages calls DELETE /stageresults/reset/:userId/ALL", async () => {
      apiCall.mockResolvedValueOnce({ success: true });
      await assessmentApi.resetAllStages("usr-1");
      expect(apiCall).toHaveBeenCalledWith("/stageresults/reset/usr-1/ALL", {
        method: "DELETE",
      });
    });

    it("getStageAttempts calls /stageresults/user/:userId/stage/:stage/attempts", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { attempts: 2 } });
      await assessmentApi.getStageAttempts("usr-1", "T2");
      expect(apiCall).toHaveBeenCalledWith("/stageresults/user/usr-1/stage/T2/attempts");
    });

    it("restartStageCourse calls POST /stageresults/restart-course with body", async () => {
      apiCall.mockResolvedValueOnce({ success: true, data: { restarted: true } });
      await assessmentApi.restartStageCourse("usr-1", "T3");
      expect(apiCall).toHaveBeenCalledWith("/stageresults/restart-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: "usr-1", stage: "T3" }),
      });
    });
  });

  describe("Error propagation", () => {
    it("propagates API rejection or network error", async () => {
      apiCall.mockRejectedValueOnce(new Error("Network Error"));

      await expect(assessmentApi.getAll()).rejects.toThrow("Network Error");
    });
  });
});
