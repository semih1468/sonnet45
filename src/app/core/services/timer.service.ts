// T046: Timer Service - Pomodoro zamanlayıcı mantığı
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { TimerState, TimerMode } from '../models/timer.model';
import { SettingsService } from './settings.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private settingsService = inject(SettingsService);
  private notificationService = inject(NotificationService);

  // T047: Timer state management
  private timerStateSubject = new BehaviorSubject<TimerState>({
    remainingTime: 25 * 60, // 25 dakika (saniye cinsinden)
    isRunning: false,
    isPaused: false,
    mode: 'work',
    completedPomodoros: 0,
    currentSession: null
  });

  public timerState$: Observable<TimerState> = this.timerStateSubject.asObservable();

  private timerSubscription?: Subscription;
  private audioContext?: AudioContext;

  constructor() {
    // İlk ayarları yükle
    this.loadSettings();
  }

  private loadSettings() {
    this.settingsService.settings$.pipe(take(1)).subscribe(settings => {
      const state = this.timerStateSubject.value;
      if (!state.isRunning && !state.isPaused) {
        // Sadece timer çalışmıyorsa ayarları uygula
        this.timerStateSubject.next({
          ...state,
          remainingTime: settings.workDuration * 60
        });
      }
    });
  }

  // T048: Timer kontrolü - Start
  start() {
    const state = this.timerStateSubject.value;

    if (state.isRunning) {
      return; // Zaten çalışıyor
    }

    this.timerStateSubject.next({
      ...state,
      isRunning: true,
      isPaused: false
    });

    // Her saniye güncelleme
    this.timerSubscription = interval(1000)
      .pipe(
        tap(() => {
          const currentState = this.timerStateSubject.value;
          const newTime = currentState.remainingTime - 1;

          if (newTime <= 0) {
            this.onTimerComplete();
          } else {
            this.timerStateSubject.next({
              ...currentState,
              remainingTime: newTime
            });
          }
        })
      )
      .subscribe();
  }

  // T048: Timer kontrolü - Pause
  pause() {
    const state = this.timerStateSubject.value;

    if (!state.isRunning) {
      return;
    }

    this.timerSubscription?.unsubscribe();

    this.timerStateSubject.next({
      ...state,
      isRunning: false,
      isPaused: true
    });
  }

  // T048: Timer kontrolü - Resume
  resume() {
    const state = this.timerStateSubject.value;

    if (!state.isPaused) {
      return;
    }

    this.start();
  }

  // T048: Timer kontrolü - Reset
  reset() {
    this.timerSubscription?.unsubscribe();

    this.settingsService.settings$.pipe(take(1)).subscribe(settings => {
      const state = this.timerStateSubject.value;
      const duration = state.mode === 'work'
        ? settings.workDuration
        : state.mode === 'shortBreak'
          ? settings.shortBreakDuration
          : settings.longBreakDuration;

      this.timerStateSubject.next({
        ...state,
        remainingTime: duration * 60,
        isRunning: false,
        isPaused: false
      });
    });
  }

  // T048: Timer kontrolü - Skip
  skip() {
    this.onTimerComplete();
  }

  private onTimerComplete() {
    this.timerSubscription?.unsubscribe();

    const state = this.timerStateSubject.value;

    // Ses çal
    this.playSound();

    // T061: Bildirim gönder
    this.sendCompletionNotification(state.mode);

    // Bir sonraki moda geç
    this.settingsService.settings$.pipe(take(1)).subscribe(settings => {
      let newMode: TimerMode;
      let newCompletedPomodoros = state.completedPomodoros;

      if (state.mode === 'work') {
        newCompletedPomodoros++;

        // Long break kontrolü
        if (newCompletedPomodoros % settings.longBreakInterval === 0) {
          newMode = 'longBreak';
        } else {
          newMode = 'shortBreak';
        }
      } else {
        newMode = 'work';
      }

      const duration = newMode === 'work'
        ? settings.workDuration
        : newMode === 'shortBreak'
          ? settings.shortBreakDuration
          : settings.longBreakDuration;

      this.timerStateSubject.next({
        ...state,
        mode: newMode,
        remainingTime: duration * 60,
        isRunning: false,
        isPaused: false,
        completedPomodoros: newCompletedPomodoros
      });

      // Auto-start molayı
      if (settings.autoStartBreaks && newMode !== 'work') {
        this.start();
      }

      // Auto-start pomodoro
      if (settings.autoStartPomodoros && newMode === 'work') {
        this.start();
      }
    });
  }

  // Ses çalma
  private playSound() {
    this.settingsService.settings$.pipe(take(1)).subscribe(settings => {
      if (!settings.soundEnabled) {
        return;
      }

      // Basit bir beep sesi oluştur
      try {
        if (!this.audioContext) {
          this.audioContext = new AudioContext();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(settings.soundVolume / 100, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
      } catch (error) {
        console.warn('Ses çalınamadı:', error);
      }
    });
  }

  // T061: Tamamlanma bildirimi gönder
  private sendCompletionNotification(mode: TimerMode) {
    if (mode === 'work') {
      this.notificationService.notifyPomodoroComplete();
    } else if (mode === 'longBreak') {
      this.notificationService.notifyLongBreakComplete();
    } else {
      this.notificationService.notifyBreakComplete();
    }
  }

  // Mevcut state'i al
  getCurrentState(): TimerState {
    return this.timerStateSubject.value;
  }

  // Session ID'sini ayarla
  setCurrentSession(sessionId: string | null) {
    const state = this.timerStateSubject.value;
    this.timerStateSubject.next({
      ...state,
      currentSession: sessionId
    });
  }

  // Cleanup
  ngOnDestroy() {
    this.timerSubscription?.unsubscribe();
    this.audioContext?.close();
  }
}
