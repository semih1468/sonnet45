# Service Interfaces & Contracts

**Feature**: Pomodoro Firebase Integration
**Date**: 2025-10-21

## Core Services

### 1. AuthService

**Purpose**: Handle Firebase Authentication

**Interface**:
```typescript
export interface IAuthService {
  // Observable streams
  user$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;

  // Methods
  signup(email: string, password: string): Promise<User>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
```

**Implementation** (`auth.service.ts`):
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService implements IAuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  isAuthenticated$ = this.user$.pipe(map(user => !!user));

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    // Listen to auth state changes
    onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        this.userSubject.next({
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          createdAt: new Date(firebaseUser.metadata.creationTime!),
          lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime!)
        });
      } else {
        this.userSubject.next(null);
      }
    });
  }

  async signup(email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    // Create user document
    await setDoc(doc(this.firestore, `users/${credential.user.uid}`), {
      email,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });

    // Initialize settings
    await this.initializeSettings(credential.user.uid);

    return {
      uid: credential.user.uid,
      email,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
  }

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    // Update last login
    await updateDoc(doc(this.firestore, `users/${credential.user.uid}`), {
      lastLoginAt: serverTimestamp()
    });

    return {
      uid: credential.user.uid,
      email,
      createdAt: new Date(credential.user.metadata.creationTime!),
      lastLoginAt: new Date()
    };
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  getCurrentUser(): Promise<User | null> {
    return firstValueFrom(this.user$);
  }

  private async initializeSettings(userId: string): Promise<void> {
    await setDoc(doc(this.firestore, `users/${userId}/settings`), {
      ...DEFAULT_SETTINGS,
      updatedAt: serverTimestamp()
    });
  }
}
```

---

### 2. SessionsService

**Purpose**: Manage Pomodoro sessions

**Interface**:
```typescript
export interface ISessionsService {
  // Observable streams
  activeSession$: Observable<PomodoroSession | null>;
  recentSessions$: Observable<PomodoroSession[]>;

  // Methods
  startSession(taskId?: string): Promise<string>;
  completeSession(sessionId: string): Promise<void>;
  cancelSession(sessionId: string): Promise<void>;
  getSessionHistory(limit?: number): Promise<PomodoroSession[]>;
}
```

**Implementation** (`sessions.service.ts`):
```typescript
@Injectable({ providedIn: 'root' })
export class SessionsService implements ISessionsService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);

  activeSession$ = this.authService.user$.pipe(
    switchMap(user => {
      if (!user) return of(null);

      return collectionData(
        query(
          collection(this.firestore, `users/${user.uid}/sessions`),
          where('status', '==', 'active'),
          limit(1)
        ),
        { idField: 'id' }
      ).pipe(
        map(sessions => sessions[0] || null)
      );
    })
  );

  recentSessions$ = this.authService.user$.pipe(
    switchMap(user => {
      if (!user) return of([]);

      return collectionData(
        query(
          collection(this.firestore, `users/${user.uid}/sessions`),
          where('status', '==', 'completed'),
          orderBy('createdAt', 'desc'),
          limit(100)
        ),
        { idField: 'id' }
      );
    })
  );

  async startSession(taskId?: string): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const settings = await this.settingsService.getSettings();

    const sessionRef = await addDoc(
      collection(this.firestore, `users/${user.uid}/sessions`),
      {
        startTime: serverTimestamp(),
        endTime: null,
        duration: settings.focusDuration,
        status: 'active',
        taskId: taskId || null,
        createdAt: serverTimestamp()
      }
    );

    return sessionRef.id;
  }

  async completeSession(sessionId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await updateDoc(
      doc(this.firestore, `users/${user.uid}/sessions/${sessionId}`),
      {
        endTime: serverTimestamp(),
        status: 'completed'
      }
    );

    // Update stats (handled by stats service listener)
  }

  async cancelSession(sessionId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await updateDoc(
      doc(this.firestore, `users/${user.uid}/sessions/${sessionId}`),
      {
        endTime: serverTimestamp(),
        status: 'cancelled'
      }
    );
  }

  async getSessionHistory(limit: number = 100): Promise<PomodoroSession[]> {
    const user = await this.authService.getCurrentUser();
    if (!user) return [];

    const q = query(
      collection(this.firestore, `users/${user.uid}/sessions`),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PomodoroSession));
  }
}
```

---

### 3. TasksService

**Purpose**: Manage tasks

**Interface**:
```typescript
export interface ITasksService {
  // Observable streams
  tasks$: Observable<Task[]>;
  incompleteTasks$: Observable<Task[]>;

  // Methods
  createTask(title: string): Promise<string>;
  updateTask(taskId: string, updates: UpdateTaskDto): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  toggleTaskCompletion(taskId: string): Promise<void>;
}
```

**Implementation** (`tasks.service.ts`):
```typescript
@Injectable({ providedIn: 'root' })
export class TasksService implements ITasksService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  tasks$ = this.authService.user$.pipe(
    switchMap(user => {
      if (!user) return of([]);

      return collectionData(
        query(
          collection(this.firestore, `users/${user.uid}/tasks`),
          orderBy('createdAt', 'desc')
        ),
        { idField: 'id' }
      );
    })
  );

  incompleteTasks$ = this.tasks$.pipe(
    map(tasks => tasks.filter(task => !task.completed))
  );

  async createTask(title: string): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const taskRef = await addDoc(
      collection(this.firestore, `users/${user.uid}/tasks`),
      {
        title: title.trim(),
        completed: false,
        pomodoroCount: 0,
        createdAt: serverTimestamp(),
        completedAt: null
      }
    );

    return taskRef.id;
  }

  async updateTask(taskId: string, updates: UpdateTaskDto): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await updateDoc(
      doc(this.firestore, `users/${user.uid}/tasks/${taskId}`),
      updates
    );
  }

  async deleteTask(taskId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await deleteDoc(doc(this.firestore, `users/${user.uid}/tasks/${taskId}`));
  }

  async toggleTaskCompletion(taskId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const taskDoc = await getDoc(
      doc(this.firestore, `users/${user.uid}/tasks/${taskId}`)
    );

    if (!taskDoc.exists()) throw new Error('Task not found');

    const task = taskDoc.data() as Task;
    await updateDoc(taskDoc.ref, {
      completed: !task.completed,
      completedAt: !task.completed ? serverTimestamp() : null
    });
  }
}
```

---

### 4. SettingsService

**Purpose**: Manage user settings

**Interface**:
```typescript
export interface ISettingsService {
  // Observable stream
  settings$: Observable<UserSettings>;

  // Methods
  getSettings(): Promise<UserSettings>;
  updateSettings(updates: UpdateSettingsDto): Promise<void>;
}
```

**Implementation** (`settings.service.ts`):
```typescript
@Injectable({ providedIn: 'root' })
export class SettingsService implements ISettingsService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  settings$ = this.authService.user$.pipe(
    switchMap(user => {
      if (!user) return of(DEFAULT_SETTINGS as UserSettings);

      return docData(
        doc(this.firestore, `users/${user.uid}/settings`)
      ).pipe(
        startWith(DEFAULT_SETTINGS as UserSettings)
      );
    })
  );

  async getSettings(): Promise<UserSettings> {
    return firstValueFrom(this.settings$);
  }

  async updateSettings(updates: UpdateSettingsDto): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await setDoc(
      doc(this.firestore, `users/${user.uid}/settings`),
      {
        ...updates,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }
}
```

---

### 5. TimerService

**Purpose**: Manage timer state (local, not Firebase)

**Interface**:
```typescript
export interface ITimerService {
  // Observable streams
  timerState$: Observable<TimerState>;
  secondsRemaining$: Observable<number>;
  isRunning$: Observable<boolean>;

  // Methods
  start(mode: TimerMode, taskId?: string): void;
  pause(): void;
  resume(): void;
  reset(): void;
  complete(): void;
}
```

**Implementation** (`timer.service.ts`):
```typescript
@Injectable({ providedIn: 'root' })
export class TimerService implements ITimerService {
  private timerStateSubject = new BehaviorSubject<TimerState>({
    secondsRemaining: 1500,
    totalSeconds: 1500,
    isRunning: false,
    isPaused: false,
    mode: 'focus',
    status: 'idle',
    currentSessionId: null,
    currentTaskId: null
  });

  timerState$ = this.timerStateSubject.asObservable();
  secondsRemaining$ = this.timerState$.pipe(map(state => state.secondsRemaining));
  isRunning$ = this.timerState$.pipe(map(state => state.isRunning));

  private timerSubscription?: Subscription;
  private sessionsService = inject(SessionsService);
  private settingsService = inject(SettingsService);

  start(mode: TimerMode, taskId?: string): void {
    const settings = await this.settingsService.getSettings();
    const duration = mode === 'focus' ? settings.focusDuration : settings.breakDuration;

    if (mode === 'focus') {
      // Start Firebase session
      this.sessionsService.startSession(taskId).then(sessionId => {
        this.updateState({
          secondsRemaining: duration,
          totalSeconds: duration,
          isRunning: true,
          isPaused: false,
          mode,
          status: 'running',
          currentSessionId: sessionId,
          currentTaskId: taskId || null
        });

        this.startCountdown();
      });
    } else {
      // Break mode (local only)
      this.updateState({
        secondsRemaining: duration,
        totalSeconds: duration,
        isRunning: true,
        isPaused: false,
        mode,
        status: 'running',
        currentSessionId: null,
        currentTaskId: null
      });

      this.startCountdown();
    }
  }

  pause(): void {
    this.timerSubscription?.unsubscribe();
    this.updateState({
      ...this.timerStateSubject.value,
      isRunning: false,
      isPaused: true,
      status: 'paused'
    });
  }

  resume(): void {
    this.updateState({
      ...this.timerStateSubject.value,
      isRunning: true,
      isPaused: false,
      status: 'running'
    });

    this.startCountdown();
  }

  reset(): void {
    this.timerSubscription?.unsubscribe();
    const settings = await this.settingsService.getSettings();

    this.updateState({
      secondsRemaining: settings.focusDuration,
      totalSeconds: settings.focusDuration,
      isRunning: false,
      isPaused: false,
      mode: 'focus',
      status: 'idle',
      currentSessionId: null,
      currentTaskId: null
    });
  }

  async complete(): Promise<void> {
    const state = this.timerStateSubject.value;

    if (state.currentSessionId) {
      await this.sessionsService.completeSession(state.currentSessionId);
    }

    // Auto-switch to break if enabled
    const settings = await this.settingsService.getSettings();
    if (settings.autoStartEnabled && state.mode === 'focus') {
      this.start('break');
    } else {
      this.reset();
    }
  }

  private startCountdown(): void {
    this.timerSubscription = interval(1000)
      .pipe(
        takeWhile(() => this.timerStateSubject.value.secondsRemaining > 0),
        tap(() => this.tick())
      )
      .subscribe({
        complete: () => this.complete()
      });
  }

  private tick(): void {
    const current = this.timerStateSubject.value;
    this.updateState({
      ...current,
      secondsRemaining: current.secondsRemaining - 1
    });
  }

  private updateState(state: TimerState): void {
    this.timerStateSubject.next(state);
  }
}
```

---

### 6. StatisticsService

**Purpose**: Calculate and retrieve statistics

**Interface**:
```typescript
export interface IStatisticsService {
  // Observable streams
  dailyStats$: Observable<DailyStats | null>;
  weeklyStats$: Observable<WeeklyStats | null>;

  // Methods
  getTodayStats(): Promise<DailyStats>;
  getWeeklyStats(startDate: Date): Promise<WeeklyStats>;
  calculateStreak(userId: string, date: string): Promise<number>;
}
```

**Implementation** (`statistics.service.ts`):
```typescript
@Injectable({ providedIn: 'root' })
export class StatisticsService implements IStatisticsService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  dailyStats$ = this.authService.user$.pipe(
    switchMap(user => {
      if (!user) return of(null);

      const today = format(new Date(), 'yyyy-MM-dd');
      return docData(
        doc(this.firestore, `users/${user.uid}/stats/${today}`)
      ).pipe(
        startWith(null)
      );
    })
  );

  weeklyStats$ = this.authService.user$.pipe(
    switchMap(user => {
      if (!user) return of(null);

      const startOfWeek = startOfISOWeek(new Date());
      const endOfWeek = endOfISOWeek(new Date());

      return collectionData(
        query(
          collection(this.firestore, `users/${user.uid}/stats`),
          where('date', '>=', format(startOfWeek, 'yyyy-MM-dd')),
          where('date', '<=', format(endOfWeek, 'yyyy-MM-dd')),
          orderBy('date', 'desc')
        )
      ).pipe(
        map(dailyStats => this.aggregateWeeklyStats(dailyStats))
      );
    })
  );

  async getTodayStats(): Promise<DailyStats> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const today = format(new Date(), 'yyyy-MM-dd');
    const statsDoc = await getDoc(
      doc(this.firestore, `users/${user.uid}/stats/${today}`)
    );

    return statsDoc.exists() ? statsDoc.data() as DailyStats : {
      userId: user.uid,
      date: today,
      completedSessions: 0,
      totalFocusTime: 0,
      streak: 0,
      updatedAt: new Date()
    };
  }

  async getWeeklyStats(startDate: Date): Promise<WeeklyStats> {
    const user = await this.authService.getCurrentUser();
    if (!user) return this.getEmptyWeeklyStats(startDate);

    const endDate = addDays(startDate, 6);

    const q = query(
      collection(this.firestore, `users/${user.uid}/stats`),
      where('date', '>=', format(startDate, 'yyyy-MM-dd')),
      where('date', '<=', format(endDate, 'yyyy-MM-dd')),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    const dailyStats = snapshot.docs.map(doc => doc.data() as DailyStats);

    return this.aggregateWeeklyStats(dailyStats);
  }

  async calculateStreak(userId: string, date: string): Promise<number> {
    // Implementation: Count consecutive days with at least 1 session
    let streak = 1;  // Current day counts
    let checkDate = subDays(parseISO(date), 1);

    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const statsDoc = await getDoc(
        doc(this.firestore, `users/${userId}/stats/${dateStr}`)
      );

      if (!statsDoc.exists() || statsDoc.data().completedSessions === 0) {
        break;
      }

      streak++;
      checkDate = subDays(checkDate, 1);
    }

    return streak;
  }

  private aggregateWeeklyStats(dailyStats: DailyStats[]): WeeklyStats {
    // Implementation details...
  }

  private getEmptyWeeklyStats(startDate: Date): WeeklyStats {
    // Implementation details...
  }
}
```

## Error Handling Contract

All services should handle errors consistently:

```typescript
export interface ServiceError {
  code: string;
  message: string;
  originalError?: any;
}

export class FirebaseServiceError extends Error implements ServiceError {
  constructor(
    public code: string,
    public message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'FirebaseServiceError';
  }
}

// Usage in services:
try {
  await someFirestoreOperation();
} catch (error) {
  throw new FirebaseServiceError(
    error.code,
    'Failed to create session',
    error
  );
}
```

## Testing Contracts

All services must have unit tests covering:

1. **Happy path**: Successful operations
2. **Error cases**: Permission denied, network errors
3. **Edge cases**: Empty data, null values
4. **Observable streams**: Proper cleanup, unsubscribe

Example test structure:

```typescript
describe('SessionsService', () => {
  let service: SessionsService;
  let authService: jasmine.SpyObj<AuthService>;
  let firestore: Firestore;

  beforeEach(() => {
    // Setup mocks and test bed
  });

  describe('startSession', () => {
    it('should create a new session', async () => {
      // Test implementation
    });

    it('should throw error when user not authenticated', async () => {
      // Test implementation
    });
  });

  describe('activeSession$', () => {
    it('should emit active session when user logs in', (done) => {
      // Test implementation
    });

    it('should emit null when no active session', (done) => {
      // Test implementation
    });
  });
});
```

