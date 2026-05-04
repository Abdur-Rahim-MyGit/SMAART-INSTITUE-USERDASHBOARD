# Course Structure & Progress Tracking Guide

## Overview

The SMAART Institute User Dashboard features a comprehensive course structure with three gated stages and parallel readiness tracks. This document explains how the learning journey is organized and how progress is tracked.

## Course Structure

### Core Programme (25 Courses)

The core programme is divided into three sequential stages:

#### Stage 1: Capacity (10 Courses)
- **Focus**: Building foundational capabilities
- **Courses**: S01-S10
- **Assessment Gate**: T1 (Baseline Test)
- **Unlock Requirement**: None (First stage is always unlocked)

#### Stage 2: Capability (10 Courses)
- **Focus**: Developing advanced capabilities
- **Courses**: S11-S20
- **Assessment Gate**: T2 (Mid-Program Assessment)
- **Unlock Requirement**: Complete all Stage 1 courses + Pass T1 assessment (70%+)

#### Stage 3: Leadership (5 Courses)
- **Focus**: Leadership and strategic skills
- **Courses**: S21-S25
- **Assessment Gate**: T3 (Final Assessment)
- **Unlock Requirement**: Complete all Stage 2 courses + Pass T2 assessment (70%+)

### Readiness Tracks (15 Courses)

Parallel tracks that unlock after completing specific core courses:

#### PIQ Track (Personal Intelligence Quotient) - 5 Courses
- **Courses**: P01-P05
- **Unlock Requirement**: Complete Course S05 (Stage 1)
- **Focus**: Personal development and self-awareness

#### AIQ Track (Applied Intelligence Quotient) - 5 Courses
- **Courses**: A01-A05
- **Unlock Requirement**: Complete Course S15 (Stage 2)
- **Focus**: Practical application of knowledge

#### SQ Track (Strategic Quotient) - 5 Courses
- **Courses**: Q01-Q05
- **Unlock Requirement**: Complete Course S21 (Stage 3)
- **Focus**: Strategic thinking and planning

## Progress Tracking

### User Progress Object

The system tracks progress through a `userProgress` object with the following structure:

```javascript
{
  completedCourses: ["S01", "S02", "S03"], // Array of completed course IDs
  currentCourse: "S04",                    // Currently active course
  completedStages: [1],                    // Array of completed stage IDs
  assessmentsPassed: ["T1"],              // Array of passed assessment gates
}
```

### Progress Calculation

- **Overall Progress**: Calculated as (completedCourses / 40) × 100%
- **Stage Progress**: Calculated per stage based on completed courses in that stage
- **Track Progress**: Calculated per track based on completed courses in that track

### Unlock Logic

#### Stage Unlocking
- Stage 1: Always unlocked
- Stage 2: Requires Stage 1 completion + T1 pass
- Stage 3: Requires Stage 2 completion + T2 pass

#### Course Unlocking
- First course of each unlocked stage: Always available
- Subsequent courses: Require previous course completion

#### Track Unlocking
- Each track unlocks after completing a specific core course
- PIQ: After S05
- AIQ: After S15
- SQ: After S21

## User Interface Features

### Header Section

- **Title**: "My Learning Journey"
- **Subtitle**: "Track your progress through the programme"
- **Progress Card**: Slim horizontal card showing:
  - Overall progress percentage
  - Number of completed courses
  - Number of remaining courses

### Stage Cards

Each stage card displays:
- Stage icon (BookOpen, Target, Crown)
- Stage badge (subtitle)
- Lock/Unlock status
- Stage name and description
- Progress bar (courses completed / total courses)
- Assessment gate information (if applicable)
- Expandable course list

### Course Cards

Each course card shows:
- Course ID (e.g., S01, S11)
- Completion status (checkmark or lock icon)
- Current course badge (if applicable)
- Course title and subtitle
- Clickable to open course (if unlocked)

### Track Cards

Each track card displays:
- Track icon (Brain, Bot, Leaf)
- Lock/Unlock status
- Track short name and full name
- Description
- Progress bar
- Unlock requirement
- View/Hide Courses button (if unlocked)

## Automatic Expansion

The system automatically expands the stage containing the user's current course. This allows users to quickly see where they are in their learning journey without manual navigation.

### How It Works

1. On page load, the system checks `userProgress.currentCourse`
2. It searches through all stages to find which one contains the current course
3. The relevant stage is automatically expanded
4. Users can collapse/expand any stage by clicking on it

## Navigation

### Continue Journey Button

Located in the progress card, this button:
- Finds the next incomplete course in sequence
- Navigates directly to that course
- Shows "Journey Completed! 🎉" toast if all courses are done

### Locked Content Interactions

When users click on locked content:
- **Locked Stage**: Shows toast with unlock requirements
- **Locked Course**: Shows toast with prerequisite course
- **Locked Track**: Shows toast with unlock requirement and specific course needed

## Assessment Gates

Assessment gates are critical checkpoints between stages:

### T1 (Baseline Test)
- **Location**: After Stage 1 completion
- **Passing Score**: 70%+
- **Purpose**: Validate foundational knowledge before advancing

### T2 (Mid-Program Assessment)
- **Location**: After Stage 2 completion
- **Passing Score**: 70%+
- **Purpose**: Validate capability development

### T3 (Final Assessment)
- **Location**: After Stage 3 completion
- **Passing Score**: 70%+
- **Purpose**: Final validation of leadership skills

## Technical Implementation

### Component Structure

- **CourseStructure.jsx**: Main component rendering the course structure
- **courseStructureData.js**: Data file containing STAGES, TRACKS, and course information
- **HeroSection.jsx**: Dashboard header with welcome message

### Key Functions

- `isStageUnlocked(stage)`: Checks if a stage is unlocked
- `isTrackUnlocked(track)`: Checks if a track is unlocked
- `isCourseUnlocked(courseId, stageId)`: Checks if a course is unlocked
- `handleLockedCourseClick(course, stageId)`: Shows toast for locked courses
- `handleLockedTrackClick(track)`: Shows toast for locked tracks

### State Management

- `expandedStage`: ID of currently expanded stage
- `expandedTrack`: ID of currently expanded track
- `isMobile`: Boolean for responsive design

## Responsive Design

### Mobile (< 768px)
- Stages and tracks stack vertically
- Progress card takes full width
- Course grid: 1 column

### Tablet (768px - 1024px)
- Stages and tracks in 2-column grid
- Progress card: auto width
- Course grid: 2 columns

### Desktop (> 1024px)
- Stages and tracks in 3-column grid
- Progress card: auto width
- Course grid: 3 columns

## Best Practices

### For Users
1. Complete courses in sequence within each stage
2. Pay attention to assessment gate requirements
3. Use the "Continue Journey" button for quick navigation
4. Check progress regularly to stay on track

### For Developers
1. Maintain the sequential course unlocking logic
2. Ensure assessment gates are properly validated
3. Keep progress calculations accurate
4. Test locked content interactions
5. Verify responsive behavior across devices

## Future Enhancements

Potential improvements to consider:
- Add progress milestones/achievements
- Implement course bookmarks
- Add estimated completion time per course
- Create progress comparison with peers
- Add personalized learning recommendations
- Implement offline progress tracking
