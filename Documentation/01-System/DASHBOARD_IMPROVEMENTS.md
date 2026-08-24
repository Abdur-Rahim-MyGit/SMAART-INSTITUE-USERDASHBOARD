# Dashboard Home - Improvement Plan

This document outlines potential enhancements for the `DashboardHome.jsx` page to elevate it to a "World-Class" standard, focusing on personalization, engagement, and functional depth.

## 1. Visual & UX Polish (Aesthetic Excellence)

*   **Dynamic Greeting**: Update the "Welcome back" to be time-aware (e.g., "Good Morning, Abdur", "Good Evening, Abdur") for a personal touch.
*   **Weather/Context Widget**: Add a subtle weather icon or "Learning Focus" based on time of day (e.g., "Ready for your morning session?").
*   **Glassmorphism Refinement**: Enhance the `bg-white/bg-slate-800` cards with subtle `backdrop-blur` and border gradients to deepen the "Premium" feel, especially in Dark Mode.
*   **Skeleton Loading States**: Ensure *all* widgets (Calendar, Quick Access) have matching skeleton loaders to prevent layout shift during the initial 1-2 second load.

## 2. Functional Enhancements (Real Utility)

### A. "Upcoming Deadlines" Real Data Integration
**Current State**: Hardcoded mock data.
**Improvement**:
*   Fetch real deadlines from `Course` modules or `Tasks`.
*   Show "Next Live Session" if applicable.
*   Display a countdown (e.g., "Due in 2 days").
*   **Action**: Update `fetchDashboardData` to aggregate upcoming due dates from enrolled courses.

### B. "Ongoing Learning" Carousel
**Current State**: Shows only the *single* most recent course.
**Improvement**:
*   Implement a **Carousel/Slider** if the user has multiple active courses.
*   Allow users to swipe between "Advanced Leadership" and "Technical Skills" without leaving the dashboard.
*   **Benefit**: Reduces friction for users balancing multiple subjects.

### C. Daily Goal Tracker
**Current State**: Passive "Weekly Performance" circle.
**Improvement**:
*   Add an interactive **"Daily Goal"** widget (e.g., "Complete 1 Module", "Watch 20 mins").
*   Users can check off manual learning tasks.
*   Celebratory animation (confetti) upon daily goal completion.

## 3. Engagement & Gamification (Hook Modules)

*   **Community Pulse**: Add a small widget showing "Trending Discussions" or "3 active groups" to drive traffic to the Community page.
*   **Leaderboard Teaser**: "You are in the Top 10% this week!" – a small notification to boost motivation.
*   **Skill Radar (Mini)**: A small spider-chart showing their current skill balance (Leadership vs. Technical vs. Strategic) right on the home page.

## 4. Code Architecture (Maintainability)

*   **Custom Hook `useDashboardData`**:
    *   Extract the massive `fetchDashboardData` logic into a separate hook file (`hooks/useDashboardData.js`).
    *   This cleans up the visual component and makes the data logic testable.
*   **Componentization**:
    *   Extract `CalendarWidget`, `StatsGrid`, and `HeroSection` into identifying components.
    *   Result: `DashboardHome.jsx` becomes a clean layout file:
        ```jsx
        <Header />
        <HeroSection />
        <div className="grid...">
           <StatsGrid />
           <Sidebar />
        </div>
        ```

## 5. Mobile Responsiveness

*   **Calendar Adaptation**: Ensure the grid calendar collapses into a "Agenda View" or simpler list on mobile screens (< 640px) where touch targets in a 7-col grid might be too small.
*   **Stacked Layouts**: Verify that the "Ongoing Learning" card's flex direction switches cleanly on mobile.

## Implementation Roadmap (Prioritized)

1.  **Refactor**: Extract `useDashboardData` (Low Effort, High Value).
2.  **Real Deadlines**: Replace mock data in Calendar widget (Medium Effort).
3.  **Carousel**: Upgrade "Ongoing Learning" to support multiple courses (Medium Effort).
4.  **Community Pulse**: Add social feed widget (High Effort - requires Backend endpoints).

---
*Created by Antigravity - Feb 2026*
