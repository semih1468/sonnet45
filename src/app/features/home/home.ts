// T055: Home Component - Ana pomodoro zamanlayıcı sayfası
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TimerService } from '../../core/services/timer.service';
import { SessionService } from '../../core/services/session.service';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { TimerState } from '../../core/models/timer.model';
import { Settings } from '../../core/models/settings.model';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, DurationPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  standalone: true
})
export class HomeComponent implements OnInit, OnDestroy {
  private timerService = inject(TimerService);
  private sessionService = inject(SessionService);
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  timerState: TimerState | null = null;
  settings: Settings | null = null;
  dailyGoal = 8; // Default daily goal

  private timerSubscription?: Subscription;
  private settingsSubscription?: Subscription;

  ngOnInit() {
    // Timer state'i dinle
    this.timerSubscription = this.timerService.timerState$.subscribe(state => {
      this.timerState = state;
    });

    // Settings'i dinle
    this.settingsSubscription = this.settingsService.settings$.subscribe(settings => {
      this.settings = settings;
      if (settings) {
        this.dailyGoal = settings.dailyGoal || 8;
      }
    });
  }

  ngOnDestroy() {
    this.timerSubscription?.unsubscribe();
    this.settingsSubscription?.unsubscribe();
  }

  // T056: Timer kontrol metodları
  async onStart() {
    if (!this.timerState) return;

    // Eğer yeni bir session başlatıyorsak
    if (!this.timerState.currentSession && this.timerState.mode === 'work') {
      const sessionId = await this.sessionService.createSession();
      this.timerService.setCurrentSession(sessionId);
    }

    this.timerService.start();
  }

  onPause() {
    this.timerService.pause();
  }

  onResume() {
    this.timerService.resume();
  }

  onReset() {
    // Session'ı iptal et
    if (this.timerState?.currentSession) {
      this.sessionService.cancelSession(this.timerState.currentSession);
      this.timerService.setCurrentSession(null);
    }

    this.timerService.reset();
  }

  onSkip() {
    // Session'ı tamamla
    if (this.timerState?.currentSession && this.timerState.mode === 'work') {
      const elapsed = this.getElapsedTime();
      this.sessionService.completeSession(this.timerState.currentSession, elapsed);
      this.timerService.setCurrentSession(null);
    }

    this.timerService.skip();
  }

  // Geçen süreyi hesapla
  private getElapsedTime(): number {
    if (!this.timerState || !this.settings) return 0;

    const totalTime = this.timerState.mode === 'work'
      ? this.settings.workDuration * 60
      : this.timerState.mode === 'shortBreak'
        ? this.settings.shortBreakDuration * 60
        : this.settings.longBreakDuration * 60;

    return totalTime - this.timerState.remainingTime;
  }

  // Mod başlığını getir
  getModeTitle(): string {
    if (!this.timerState) return '';

    switch (this.timerState.mode) {
      case 'work':
        return 'FOCUS';
      case 'shortBreak':
        return 'SHORT BREAK';
      case 'longBreak':
        return 'LONG BREAK';
      default:
        return '';
    }
  }

  // Format time for display
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Get progress offset for circle
  getProgressOffset(): number {
    if (!this.timerState || !this.settings) return 282.74;

    let totalTime = 0;
    if (this.timerState.mode === 'work') {
      totalTime = this.settings.workDuration * 60;
    } else if (this.timerState.mode === 'shortBreak') {
      totalTime = this.settings.shortBreakDuration * 60;
    } else {
      totalTime = this.settings.longBreakDuration * 60;
    }

    const progress = ((totalTime - this.timerState.remainingTime) / totalTime) * 100;
    return 282.74 - (282.74 * progress / 100);
  }

  // Daily progress percentage
  getDailyProgress(): number {
    if (!this.timerState) return 0;
    const progress = (this.timerState.completedPomodoros / this.dailyGoal) * 100;
    return Math.min(100, progress);
  }

  // Next break calculation
  getNextBreakIn(): number {
    if (!this.timerState || !this.settings) return 0;
    const sessionsUntilLongBreak = this.settings.longBreakInterval || 4;
    const currentSession = this.timerState.completedPomodoros % sessionsUntilLongBreak;
    return sessionsUntilLongBreak - currentSession;
  }

  // Mod CSS class'ını getir
  getModeClass(): string {
    if (!this.timerState) return '';

    switch (this.timerState.mode) {
      case 'work':
        return 'mode-work';
      case 'shortBreak':
        return 'mode-short-break';
      case 'longBreak':
        return 'mode-long-break';
      default:
        return '';
    }
  }

  // Buton metnini getir
  getButtonText(): string {
    if (!this.timerState) return '';

    if (this.timerState.isRunning) {
      return 'Duraklat';
    } else if (this.timerState.isPaused) {
      return 'Devam Et';
    } else {
      return 'Başlat';
    }
  }

  // Buton aksiyonunu getir
  onButtonClick() {
    if (!this.timerState) return;

    if (this.timerState.isRunning) {
      this.onPause();
    } else if (this.timerState.isPaused) {
      this.onResume();
    } else {
      this.onStart();
    }
  }

  // Logout
  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
