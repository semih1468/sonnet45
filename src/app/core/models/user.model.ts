// T011: User Model
import type { UserSettings } from './settings.model';

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
