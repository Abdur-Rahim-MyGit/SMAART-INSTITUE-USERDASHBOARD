# 📁 FILES TO UPDATE - Quick Reference Guide

## 🎯 IMMEDIATE PRIORITY (Start Today)

### 1. Dashboard Home Page - Real Data Integration
**File**: `src/pages/DashboardHome.jsx`

**What to Add**:
- [ ] Fetch real enrolled courses from API
- [ ] Fetch user stats (baseline score, completed modules)
- [ ] Calculate real weekly progress
- [ ] Add loading states
- [ ] Add error handling

**API Endpoints to Use**:
```javascript
GET /api/courseEnrollments/student/:studentId
GET /api/baselineresults/user/:userId
GET /api/tasks
```

---

### 2. Error Boundary Component
**File**: `src/components/ErrorBoundary.jsx` (CREATE NEW)

**What to Create**:
- [ ] Class component for error boundary
- [ ] Catch errors and show user-friendly message
- [ ] Add refresh button
- [ ] Style with your design system

**Then Update**: `src/App.jsx`
- [ ] Import ErrorBoundary
- [ ] Wrap entire app with ErrorBoundary

---

### 3. Loading Skeleton Components
**Files to Create**:
- [ ] `src/components/skeletons/CourseCardSkeleton.jsx`
- [ ] `src/components/skeletons/StatsCardSkeleton.jsx`
- [ ] `src/components/skeletons/TaskListSkeleton.jsx`

**Files to Update with Skeletons**:
- [ ] `src/pages/DashboardHome.jsx`
- [ ] `src/pages/MyCourses.jsx`
- [ ] `src/pages/Profile.jsx`
- [ ] `src/pages/SkillsPassport.jsx`
- [ ] `src/pages/MyAssessments.jsx`

---

### 4. Stats Dashboard Widget
**File**: `src/pages/DashboardHome.jsx`

**What to Add** (at line ~197, before hero section):
```javascript
// Add stats grid with 4 cards:
// 1. Total Courses
// 2. Completed Modules
// 3. Baseline Score
// 4. Day Streak
```

---

## 🔄 WEEK 1 UPDATES

### Pages Needing Error Handling:
1. ✅ `src/pages/DashboardHome.jsx`
2. ✅ `src/pages/MyCourses.jsx`
3. ✅ `src/pages/Profile.jsx`
4. ✅ `src/pages/SkillsPassport.jsx`
5. ✅ `src/pages/MyAssessments.jsx`
6. ✅ `src/pages/ModuleViewPage.jsx`
7. ✅ `src/pages/Community.jsx`
8. ✅ `src/pages/StudentGroups.jsx`
9. ✅ `src/pages/MindCareSessions.jsx`
10. ✅ `src/pages/SMAArtToolkit.jsx`

**Pattern to Add to Each**:
```javascript
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    // ... fetch logic
  } catch (err) {
    setError(err.message);
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

### New Components to Create:

#### `src/components/ActivityFeed.jsx`
**Purpose**: Show recent user activity  
**Props**: `userId`  
**API**: Fetch enrollments and assessments  
**Location**: Add to Dashboard Home right column

#### `src/components/UpcomingDeadlines.jsx`
**Purpose**: Show upcoming task deadlines  
**Props**: `userId`  
**API**: Fetch tasks and filter by date  
**Location**: Add to Dashboard Home right column

#### `src/components/NotificationBell.jsx`
**Purpose**: Show notifications dropdown  
**Props**: None (uses global user state)  
**API**: TODO - create notifications endpoint  
**Location**: Add to DashboardHeader

#### `src/components/StatsCard.jsx`
**Purpose**: Reusable stat card component  
**Props**: `label, value, icon, color`  
**Location**: Used in DashboardHome stats grid

---

## 📱 MOBILE RESPONSIVENESS

### CSS Files to Update:
1. ✅ `src/index.css` - Add mobile breakpoints
2. ✅ Component-specific styles in each .jsx file

### Components Needing Mobile Optimization:
1. ✅ `src/components/DashboardSidebar.jsx`
   - Make collapsible on mobile
   - Add hamburger menu
   - Slide-in animation

2. ✅ `src/pages/DashboardHome.jsx`
   - Stack stats grid 2x2 on mobile
   - Make hero more compact
   - Stack main content vertically

3. ✅ `src/components/CoursePathway.jsx`
   - Optimize course cards for mobile
   - Larger touch targets
   - Simplified layout

4. ✅ Calendar widget in DashboardHome
   - Larger date cells for touch
   - Simplified controls

---

## 🎨 STYLING UPDATES

### `src/index.css`
**Add**:
```css
/* Mobile Breakpoints */
@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 1.5rem;
  }
  
  .hero-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* Touch Targets */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Loading Skeleton */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  animation: shimmer 2s infinite;
  background: linear-gradient(
    to right,
    #f0f0f0 0%,
    #e0e0e0 20%,
    #f0f0f0 40%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
}

.dark .skeleton {
  background: linear-gradient(
    to right,
    #1a1a1a 0%,
    #2a2a2a 20%,
    #1a1a1a 40%,
    #1a1a1a 100%
  );
}
```

---

## 🔧 SERVICE FILES TO UPDATE

### `src/services/api.js`
**Add**:
```javascript
// Course Enrollment - Get by student
export const courseEnrollmentAPI = {
  // ... existing methods
  
  getByStudent: async (studentId) => {
    return apiCall(`/courseEnrollments/student/${studentId}`);
  },
  
  getProgress: async (studentId) => {
    const enrollments = await apiCall(`/courseEnrollments/student/${studentId}`);
    
    // Calculate overall progress
    let totalModules = 0;
    let completedModules = 0;
    
    enrollments.forEach(enrollment => {
      enrollment.modules?.forEach(module => {
        totalModules++;
        if (module.completed) completedModules++;
      });
    });
    
    return {
      totalModules,
      completedModules,
      percentage: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0
    };
  }
};

// Stats API
export const statsAPI = {
  getUserStats: async (userId) => {
    const [enrollments, baseline, tasks] = await Promise.all([
      apiCall(`/courseEnrollments/student/${userId}`),
      apiCall(`/baselineresults/user/${userId}`),
      apiCall(`/tasks`)
    ]);
    
    return {
      totalCourses: enrollments.length,
      completedModules: enrollments.reduce((sum, e) => 
        sum + (e.completedModules?.length || 0), 0
      ),
      baselineScore: baseline?.baselineScore || 0,
      pendingTasks: tasks.filter(t => t.status === 'Pending').length,
      // TODO: Calculate day streak from activity log
      dayStreak: 12
    };
  }
};
```

---

## 📦 PACKAGES TO INSTALL

```bash
# For onboarding tutorial
npm install react-joyride

# For pull-to-refresh (mobile)
npm install react-pull-to-refresh

# For better date handling
npm install date-fns

# For charts (if needed)
npm install recharts

# For animations (already installed)
# framer-motion ✓
```

---

## 🗂️ FOLDER STRUCTURE TO CREATE

```
src/
├── components/
│   ├── skeletons/
│   │   ├── CourseCardSkeleton.jsx
│   │   ├── StatsCardSkeleton.jsx
│   │   ├── TaskListSkeleton.jsx
│   │   └── ProfileSkeleton.jsx
│   ├── widgets/
│   │   ├── ActivityFeed.jsx
│   │   ├── UpcomingDeadlines.jsx
│   │   ├── StatsCard.jsx
│   │   └── NotificationBell.jsx
│   ├── ErrorBoundary.jsx
│   └── OnboardingTour.jsx
├── hooks/
│   ├── useUserStats.js
│   ├── useEnrolledCourses.js
│   └── useNotifications.js
└── utils/
    ├── dateHelpers.js
    └── statsCalculator.js
```

---

## 🎯 PRIORITY ORDER FOR UPDATES

### Day 1 (Today):
1. ✅ Create ErrorBoundary component
2. ✅ Add error handling to DashboardHome
3. ✅ Create loading skeletons
4. ✅ Add stats dashboard widget

### Day 2:
1. ✅ Integrate real course data in DashboardHome
2. ✅ Add loading states to MyCourses
3. ✅ Add error handling to Profile

### Day 3:
1. ✅ Create ActivityFeed component
2. ✅ Create UpcomingDeadlines component
3. ✅ Add to DashboardHome

### Day 4:
1. ✅ Create NotificationBell component
2. ✅ Add to DashboardHeader
3. ✅ Test all new features

### Day 5:
1. ✅ Start mobile optimization
2. ✅ Update DashboardSidebar for mobile
3. ✅ Add responsive breakpoints

---

## 📝 TESTING CHECKLIST

### After Each Update:
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test on mobile (Chrome DevTools)
- [ ] Test dark mode
- [ ] Test light mode
- [ ] Test with slow network (throttling)
- [ ] Test error scenarios
- [ ] Test loading states

### Specific Tests:
- [ ] Dashboard loads with real data
- [ ] Stats show correct numbers
- [ ] Loading skeletons appear
- [ ] Errors show user-friendly messages
- [ ] Mobile layout works
- [ ] Touch targets are large enough
- [ ] Notifications work
- [ ] Activity feed updates

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue: API calls failing
**Solution**: Check backend is running on port 5000, check auth token in sessionStorage

### Issue: Loading state stuck
**Solution**: Always use finally block to set loading to false

### Issue: Dark mode colors wrong
**Solution**: Add dark: prefix to Tailwind classes

### Issue: Mobile layout broken
**Solution**: Use responsive grid classes (sm:, md:, lg:)

### Issue: Components not updating
**Solution**: Check useEffect dependencies array

---

## 📊 PROGRESS TRACKING

### Week 1 Progress:
- [ ] 0/10 pages have error handling
- [ ] 0/10 pages have loading states
- [ ] 0/5 new components created
- [ ] 0/3 service files updated

### Week 2 Progress:
- [ ] 0/3 widgets created
- [ ] 0/1 notification system
- [ ] 0/5 pages optimized

### Week 3 Progress:
- [ ] 0/5 components mobile-optimized
- [ ] 0/3 gestures added
- [ ] 0/5 devices tested

### Week 4 Progress:
- [ ] 0/1 onboarding created
- [ ] 0/1 gamification added
- [ ] 0/10 final tests passed

---

**Last Updated**: February 3, 2026  
**Status**: Ready to Start  
**Next Action**: Create ErrorBoundary component
