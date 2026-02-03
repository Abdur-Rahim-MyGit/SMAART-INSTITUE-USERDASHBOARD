# Learning Streak & Attendance System

## Overview

The Learning Streak system tracks student engagement on the SMAART Minds platform. Students must spend **30 minutes** on the dashboard daily to maintain their streak.

---

## Current Implementation (Phase 1)

### How It Works

1. **Session Start**: When a student opens the dashboard, a session begins
2. **Heartbeat**: Every 60 seconds, the system records 1 minute of activity
3. **Goal Check**: At 30 minutes, the streak counter increments
4. **Persistence**: All data saved to MongoDB in the `Avatar` collection

### Data Model

```javascript
// Avatar Collection
{
  userId: ObjectId,
  streak: Number,              // Consecutive days count
  lastActivityDate: Date,      // For streak continuity
  dailySessions: [{
    date: String,              // "YYYY-MM-DD"
    totalMinutes: Number,      // Minutes accumulated
    streakCounted: Boolean     // Has 30 min been reached?
  }],
  currentSessionStart: Date    // Active session timestamp
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/avatar/start-session` | Start tracking session |
| POST | `/api/avatar/heartbeat` | Record 1 minute (call every 60s) |
| GET | `/api/avatar/session-status` | Get current session info |

### Frontend Components

- **`useSessionTracker.js`** - Hook that manages heartbeat timing
- **`LearningStreak.jsx`** - Widget showing streak progress

---

## Phase 2 Roadmap

### 2.1 Course Tracker Attendance

Track time spent on course modules and videos.

```javascript
dailySessions: [{
  courseMinutes: Number,
  modulesCompleted: Number
}]
```

### 2.2 Live Classes Attendance

Track attendance for coaching sessions.

```javascript
dailySessions: [{
  liveClassAttended: Boolean,
  sessionId: ObjectId
}]
```

### 2.3 Assessment-Based Attendance

Award streak bonus for completing assessments.

```javascript
dailySessions: [{
  assessmentsCompleted: Number,
  assessmentIds: [ObjectId]
}]
```

### 2.4 Community Participation

Track engagement in community discussions.

```javascript
dailySessions: [{
  communityPosts: Number,
  communityComments: Number
}]
```

---

## Configuration

### Streak Threshold

Located in `back-end/models/Avatar.js`:

```javascript
const STREAK_THRESHOLD_MINUTES = 30;  // Production: 30
// const STREAK_THRESHOLD_MINUTES = 1;  // Testing: 1
```

### Heartbeat Interval

Located in `front-end/src/hooks/useSessionTracker.js`:

```javascript
const HEARTBEAT_INTERVAL = 60000;  // 60 seconds
```

---

## Files Modified

### Backend

- `models/Avatar.js` - Session tracking schema & methods
- `controllers/avatarController.js` - Session API handlers
- `routes/avatar.js` - Session routes

### Frontend

- `hooks/useSessionTracker.js` - Session tracking hook
- `components/LearningStreak.jsx` - Streak widget UI

---

## Testing

1. Set `STREAK_THRESHOLD_MINUTES = 1` for quick testing
2. Login to dashboard at `http://localhost:5173/dashboard`
3. Watch the Learning Streak widget increment
4. After threshold, streak count updates with celebration
5. Reset to `30` for production
