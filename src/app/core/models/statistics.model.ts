// T015: Daily Stats Model
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
