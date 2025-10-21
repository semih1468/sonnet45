# Data Model: Pomodoro Firebase Integration

**Feature**: Pomodoro Firebase Integration
**Date**: 2025-10-21
**Branch**: `001-pomodoro-firebase-integration`

## Overview

Bu doküman Pomodoro uygulamasının veri modelini, Firestore koleksiyonlarını ve TypeScript interfaces'lerini tanımlar.

## Entity Relationship Diagram

```
User (1) ─────< (N) PomodoroSession
  │
  ├────< (N) Task
  │
  └────(1:1) UserSettings
          │
          └────(1) DailyStats
```

## Firestore Collections Structure

```
/users/{userId}
  - email: string
  - createdAt: Timestamp
  - lastLoginAt: Timestamp

/users/{userId}/sessions/{sessionId}
  - startTime: Timestamp
  - endTime: Timestamp | null
  - duration: number (seconds)
  - status: 'active' | 'completed' | 'cancelled'
  - taskId: string | null
  - createdAt: Timestamp

/users/{userId}/tasks/{taskId}
  - title: string
  - completed: boolean
  - pomodoroCount: number
  - createdAt: Timestamp
  - completedAt: Timestamp | null

/users/{userId}/settings
  - focusDuration: number (seconds, default: 1500)
  - breakDuration: number (seconds, default: 300)
  - soundEnabled: boolean
  - darkModeEnabled: boolean
  - autoStartEnabled: boolean
  - updatedAt: Timestamp

/users/{userId}/stats/{date}   // date format: YYYY-MM-DD
  - date: string (YYYY-MM-DD)
  - completedSessions: number
  - totalFocusTime: number (seconds)
  - streak: number (consecutive days)
  - updatedAt: Timestamp
```

## TypeScript Models

### 1. User Model

```typescript
// src/app/core/models/user.model.ts

export interface User {
  uid: string;                    // Firebase Auth UID
  email: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface UserProfile extends User {
  settings?: UserSettings;
  currentStreak?: number;
}
```

### 2. Pomodoro Session Model

```typescript
// src/app/core/models/session.model.ts

export type SessionStatus = 'active' | 'completed' | 'cancelled';

export interface PomodoroSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number;                // in seconds
  status: SessionStatus;
  taskId: string | null;
  createdAt: Date;
}

export interface CreateSessionDto {
  userId: string;
  taskId?: string;
  duration?: number;                // optional, default from settings
}

export interface UpdateSessionDto {
  endTime?: Date;
  status?: SessionStatus;
}

// For UI display
export interface SessionViewModel extends PomodoroSession {
  taskTitle?: string;
  formattedDuration: string;        // "25:00"
  formattedDate: string;            // "21 Oct 2025"
}
```

### 3. Task Model

```typescript
// src/app/core/models/task.model.ts

export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  pomodoroCount: number;
  createdAt: Date;
  completedAt: Date | null;
}

export interface CreateTaskDto {
  title: string;
  userId: string;
}

export interface UpdateTaskDto {
  title?: string;
  completed?: boolean;
}

// For UI display
export interface TaskViewModel extends Task {
  isEditing?: boolean;
  localPomodoroCount?: number;      // optimistic UI update
}
```

### 4. User Settings Model

```typescript
// src/app/core/models/settings.model.ts

export interface UserSettings {
  userId: string;
  focusDuration: number;            // in seconds, default: 1500 (25 min)
  breakDuration: number;            // in seconds, default: 300 (5 min)
  soundEnabled: boolean;
  darkModeEnabled: boolean;
  autoStartEnabled: boolean;
  updatedAt: Date;
}

export interface UpdateSettingsDto {
  focusDuration?: number;
  breakDuration?: number;
  soundEnabled?: boolean;
  darkModeEnabled?: boolean;
  autoStartEnabled?: boolean;
}

export const DEFAULT_SETTINGS: Omit<UserSettings, 'userId' | 'updatedAt'> = {
  focusDuration: 1500,               // 25 minutes
  breakDuration: 300,                // 5 minutes
  soundEnabled: true,
  darkModeEnabled: false,
  autoStartEnabled: false
};
```

### 5. Statistics Model

```typescript
// src/app/core/models/statistics.model.ts

export interface DailyStats {
  userId: string;
  date: string;                      // YYYY-MM-DD
  completedSessions: number;
  totalFocusTime: number;            // in seconds
  streak: number;
  updatedAt: Date;
}

export interface WeeklyStats {
  startDate: string;                 // YYYY-MM-DD (Monday)
  endDate: string;                   // YYYY-MM-DD (Sunday)
  totalSessions: number;
  totalFocusTime: number;            // in seconds
  averageSessionDuration: number;    // in seconds
  dailyBreakdown: DailyStats[];
  currentStreak: number;
}

export interface MonthlyStats {
  month: string;                     // YYYY-MM
  totalSessions: number;
  totalFocusTime: number;            // in seconds
  averageSessionDuration: number;    // in seconds
  bestStreak: number;
  weeklyBreakdown: WeeklyStats[];
}

// For UI display
export interface StatsViewModel {
  today: DailyStats;
  weekly: WeeklyStats;
  monthly?: MonthlyStats;
  progressToday: number;             // 0-100 (percentage towards 4 sessions goal)
  nextBreakIn: number;               // sessions remaining
}
```

### 6. Timer State Model

```typescript
// src/app/core/models/timer.model.ts

export type TimerMode = 'focus' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerState {
  secondsRemaining: number;
  totalSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  mode: TimerMode;
  status: TimerStatus;
  currentSessionId: string | null;
  currentTaskId: string | null;
}

export interface TimerConfig {
  focusDuration: number;             // from user settings
  breakDuration: number;             // from user settings
  autoStart: boolean;                // from user settings
}
```

## Validation Rules

### Session Validation
- `duration` must be > 0 and <= 3600 (1 hour)
- `startTime` must be <= `endTime` (if endTime exists)
- `status` must be 'completed' if endTime exists
- `userId` must match authenticated user

### Task Validation
- `title` must be 1-200 characters
- `title` must not be empty or only whitespace
- `pomodoroCount` must be >= 0
- `completedAt` must be null if `completed` is false

### Settings Validation
- `focusDuration` must be between 300 (5 min) and 3600 (60 min)
- `breakDuration` must be between 60 (1 min) and 900 (15 min)
- All boolean fields must be true or false

## Firestore Indexes

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "completed", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stats",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## State Transitions

### Session Status Lifecycle

```
[Created] → status: 'active', startTime: now, endTime: null
    ↓
[Completed] → status: 'completed', endTime: now
    ↓
[Stats Updated] → DailyStats.completedSessions++, totalFocusTime += duration
    ↓
[Streak Calculated] → Check consecutive days, update streak
```

### Task Completion Lifecycle

```
[Created] → completed: false, pomodoroCount: 0
    ↓
[Session Linked] → Task gets associated with active session
    ↓
[Session Completed] → pomodoroCount++
    ↓
[User Marks Complete] → completed: true, completedAt: now
```

### Timer Mode Transitions

```
[Idle] → User clicks Start
    ↓
[Focus Running] → Timer counts down (25 min default)
    ↓
[Focus Complete] → Auto-switch to Break (if autoStart enabled)
    ↓
[Break Running] → Timer counts down (5 min default)
    ↓
[Break Complete] → Auto-switch to Focus or return to Idle
```

## Data Access Patterns

### Common Queries

```typescript
// Get user's active session
sessions.where('userId', '==', uid)
  .where('status', '==', 'active')
  .limit(1)

// Get recent completed sessions (last 100)
sessions.where('userId', '==', uid)
  .where('status', '==', 'completed')
  .orderBy('createdAt', 'desc')
  .limit(100)

// Get incomplete tasks
tasks.where('userId', '==', uid)
  .where('completed', '==', false)
  .orderBy('createdAt', 'desc')

// Get daily stats for date range
stats.where('userId', '==', uid)
  .where('date', '>=', startDate)
  .where('date', '<=', endDate)
  .orderBy('date', 'desc')

// Get user settings (single document)
doc(db, 'users', uid, 'settings')
```

### Optimistic Updates

For better UX, implement optimistic updates:

```typescript
// Task completion (optimistic)
1. Update UI immediately (task.completed = true)
2. Write to Firestore
3. If write fails, revert UI change
4. Show error message

// Session creation (optimistic)
1. Generate temporary ID
2. Show session as active in UI
3. Write to Firestore
4. Replace temporary ID with Firestore ID
5. If write fails, remove from UI and show error
```

## Offline Behavior

### Pending Writes Queue

Firestore SDK automatically queues writes when offline:

```
1. User creates task offline → Added to pending queue
2. User completes session offline → Added to pending queue
3. Connection restored → Queue processes automatically
4. UI updates with server timestamps
```

### Conflict Resolution

Last-write-wins for:
- User settings updates
- Task title edits
- Task completion status

Server timestamp for:
- Session creation (createdAt)
- Session completion (endTime)
- Stats updates (updatedAt)

## Data Retention

- **Sessions**: Kept indefinitely (user history)
- **Tasks**: Kept until user deletes
- **Stats**: Aggregated daily, kept indefinitely
- **Settings**: Kept until user deletes account

## GDPR Compliance

User data deletion:

```typescript
async function deleteUserData(userId: string) {
  const batch = writeBatch(db);

  // Delete all subcollections
  const sessions = await getDocs(collection(db, `users/${userId}/sessions`));
  sessions.forEach(doc => batch.delete(doc.ref));

  const tasks = await getDocs(collection(db, `users/${userId}/tasks`));
  tasks.forEach(doc => batch.delete(doc.ref));

  const stats = await getDocs(collection(db, `users/${userId}/stats`));
  stats.forEach(doc => batch.delete(doc.ref));

  // Delete settings
  batch.delete(doc(db, `users/${userId}/settings`));

  // Delete user document
  batch.delete(doc(db, `users/${userId}`));

  await batch.commit();
}
```

## Performance Considerations

1. **Pagination**: Limit queries to 50 items, use cursor-based pagination
2. **Caching**: Enable Firestore persistence for offline access
3. **Batch Writes**: Use batch writes when creating/updating multiple documents
4. **Query Optimization**: Create composite indexes for common query patterns
5. **Denormalization**: Store task title in session for quick display (optional)

