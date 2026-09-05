import { describe, it, expect, vi } from "vitest";
import {
  TEMP_VIDEO_URL,
  COURSE_STAGE_TITLES,
  getVideoUrlFromDay,
  mapCourseDaysToFlowSteps,
  buildFlowFromCourse,
  buildFlowFromLearningFlow,
} from "../utils/courseStages";

vi.mock("../utils/microAssessmentUtils", () => ({
  getQuizAssessmentForDay: vi.fn((module, day, index) => {
    if (day?.quizQuestions || index === 3) {
      return {
        title: "Practice Quiz",
        dayId: index + 1,
        moduleId: 1,
      };
    }
    return null;
  }),
}));

describe("courseStages", () => {
  describe("Constants", () => {
    it("exports TEMP_VIDEO_URL as a valid video URL", () => {
      expect(typeof TEMP_VIDEO_URL).toBe("string");
      expect(TEMP_VIDEO_URL).toBe("https://www.w3schools.com/html/mov_bbb.mp4");
    });

    it("exports COURSE_STAGE_TITLES with 7 sequential stage names", () => {
      expect(COURSE_STAGE_TITLES).toEqual([
        "Why",
        "Story",
        "Framework",
        "Practice",
        "Apply",
        "Reflect",
        "Notes",
      ]);
      expect(COURSE_STAGE_TITLES.length).toBe(7);
    });
  });

  describe("getVideoUrlFromDay", () => {
    it("returns null when day is null or undefined", () => {
      expect(getVideoUrlFromDay(null)).toBeNull();
      expect(getVideoUrlFromDay(undefined)).toBeNull();
    });

    it("returns null when day has no video properties", () => {
      expect(getVideoUrlFromDay({})).toBeNull();
      expect(getVideoUrlFromDay({ title: "Day 1" })).toBeNull();
    });

    it("reads day.videoContent.videoUrl", () => {
      const day = { videoContent: { videoUrl: "https://example.com/vc.mp4" } };
      expect(getVideoUrlFromDay(day)).toBe("https://example.com/vc.mp4");
    });

    it("reads day.video_url", () => {
      const day = { video_url: "https://example.com/underscore.mp4" };
      expect(getVideoUrlFromDay(day)).toBe("https://example.com/underscore.mp4");
    });

    it("reads day.videoUrl directly", () => {
      const day = { videoUrl: "https://example.com/camel.mp4" };
      expect(getVideoUrlFromDay(day)).toBe("https://example.com/camel.mp4");
    });

    it("reads day.VideoContent[0].videoUrl", () => {
      const day = { VideoContent: [{ videoUrl: "https://example.com/arr.mp4" }] };
      expect(getVideoUrlFromDay(day)).toBe("https://example.com/arr.mp4");
    });

    it("reads day.steps[0].content.videoUrl", () => {
      const day = { steps: [{ content: { videoUrl: "https://example.com/step.mp4" } }] };
      expect(getVideoUrlFromDay(day)).toBe("https://example.com/step.mp4");
    });

    it("returns null when URL is empty string or only whitespace", () => {
      expect(getVideoUrlFromDay({ videoUrl: "" })).toBeNull();
      expect(getVideoUrlFromDay({ videoUrl: "   " })).toBeNull();
    });
  });

  describe("mapCourseDaysToFlowSteps", () => {
    it("returns an object with keys '1' to '7' when days array is empty", () => {
      const steps = mapCourseDaysToFlowSteps([]);
      expect(Object.keys(steps)).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
      expect(steps["1"].title).toBe("Why");
      expect(steps["7"].contentType).toBe("notes");
      expect(steps["7"].videoUrl).toBeNull();
    });

    it("normalizes provided days array and maps step metadata", () => {
      const days = [
        {
          videoUrl: "https://cdn.com/1.mp4",
          moduleDetails: { title: "Custom Intro", description: "Intro text" },
        },
      ];
      const steps = mapCourseDaysToFlowSteps(days);

      expect(steps["1"].title).toBe("Custom Intro");
      expect(steps["1"].videoUrl).toBe("https://cdn.com/1.mp4");
      expect(steps["1"].contentType).toBe("video-text");
      expect(steps["1"].content).toBe("Intro text");
    });

    it("truncates input days if more than 7 are provided", () => {
      const tenDays = Array.from({ length: 10 }, (_, i) => ({
        moduleDetails: { title: `Day ${i + 1}` },
      }));
      const steps = mapCourseDaysToFlowSteps(tenDays);

      expect(Object.keys(steps)).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
      expect(steps["1"].title).toBe("Day 1");
      expect(steps["6"].title).toBe("Day 6");
    });

    it("ensures step 7 (index 6, Notes) is always notes contentType with null videoUrl", () => {
      const sevenDays = Array.from({ length: 7 }, () => ({
        videoUrl: "https://cdn.com/video.mp4",
      }));
      const steps = mapCourseDaysToFlowSteps(sevenDays);

      expect(steps["7"].contentType).toBe("notes");
      expect(steps["7"].videoUrl).toBeNull();
    });

    it("sets contentType to 'quiz' and includes assessmentData when quiz is detected", () => {
      const steps = mapCourseDaysToFlowSteps([]);
      // Step 4 (index 3) is mocked to return quiz assessment
      expect(steps["4"].contentType).toBe("quiz");
      expect(steps["4"].assessmentData).toBeDefined();
      expect(steps["4"].dayId).toBe(4);
    });
  });

  describe("buildFlowFromCourse", () => {
    it("builds a full flow object containing steps map and metadata", () => {
      const course = {
        _id: "course_101",
        title: "Strategic Leadership",
        description: "Comprehensive leadership course",
        courseCode: "CRS01",
        courseNumber: "S01",
        modules: [
          {
            days: [
              {
                videoUrl: "https://cdn.com/s01d1.mp4",
                moduleDetails: { title: "Why Leadership" },
              },
            ],
          },
        ],
      };

      const flow = buildFlowFromCourse(course);

      expect(flow.overview).toBe("Comprehensive leadership course");
      expect(flow.overviewTitle).toBe("Strategic Leadership");
      expect(flow.courseCode).toBe("CRS01");
      expect(flow.courseDbId).toBe("course_101");
      expect(flow.courseNumber).toBe("S01");
      expect(flow.totalSteps).toBe(7);
      expect(Object.keys(flow.steps)).toHaveLength(7);
      expect(flow.steps["1"].title).toBe("Why Leadership");
      expect(flow.steps["1"].videoUrl).toBe("https://cdn.com/s01d1.mp4");
    });

    it("handles empty course object gracefully", () => {
      const flow = buildFlowFromCourse({});
      expect(flow.overview).toBe("");
      expect(flow.totalSteps).toBe(7);
      expect(Object.keys(flow.steps)).toHaveLength(7);
    });
  });

  describe("buildFlowFromLearningFlow", () => {
    it("builds steps from course.learningFlow when all steps are provided", () => {
      const course = {
        _id: "c_lf_1",
        title: "AI Essentials",
        description: "AI Intro",
        courseCode: "CRS_AI",
        courseNumber: "AI01",
        learningFlow: {
          stepA_Why: {
            title: "Why AI Matters",
            videoUrl: "https://cdn.com/why.mp4",
            text: "AI overview text",
          },
          stepB_Story: {
            title: "Case in Point",
            videoUrl: "https://cdn.com/story.mp4",
            narrative: "A story...",
          },
          stepC_Framework: {
            title: "Core Framework",
            content: "Framework details",
            keyPoints: ["Point 1", "Point 2"],
          },
          stepD_Practice: {
            title: "Hands-on Practice",
            submissionType: "quiz",
            randomizeQuestions: false,
            questions: [{ question: "Q1" }],
          },
          stepE_FlashCard: {
            title: "Term Flashcards",
            cards: [{ front: "AI", back: "Artificial Intelligence" }],
          },
          stepF_AdvancedPractice: {
            title: "Deep Dive Practice",
            submissionType: "reflection",
            instructions: "Write a summary",
            questions: [{ prompt: "Reflect on AI" }],
          },
          stepG_CaseStudy: {
            isEnabled: true,
            caseTitle: "Enterprise Deployment",
            caseText: "Case narrative...",
            questions: [{ type: "mcq", question: "Scenario Q" }],
          },
          stepH_Notes: {
            isEnabled: true,
            title: "Personal Takeaways",
            prompt: "What did you learn?",
          },
        },
      };

      const flow = buildFlowFromLearningFlow(course);

      expect(flow.overviewTitle).toBe("AI Essentials");
      expect(flow.totalSteps).toBe(8);

      // Verify step mapping
      expect(flow.steps["1"].title).toBe("Why AI Matters");
      expect(flow.steps["1"].contentType).toBe("video-text");
      expect(flow.steps["1"].videoUrl).toBe("https://cdn.com/why.mp4");

      expect(flow.steps["2"].title).toBe("Case in Point");
      expect(flow.steps["2"].contentType).toBe("video-text");

      expect(flow.steps["3"].title).toBe("Core Framework");
      expect(flow.steps["3"].contentType).toBe("notes");
      expect(flow.steps["3"].content).toContain("Key Takeaways");

      expect(flow.steps["4"].title).toBe("Hands-on Practice");
      expect(flow.steps["4"].contentType).toBe("quiz");
      expect(flow.steps["4"].assessmentData).toBeDefined();

      expect(flow.steps["5"].title).toBe("Term Flashcards");
      expect(flow.steps["5"].contentType).toBe("flashcard");
      expect(flow.steps["5"].cards).toHaveLength(1);

      expect(flow.steps["6"].title).toBe("Deep Dive Practice");
      expect(flow.steps["6"].contentType).toBe("advanced-mcq");

      expect(flow.steps["7"].contentType).toBe("case-study");
      expect(flow.steps["7"].caseTitle).toBe("Enterprise Deployment");

      expect(flow.steps["8"].title).toBe("Personal Takeaways");
      expect(flow.steps["8"].contentType).toBe("notes");
    });

    it("handles partial learningFlow where some steps are omitted or disabled", () => {
      const course = {
        title: "Short Course",
        learningFlow: {
          stepA_Why: { title: "Just Why" },
          stepG_CaseStudy: { isEnabled: false },
          stepH_Notes: { isEnabled: false },
        },
      };

      const flow = buildFlowFromLearningFlow(course);
      expect(flow.totalSteps).toBe(1);
      expect(flow.steps["1"].title).toBe("Just Why");
      expect(flow.steps["2"]).toBeUndefined();
    });

    it("handles stepD_Practice with reflection and stepF_AdvancedPractice with quiz", () => {
      const course = {
        title: "Mixed Practice Course",
        learningFlow: {
          stepD_Practice: {
            submissionType: "reflection",
            questions: [{ text: "Describe problem" }],
          },
          stepF_AdvancedPractice: {
            submissionType: "quiz",
            questions: [{ text: "MCQ Q" }],
          },
        },
      };

      const flow = buildFlowFromLearningFlow(course);
      expect(flow.steps["1"].contentType).toBe("advanced-mcq");
      expect(flow.steps["2"].contentType).toBe("quiz");
    });
  });
});
