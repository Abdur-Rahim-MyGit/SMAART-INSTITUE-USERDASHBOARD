const mongoose = require('mongoose');
// We don't need real DB connection for this logic test if we mock the schema method
// But to use the actual model logic, we should use the model file.

const CourseEnrollment = require('./models/CourseEnrollment');

// Mock data
const mockCourseCodes = {
    modules: [{}, {}, {}, {}, {}, {}] // 6 modules
};

// Mock enrollment with logic similar to user report:
// "6 sessions only 3 have been completed, 1 is unlocked and 2 are locked"
// Assuming "sessions" here means "modules" or "days" within a module?
// Let's assume modules for now based on typical LMS structure.

const mockEnrollmentData = {
    moduleProgress: [
        { module: 'id1', status: 'completed' },
        { module: 'id2', status: 'completed' },
        { module: 'id3', status: 'completed' },
        { module: 'id4', status: 'in_progress' }, // unlocked
        { module: 'id5', status: 'locked' },      // locked (not started)
        { module: 'id6', status: 'locked' }       // locked
    ]
};

// Replicate the calculation logic from CourseEnrollment.js schema method
function calculateProgress(enrollment, course) {
    if (!enrollment.moduleProgress || enrollment.moduleProgress.length === 0) {
        return 0;
    }

    const completedModules = enrollment.moduleProgress.filter(m => m.status === 'completed').length;

    // The issue might be here: what is the denominator?
    // Method 1: Total modules in course (Correct)
    const totalModulesCourse = course.modules.length;
    const progressMethod1 = Math.round((completedModules / totalModulesCourse) * 100);

    // Method 2: Total modules in enrollment array (Incorrect if array is incomplete or filters used)
    const totalModulesEnrollment = enrollment.moduleProgress.length;
    const progressMethod2 = Math.round((completedModules / totalModulesEnrollment) * 100);

    console.log(`\n--- Calculation Test ---`);
    console.log(`Completed Modules: ${completedModules}`);
    console.log(`Total Modules (Course): ${totalModulesCourse}`);
    console.log(`Total Modules (Enrollment Record): ${totalModulesEnrollment}`);

    console.log(`Method 1 (Course Based): ${progressMethod1}%`);
    console.log(`Method 2 (Enrollment Based): ${progressMethod2}%`);

    return { progressMethod1, progressMethod2 };
}

// Mock the user scenario
// Case A: 3 completed out of 6 total
console.log('Case A: 3/6 Completed');
calculateProgress(mockEnrollmentData, mockCourseCodes);

// Case B: User scenario "shows 100%". 
// This happens if Method 2 is used AND the enrollment array ONLY contains the completed modules.
const mockEnrollmentBug = {
    moduleProgress: [
        { module: 'id1', status: 'completed' },
        { module: 'id2', status: 'completed' },
        { module: 'id3', status: 'completed' }
        // The other modules are missing from the array!
    ]
};
console.log('\nCase B: 3/6 Completed but others missing from array (Simulating 100% bug)');
calculateProgress(mockEnrollmentBug, mockCourseCodes);
