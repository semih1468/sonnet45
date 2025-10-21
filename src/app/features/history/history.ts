// T072: History Component - Pomodoro geçmişi sayfası
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../core/services/session.service';
import { Session } from '../../core/models/session.model';

@Component({
  selector: 'app-history',
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.scss',
  standalone: true
})
export class HistoryComponent implements OnInit {
  private sessionService = inject(SessionService);

  sessions: Session[] = [];
  isLoading = true;
  selectedDate: string = new Date().toISOString().split('T')[0];
  viewMode: 'today' | 'week' | 'month' | 'all' = 'today';

  async ngOnInit() {
    await this.loadSessions();
  }

  async loadSessions() {
    this.isLoading = true;

    try {
      switch (this.viewMode) {
        case 'today':
          this.sessions = await this.sessionService.getTodaySessions();
          break;
        case 'week':
          this.sessions = await this.sessionService.getRecentSessions(50);
          break;
        case 'month':
          this.sessions = await this.sessionService.getRecentSessions(200);
          break;
        case 'all':
          this.sessions = await this.sessionService.getRecentSessions(500);
          break;
      }
    } catch (error) {
      console.error('Oturumlar yüklenirken hata:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async changeViewMode(mode: 'today' | 'week' | 'month' | 'all') {
    this.viewMode = mode;
    await this.loadSessions();
  }

  // Session duration'ı dakika olarak getir
  getSessionDuration(session: Session): number {
    return Math.floor(session.duration / 60);
  }

  // Session tarihini formatla
  getSessionDate(session: Session): string {
    if (!session.startTime) return '';

    const date = session.startTime.toDate ? session.startTime.toDate() : new Date(session.startTime);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Toplam tamamlanan pomodoro sayısı
  getTotalCompletedSessions(): number {
    return this.sessions.filter(s => s.status === 'completed').length;
  }

  // Toplam çalışma süresi (dakika)
  getTotalWorkTime(): number {
    return this.sessions
      .filter(s => s.status === 'completed')
      .reduce((total, s) => total + s.duration, 0) / 60;
  }

  // Session status badge class
  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Session status text
  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'active':
        return 'Aktif';
      case 'cancelled':
        return 'İptal';
      default:
        return status;
    }
  }
}
