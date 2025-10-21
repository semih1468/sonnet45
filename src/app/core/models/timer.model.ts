// T016: Timer State Model
export type TimerMode = 'work' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerState {
  remainingTime: number;              // saniye cinsinden kalan süre
  isRunning: boolean;                 // timer çalışıyor mu
  isPaused: boolean;                  // timer duraklatıldı mı
  mode: TimerMode;                    // mevcut mod
  completedPomodoros: number;         // tamamlanan pomodoro sayısı
  currentSession: string | null;      // aktif session ID
}

export interface TimerConfig {
  focusDuration: number;              // from user settings
  breakDuration: number;              // from user settings
  autoStart: boolean;                 // from user settings
}
