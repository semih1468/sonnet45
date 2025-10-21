# Firestore Collections Contract

**Feature**: Pomodoro Firebase Integration
**Date**: 2025-10-21

## Collection Paths

### Users Collection
**Path**: `/users/{userId}`

**Purpose**: Store user profile information

**Schema**:
```typescript
{
  email: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}
```

**Access Rules**: User can only read/write their own document

---

### Sessions Subcollection
**Path**: `/users/{userId}/sessions/{sessionId}`

**Purpose**: Store Pomodoro session records

**Schema**:
```typescript
{
  startTime: Timestamp;
  endTime: Timestamp | null;
  duration: number;              // seconds
  status: 'active' | 'completed' | 'cancelled';
  taskId: string | null;
  createdAt: Timestamp;
}
```

**Constraints**:
- Auto-generated ID
- `duration` >= 0
- Only one active session per user at a time
- `status` must be 'completed' if `endTime` is set

**Indexes**:
```json
[
  {
    "fields": ["userId", "createdAt DESC"]
  },
  {
    "fields": ["userId", "status", "startTime DESC"]
  }
]
```

---

### Tasks Subcollection
**Path**: `/users/{userId}/tasks/{taskId}`

**Purpose**: Store user's tasks

**Schema**:
```typescript
{
  title: string;
  completed: boolean;
  pomodoroCount: number;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
}
```

**Constraints**:
- Auto-generated ID
- `title` length: 1-200 characters
- `pomodoroCount` >= 0
- `completedAt` must be null if `completed` is false

**Indexes**:
```json
[
  {
    "fields": ["userId", "completed", "createdAt DESC"]
  }
]
```

---

### Settings Document
**Path**: `/users/{userId}/settings`

**Purpose**: Store user preferences

**Schema**:
```typescript
{
  focusDuration: number;         // seconds, default: 1500
  breakDuration: number;         // seconds, default: 300
  soundEnabled: boolean;
  darkModeEnabled: boolean;
  autoStartEnabled: boolean;
  updatedAt: Timestamp;
}
```

**Constraints**:
- Fixed document ID: 'settings'
- `focusDuration`: 300-3600 seconds (5-60 minutes)
- `breakDuration`: 60-900 seconds (1-15 minutes)

**Defaults**:
```typescript
{
  focusDuration: 1500,
  breakDuration: 300,
  soundEnabled: true,
  darkModeEnabled: false,
  autoStartEnabled: false
}
```

---

### Stats Subcollection
**Path**: `/users/{userId}/stats/{date}`

**Purpose**: Store daily statistics

**Document ID**: Date string in YYYY-MM-DD format (e.g., "2025-10-21")

**Schema**:
```typescript
{
  date: string;                  // YYYY-MM-DD
  completedSessions: number;
  totalFocusTime: number;        // seconds
  streak: number;
  updatedAt: Timestamp;
}
```

**Constraints**:
- `date` must be valid YYYY-MM-DD format
- `completedSessions` >= 0
- `totalFocusTime` >= 0
- `streak` >= 0

**Indexes**:
```json
[
  {
    "fields": ["userId", "date DESC"]
  }
]
```

**Update Logic**:
- Increment `completedSessions` when session completed
- Add session duration to `totalFocusTime`
- Calculate `streak` based on consecutive days with sessions
- Set `updatedAt` to current timestamp

## Write Operations

### Session Creation
```typescript
addDoc(collection(db, `users/${userId}/sessions`), {
  startTime: serverTimestamp(),
  endTime: null,
  duration: focusDuration,
  status: 'active',
  taskId: selectedTaskId || null,
  createdAt: serverTimestamp()
});
```

### Session Completion
```typescript
updateDoc(doc(db, `users/${userId}/sessions/${sessionId}`), {
  endTime: serverTimestamp(),
  status: 'completed'
});
```

### Task Creation
```typescript
addDoc(collection(db, `users/${userId}/tasks`), {
  title: taskTitle,
  completed: false,
  pomodoroCount: 0,
  createdAt: serverTimestamp(),
  completedAt: null
});
```

### Task Update (Mark Complete)
```typescript
updateDoc(doc(db, `users/${userId}/tasks/${taskId}`), {
  completed: true,
  completedAt: serverTimestamp()
});
```

### Settings Update
```typescript
setDoc(doc(db, `users/${userId}/settings`), {
  ...updatedSettings,
  updatedAt: serverTimestamp()
}, { merge: true });
```

### Daily Stats Update (Transaction)
```typescript
const statsRef = doc(db, `users/${userId}/stats/${dateStr}`);

runTransaction(db, async (transaction) => {
  const statsDoc = await transaction.get(statsRef);

  if (!statsDoc.exists()) {
    // Create new stats document
    transaction.set(statsRef, {
      date: dateStr,
      completedSessions: 1,
      totalFocusTime: sessionDuration,
      streak: await calculateStreak(userId, dateStr),
      updatedAt: serverTimestamp()
    });
  } else {
    // Update existing stats
    transaction.update(statsRef, {
      completedSessions: increment(1),
      totalFocusTime: increment(sessionDuration),
      updatedAt: serverTimestamp()
    });
  }
});
```

## Read Operations

### Get User Settings
```typescript
const settingsDoc = await getDoc(doc(db, `users/${userId}/settings`));
const settings = settingsDoc.exists() ? settingsDoc.data() : DEFAULT_SETTINGS;
```

### Get Active Session
```typescript
const q = query(
  collection(db, `users/${userId}/sessions`),
  where('status', '==', 'active'),
  limit(1)
);
const snapshot = await getDocs(q);
```

### Get Recent Sessions (Last 100)
```typescript
const q = query(
  collection(db, `users/${userId}/sessions`),
  where('status', '==', 'completed'),
  orderBy('createdAt', 'desc'),
  limit(100)
);
const snapshot = await getDocs(q);
```

### Get Incomplete Tasks
```typescript
const q = query(
  collection(db, `users/${userId}/tasks`),
  where('completed', '==', false),
  orderBy('createdAt', 'desc')
);
const snapshot = await getDocs(q);
```

### Get Weekly Stats
```typescript
const q = query(
  collection(db, `users/${userId}/stats`),
  where('date', '>=', startDate),   // Monday
  where('date', '<=', endDate),     // Sunday
  orderBy('date', 'desc')
);
const snapshot = await getDocs(q);
```

## Real-time Listeners (Observable Streams)

### Active Session Listener
```typescript
const activeSession$ = collectionData(
  query(
    collection(db, `users/${userId}/sessions`),
    where('status', '==', 'active'),
    limit(1)
  ),
  { idField: 'id' }
).pipe(
  map(sessions => sessions[0] || null)
);
```

### Tasks Listener
```typescript
const tasks$ = collectionData(
  query(
    collection(db, `users/${userId}/tasks`),
    where('completed', '==', false),
    orderBy('createdAt', 'desc')
  ),
  { idField: 'id' }
);
```

### Settings Listener
```typescript
const settings$ = docData(
  doc(db, `users/${userId}/settings`)
).pipe(
  startWith(DEFAULT_SETTINGS)
);
```

## Error Handling

### Common Errors

**Permission Denied**:
```typescript
if (error.code === 'permission-denied') {
  // User not authenticated or accessing wrong data
  router.navigate(['/login']);
}
```

**Offline**:
```typescript
if (error.code === 'unavailable') {
  // Network error, data queued for sync
  showToast('Offline - changes will sync when online');
}
```

**Quota Exceeded**:
```typescript
if (error.code === 'resource-exhausted') {
  // Firebase quota exceeded
  showToast('Service temporarily unavailable');
}
```

## Batched Operations

### Delete Task (with related sessions)
```typescript
const batch = writeBatch(db);

// Update all sessions with this taskId
const sessions = await getDocs(
  query(
    collection(db, `users/${userId}/sessions`),
    where('taskId', '==', taskId)
  )
);

sessions.forEach(session => {
  batch.update(session.ref, { taskId: null });
});

// Delete the task
batch.delete(doc(db, `users/${userId}/tasks/${taskId}`));

await batch.commit();
```

## Migration Scripts

### Initialize User Settings (on first login)
```typescript
async function initializeUserSettings(userId: string) {
  const settingsRef = doc(db, `users/${userId}/settings`);
  const settingsDoc = await getDoc(settingsRef);

  if (!settingsDoc.exists()) {
    await setDoc(settingsRef, {
      ...DEFAULT_SETTINGS,
      updatedAt: serverTimestamp()
    });
  }
}
```

