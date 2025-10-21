// T012: Pomodoro Session Model
export type SessionStatus = 'active' | 'completed' | 'cancelled';

export interface Session {
  id: string;
  userId: string;
  taskId: string | null;
  startTime: any;                   // Firestore Timestamp
  endTime: any | null;              // Firestore Timestamp
  duration: number;                 // saniye cinsinden
  status: SessionStatus;
  completedAt: any | null;          // Firestore Timestamp
  notes: string | null;
}

// Backward compatibility
export interface PomodoroSession extends Session {
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
export interface SessionViewModel extends Session {
  taskTitle?: string;
  formattedDuration: string;        // "25:00"
  formattedDate: string;            // "21 Oct 2025"
}
