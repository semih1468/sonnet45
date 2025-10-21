import { SupportedLanguageCode } from './language.model';

// T014: User Settings Model
export interface Settings {
  workDuration: number;              // dakika cinsinden, default: 25
  shortBreakDuration: number;        // dakika cinsinden, default: 5
  longBreakDuration: number;         // dakika cinsinden, default: 15
  longBreakInterval: number;         // kaç pomodoro sonra long break, default: 4
  autoStartBreaks: boolean;          // default: false
  autoStartPomodoros: boolean;       // default: false
  soundEnabled: boolean;             // default: true
  soundVolume: number;               // 0-100, default: 50
  notificationsEnabled: boolean;     // default: true
  darkMode: boolean;                 // default: false
  dailyGoal: number;                 // günlük hedef pomodoro sayısı, default: 8
  language?: SupportedLanguageCode;  // user's preferred language, default: 'tr'
}

// Backward compatibility
export interface UserSettings {
  userId: string;
  focusDuration: number;             // in seconds, default: 1500 (25 min)
  breakDuration: number;             // in seconds, default: 300 (5 min)
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
