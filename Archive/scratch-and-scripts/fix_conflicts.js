const fs = require('fs');
const path = require('path');

const projectRoot = 'c:\\Users\\dhars\\Desktop\\SMAART-INSTITUTE\\SMAART-INSTITUE-USERDASHBOARD';

const filesToKeepHead = [
  'front-end/src/components/AnimatedRoutes.jsx',
  'front-end/src/pages/AssessmentsDashboard.jsx',
  'front-end/src/pages/CareerAgent/CareerAgentDashboard.jsx',
  'front-end/src/pages/AICareerCoach/ResumeBuilder.jsx',
  'front-end/src/components/CourseStructure.jsx',
  'front-end/src/components/LeftSidebar.jsx',
  'front-end/src/pages/MyCourses.jsx',
  'front-end/dist/index.html'
];

function resolveKeepHead(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Regex to match conflict markers and keep HEAD (local) version
  const conflictRegex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> [a-f0-9]+\r?\n?/g;
  content = content.replace(conflictRegex, '$1');
  
  fs.writeFileSync(fullPath, content);
  console.log('Resolved (kept HEAD):', filePath);
}

function resolveCoursePlayer() {
  const fullPath = path.join(projectRoot, 'front-end/src/pages/CoursePlayer.jsx');
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');

  // Block 1: Imports
  const block1Regex = /<<<<<<< HEAD\r?\nimport { coursesAPI, courseEnrollmentAPI } from "@\/services\/api";\r?\nimport { buildFlowFromCourse, TEMP_VIDEO_URL } from "@\/utils\/courseStages";\r?\nimport { mergeAdminQuizzesIntoFlow } from "@\/utils\/microAssessmentUtils";\r?\nimport { markCourseCompleted } from "@\/utils\/courseProgressStorage";\r?\n=======\r?\nimport useActivityRestrictions from "@\/hooks\/useActivityRestrictions";\r?\nimport ActivityWarningModal from "@\/components\/ActivityWarningModal";\r?\nimport useUser from "@\/hooks\/useUser";\r?\nimport { courseEnrollmentAPI } from "@\/services\/api";\r?\n\r?\n\/\/ Sample video URLs[\s\S]*?>>>>>>> [a-f0-9]+\r?\n?/;
  
  const block1Replacement = `import { coursesAPI, courseEnrollmentAPI } from "@/services/api";
import { buildFlowFromCourse, TEMP_VIDEO_URL } from "@/utils/courseStages";
import { mergeAdminQuizzesIntoFlow } from "@/utils/microAssessmentUtils";
import { markCourseCompleted } from "@/utils/courseProgressStorage";
import useActivityRestrictions from "@/hooks/useActivityRestrictions";
import ActivityWarningModal from "@/components/ActivityWarningModal";`;
  
  content = content.replace(block1Regex, block1Replacement);

  // Block 2: DB Sync
  const block2Regex = /<<<<<<< HEAD\r?\n\s*const allCompleted = stepNumbers\.every\(\(step\) => newCompletedSteps\[step\]\);\r?\n=======\r?\n\s*\/\/ Sync to DB[\s\S]*?const allCompleted = allSteps\.every\(step => newCompletedSteps\[step\]\);\r?\n>>>>>>> [a-f0-9]+\r?\n?/;
  
  const block2Replacement = `    // Sync to DB
    if (currentUser) {
      try {
        await courseEnrollmentAPI.updateTaskProgress({
          studentId: currentUser._id || currentUser.id,
          courseCode: courseId,
          moduleId: 1,
          dayId: parseInt(stepNumber),
          taskId: 1,
          completed: true
        });
      } catch (err) {
        console.error("Error saving step task progress to DB:", err);
      }
    }

    const allCompleted = stepNumbers.every((step) => newCompletedSteps[step]);`;

  content = content.replace(block2Regex, block2Replacement);

  // Block 3: SyncedTranscript (Keep HEAD)
  const block3Regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> [a-f0-9]+\r?\n?/g;
  content = content.replace(block3Regex, '$1');

  fs.writeFileSync(fullPath, content);
  console.log('Resolved (custom merge): front-end/src/pages/CoursePlayer.jsx');
}

try {
  filesToKeepHead.forEach(resolveKeepHead);
  resolveCoursePlayer();
  console.log('\\nAll conflicts resolved successfully! Now you can commit and push.');
} catch (error) {
  console.error('Error resolving conflicts:', error);
}
