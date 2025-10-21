// T141: Statistics Service - İstatistik hesaplamaları servisi
import { Injectable, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { AuthService } from './auth.service';
import { PomodoroSession } from '../models/session.model';
import { DailyStats, WeeklyStats, MonthlyStats } from '../models/statistics.model';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private firestore: Firestore;
  private authService: AuthService;
  private settingsService: SettingsService;

  constructor() {
    this.firestore = inject(Firestore);
    this.authService = inject(AuthService);
    this.settingsService = inject(SettingsService);
  }

  // T142: Bugünün istatistiklerini getir
  async getTodayStats(): Promise<DailyStats> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return this.getEmptyDailyStats();
    }

    const today = this.getTodayDateString();
    const sessions = await this.getSessionsForDate(today);

    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const totalFocusTime = sessions
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + s.duration, 0);

    const streak = await this.calculateStreak();

    return {
      userId: user.uid,
      date: today,
      completedSessions,
      totalFocusTime,
      streak,
      updatedAt: new Date()
    };
  }

  // T143: Haftalık istatistikleri getir
  async getWeeklyStats(): Promise<WeeklyStats> {
    const { startDate, endDate } = this.getWeekRange();
    const sessions = await this.getSessionsForDateRange(startDate, endDate);

    const completedSessions = sessions.filter(s => s.status === 'completed');
    const totalSessions = completedSessions.length;
    const totalFocusTime = completedSessions.reduce((sum, s) => sum + s.duration, 0);
    const averageSessionDuration = totalSessions > 0 ? totalFocusTime / totalSessions : 0;

    const dailyBreakdown: DailyStats[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = this.formatDate(date);
      const daySessions = sessions.filter(s =>
        this.formatDate(s.startTime.toDate()) === dateStr
      );
      const completedCount = daySessions.filter(s => s.status === 'completed').length;
      const focusTime = daySessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + s.duration, 0);

      dailyBreakdown.push({
        userId: this.authService.getCurrentUser()?.uid || '',
        date: dateStr,
        completedSessions: completedCount,
        totalFocusTime: focusTime,
        streak: 0, // Bu değer sonradan güncellenecek
        updatedAt: new Date()
      });
    }

    const currentStreak = await this.calculateStreak();

    return {
      startDate: this.formatDate(new Date(startDate)),
      endDate: this.formatDate(new Date(endDate)),
      totalSessions,
      totalFocusTime,
      averageSessionDuration,
      dailyBreakdown,
      currentStreak
    };
  }

  // T144: Aylık istatistikleri getir
  async getMonthlyStats(): Promise<MonthlyStats> {
    const { startDate, endDate } = this.getMonthRange();
    const sessions = await this.getSessionsForDateRange(startDate, endDate);

    const completedSessions = sessions.filter(s => s.status === 'completed');
    const totalSessions = completedSessions.length;
    const totalFocusTime = completedSessions.reduce((sum, s) => sum + s.duration, 0);
    const averageSessionDuration = totalSessions > 0 ? totalFocusTime / totalSessions : 0;

    const bestStreak = await this.calculateBestStreakInRange(startDate, endDate);

    // Haftalık breakdown
    const weeklyBreakdown: WeeklyStats[] = [];
    let currentWeekStart = new Date(startDate);

    while (currentWeekStart <= endDate) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      if (weekEnd > endDate) {
        break;
      }

      const weekSessions = sessions.filter(s => {
        const sessionDate = s.startTime.toDate();
        return sessionDate >= currentWeekStart && sessionDate <= weekEnd;
      });

      const weekCompleted = weekSessions.filter(s => s.status === 'completed');
      const weekTotal = weekCompleted.length;
      const weekFocusTime = weekCompleted.reduce((sum, s) => sum + s.duration, 0);
      const weekAvg = weekTotal > 0 ? weekFocusTime / weekTotal : 0;

      weeklyBreakdown.push({
        startDate: this.formatDate(currentWeekStart),
        endDate: this.formatDate(weekEnd),
        totalSessions: weekTotal,
        totalFocusTime: weekFocusTime,
        averageSessionDuration: weekAvg,
        dailyBreakdown: [],
        currentStreak: 0
      });

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return {
      month: this.formatMonth(new Date(startDate)),
      totalSessions,
      totalFocusTime,
      averageSessionDuration,
      bestStreak,
      weeklyBreakdown
    };
  }

  // T145: Streak hesaplama
  private async calculateStreak(): Promise<number> {
    const user = this.authService.getCurrentUser();
    if (!user) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateStr = this.formatDate(currentDate);
      const sessions = await this.getSessionsForDate(dateStr);
      const completedToday = sessions.filter(s => s.status === 'completed').length;

      if (completedToday > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Bugünü kontrol ediyorsak ve session yoksa streak devam eder
        if (this.formatDate(new Date()) === dateStr) {
          currentDate.setDate(currentDate.getDate() - 1);
          continue;
        }
        break;
      }

      // Maksimum 365 gün geriye git
      if (streak >= 365) break;
    }

    return streak;
  }

  // T146: Belirli tarih aralığında best streak hesaplama
  private async calculateBestStreakInRange(startDate: Date, endDate: Date): Promise<number> {
    const sessions = await this.getSessionsForDateRange(startDate, endDate);

    let bestStreak = 0;
    let currentStreak = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = this.formatDate(currentDate);
      const daySessions = sessions.filter(s =>
        this.formatDate(s.startTime.toDate()) === dateStr && s.status === 'completed'
      );

      if (daySessions.length > 0) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return bestStreak;
  }

  // T147: Günlük hedef progress yüzdesini hesapla
  async getTodayProgress(): Promise<number> {
    const todayStats = await this.getTodayStats();
    const settings = this.settingsService.getCurrentSettings();
    const dailyGoal = settings.dailyGoal || 8;

    return Math.min(100, Math.round((todayStats.completedSessions / dailyGoal) * 100));
  }

  // T148: Sonraki long break'e kalan session sayısı
  async getNextBreakIn(): Promise<number> {
    const user = this.authService.getCurrentUser();
    if (!user) return 0;

    const today = this.getTodayDateString();
    const sessions = await this.getSessionsForDate(today);
    const completedToday = sessions.filter(s => s.status === 'completed').length;

    const settings = this.settingsService.getCurrentSettings();
    const longBreakInterval = settings.longBreakInterval || 4;

    const sessionsUntilBreak = longBreakInterval - (completedToday % longBreakInterval);
    return sessionsUntilBreak === longBreakInterval ? 0 : sessionsUntilBreak;
  }

  // Helper: Belirli tarihteki sessionları getir
  private async getSessionsForDate(dateStr: string): Promise<PomodoroSession[]> {
    const user = this.authService.getCurrentUser();
    if (!user) return [];

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const sessionsRef = collection(this.firestore, `users/${user.uid}/sessions`);
    const q = query(
      sessionsRef,
      where('startTime', '>=', Timestamp.fromDate(startOfDay)),
      where('startTime', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('startTime', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()['startTime']?.toDate() || new Date()
    } as PomodoroSession));
  }

  // Helper: Tarih aralığındaki sessionları getir
  private async getSessionsForDateRange(startDate: Date, endDate: Date): Promise<PomodoroSession[]> {
    const user = this.authService.getCurrentUser();
    if (!user) return [];

    const sessionsRef = collection(this.firestore, `users/${user.uid}/sessions`);
    const q = query(
      sessionsRef,
      where('startTime', '>=', Timestamp.fromDate(startDate)),
      where('startTime', '<=', Timestamp.fromDate(endDate)),
      orderBy('startTime', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()['startTime']?.toDate() || new Date()
    } as PomodoroSession));
  }

  // Helper: Boş daily stats
  private getEmptyDailyStats(): DailyStats {
    return {
      userId: '',
      date: this.getTodayDateString(),
      completedSessions: 0,
      totalFocusTime: 0,
      streak: 0,
      updatedAt: new Date()
    };
  }

  // Helper: Bugünün tarih string'i (YYYY-MM-DD)
  private getTodayDateString(): string {
    return this.formatDate(new Date());
  }

  // Helper: Tarih formatlama (YYYY-MM-DD)
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper: Ay formatlama (YYYY-MM)
  private formatMonth(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Helper: Bu haftanın başlangıç ve bitiş tarihleri
  private getWeekRange(): { startDate: Date; endDate: Date } {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday başlangıcı için

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - diff);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  // Helper: Bu ayın başlangıç ve bitiş tarihleri
  private getMonthRange(): { startDate: Date; endDate: Date } {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }
}
