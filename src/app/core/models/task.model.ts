// T096: Task Model - Gelişmiş görev yönetimi
export type TaskStatus = 'active' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedPomodoros: number;      // Tahmini pomodoro sayısı
  completedPomodoros: number;      // Tamamlanan pomodoro sayısı
  createdAt: any;                  // Firestore Timestamp
  updatedAt: any;                  // Firestore Timestamp
  completedAt: any | null;         // Firestore Timestamp
  dueDate: any | null;             // Firestore Timestamp
  tags: string[];                  // Etiketler
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimatedPomodoros?: number;
  dueDate?: Date;
  tags?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  dueDate?: Date;
  tags?: string[];
}

// UI için
export interface TaskViewModel extends Task {
  progressPercentage: number;
  isOverdue: boolean;
  formattedDueDate: string;
}
