# Firestore Security Rules

**Feature**: Pomodoro Firebase Integration
**Date**: 2025-10-21

## Security Rules File

**File**: `firestore.rules`

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isValidEmail(email) {
      return email.matches('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
    }

    function isValidTimestamp(timestamp) {
      return timestamp is timestamp;
    }

    // Users collection
    match /users/{userId} {
      // Users can read and update their own profile
      allow read: if isOwner(userId);
      allow create: if isOwner(userId) && isValidEmail(request.resource.data.email);
      allow update: if isOwner(userId);
      allow delete: if false;  // Prevent accidental deletion

      // Sessions subcollection
      match /sessions/{sessionId} {
        // Only owner can read/write sessions
        allow read: if isOwner(userId);

        // Create session
        allow create: if isOwner(userId)
          && request.resource.data.keys().hasAll(['startTime', 'duration', 'status', 'createdAt'])
          && request.resource.data.status == 'active'
          && request.resource.data.duration > 0
          && request.resource.data.duration <= 3600
          && isValidTimestamp(request.resource.data.startTime)
          && request.resource.data.endTime == null;

        // Update session (complete/cancel)
        allow update: if isOwner(userId)
          && (request.resource.data.status == 'completed' || request.resource.data.status == 'cancelled')
          && (request.resource.data.status == 'completed' ? request.resource.data.endTime != null : true)
          && isValidTimestamp(request.resource.data.endTime);

        // Delete not allowed
        allow delete: if false;
      }

      // Tasks subcollection
      match /tasks/{taskId} {
        // Only owner can read/write tasks
        allow read: if isOwner(userId);

        // Create task
        allow create: if isOwner(userId)
          && request.resource.data.keys().hasAll(['title', 'completed', 'pomodoroCount', 'createdAt'])
          && request.resource.data.title is string
          && request.resource.data.title.size() > 0
          && request.resource.data.title.size() <= 200
          && request.resource.data.completed == false
          && request.resource.data.pomodoroCount == 0
          && request.resource.data.completedAt == null
          && isValidTimestamp(request.resource.data.createdAt);

        // Update task
        allow update: if isOwner(userId)
          && request.resource.data.pomodoroCount >= resource.data.pomodoroCount  // Can only increment
          && (request.resource.data.completed == true ? request.resource.data.completedAt != null : true);

        // Delete task
        allow delete: if isOwner(userId);
      }

      // Settings document
      match /settings {
        // Only owner can read/write settings
        allow read: if isOwner(userId);

        // Create or update settings
        allow create, update: if isOwner(userId)
          && request.resource.data.focusDuration >= 300
          && request.resource.data.focusDuration <= 3600
          && request.resource.data.breakDuration >= 60
          && request.resource.data.breakDuration <= 900
          && request.resource.data.soundEnabled is bool
          && request.resource.data.darkModeEnabled is bool
          && request.resource.data.autoStartEnabled is bool
          && isValidTimestamp(request.resource.data.updatedAt);

        // Delete not allowed
        allow delete: if false;
      }

      // Stats subcollection
      match /stats/{date} {
        // Only owner can read stats
        allow read: if isOwner(userId);

        // Create or update stats (transactions only)
        allow create, update: if isOwner(userId)
          && request.resource.data.date == date
          && request.resource.data.completedSessions >= 0
          && request.resource.data.totalFocusTime >= 0
          && request.resource.data.streak >= 0
          && isValidTimestamp(request.resource.data.updatedAt);

        // Delete not allowed
        allow delete: if false;
      }
    }

    // Deny all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Rule Explanation

### Authentication Check
```javascript
function isAuthenticated() {
  return request.auth != null;
}
```
- Verifies user is logged in via Firebase Authentication
- Used in all rules as base requirement

### Ownership Check
```javascript
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}
```
- Ensures user can only access their own data
- Compares authenticated UID with document path userId

### Data Validation

**Email Validation**:
```javascript
function isValidEmail(email) {
  return email.matches('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
}
```

**Timestamp Validation**:
```javascript
function isValidTimestamp(timestamp) {
  return timestamp is timestamp;
}
```

### Session Rules

**Create Session**:
- Must be owner
- Required fields: startTime, duration, status, createdAt
- Status must be 'active'
- Duration: 1-3600 seconds
- endTime must be null

**Update Session**:
- Must be owner
- Status can be 'completed' or 'cancelled'
- If completed, endTime must be set
- Timestamps must be valid

**Delete Session**:
- Not allowed (preserve history)

### Task Rules

**Create Task**:
- Must be owner
- Title: 1-200 characters
- Initial values: completed=false, pomodoroCount=0
- completedAt must be null

**Update Task**:
- Must be owner
- pomodoroCount can only increase
- If completed=true, completedAt must be set

**Delete Task**:
- Allowed for owner only

### Settings Rules

**Create/Update**:
- Must be owner
- focusDuration: 300-3600 seconds (5-60 minutes)
- breakDuration: 60-900 seconds (1-15 minutes)
- All boolean fields validated

**Delete**:
- Not allowed (preserve settings)

### Stats Rules

**Create/Update**:
- Must be owner
- Date must match document ID
- All counters must be >= 0
- Transaction-based updates

**Delete**:
- Not allowed (preserve history)

## Testing Security Rules

### Local Testing with Emulator

```bash
# Start Firebase emulators
firebase emulators:start

# Test security rules
npm test -- src/app/core/services/firestore.service.spec.ts
```

### Test Cases

**Unauthenticated Access**:
```typescript
it('should deny unauthenticated read', async () => {
  const db = getFirestore(app);
  await expect(
    getDoc(doc(db, 'users/someUser/sessions/session1'))
  ).toThrowError('permission-denied');
});
```

**Cross-User Access**:
```typescript
it('should deny reading other user data', async () => {
  const db = getFirestore(app);
  signInAsUser(app, 'user1');

  await expect(
    getDocs(collection(db, 'users/user2/sessions'))
  ).toThrowError('permission-denied');
});
```

**Invalid Data**:
```typescript
it('should deny invalid session duration', async () => {
  const db = getFirestore(app);
  signInAsUser(app, 'user1');

  await expect(
    addDoc(collection(db, 'users/user1/sessions'), {
      duration: 5000,  // Invalid: > 3600
      status: 'active',
      startTime: serverTimestamp(),
      createdAt: serverTimestamp()
    })
  ).toThrowError('permission-denied');
});
```

## Deployment

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy rules and indexes together
firebase deploy --only firestore
```

## Monitoring

### Firebase Console Alerts

Set up alerts for:
1. Permission denied errors spike
2. Invalid data attempts
3. Quota exceeded warnings

### Logging

```typescript
// In error interceptor
if (error.code === 'permission-denied') {
  console.error('Security rule violation:', {
    path: error.path,
    operation: error.operation,
    timestamp: new Date().toISOString()
  });
}
```

## Common Issues

**Issue**: User can't create session
**Cause**: Missing required fields or invalid duration
**Fix**: Ensure all required fields are present and valid

**Issue**: Session update fails
**Cause**: endTime not set when status='completed'
**Fix**: Always set endTime when completing session

**Issue**: Task pomodoroCount decreases
**Cause**: Rule prevents decrementing
**Fix**: Ensure update only increments count

## Migration Strategy

If rules need to change:

1. **Test new rules** in emulator first
2. **Deploy during low traffic** hours
3. **Monitor errors** for 24 hours
4. **Rollback if needed** (keep old rules in version control)

## Security Best Practices

1. **Never trust client data** - Validate everything
2. **Deny by default** - Explicit allow rules only
3. **Limit data access** - Only what's needed
4. **Validate structure** - Check all required fields
5. **Test thoroughly** - Unit tests for all rules
6. **Monitor continuously** - Set up alerts
7. **Version control** - Track rule changes
8. **Document changes** - Update this file

