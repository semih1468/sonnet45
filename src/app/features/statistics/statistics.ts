// T142-T148: Statistics Component - İstatistikler sayfası
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatisticsService } from '../../core/services/statistics.service';
import { DailyStats, WeeklyStats, MonthlyStats } from '../../core/models/statistics.model';

@Component({
  selector: 'app-statistics',
  imports: [CommonModule, RouterLink],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
  standalone: true
})
export class StatisticsComponent implements OnInit {
  private statisticsService = inject(StatisticsService);

  isLoading = true;
  todayStats: DailyStats | null = null;
  weeklyStats: WeeklyStats | null = null;
  monthlyStats: MonthlyStats | null = null;
  todayProgress = 0;
  nextBreakIn = 0;

  async ngOnInit() {
    await this.loadStatistics();
  }

  async loadStatistics() {
    this.isLoading = true;

    try {
      // Paralel yükleme
      const [today, weekly, monthly, progress, breakIn] = await Promise.all([
        this.statisticsService.getTodayStats(),
        this.statisticsService.getWeeklyStats(),
        this.statisticsService.getMonthlyStats(),
        this.statisticsService.getTodayProgress(),
        this.statisticsService.getNextBreakIn()
      ]);

      this.todayStats = today;
      this.weeklyStats = weekly;
      this.monthlyStats = monthly;
      this.todayProgress = progress;
      this.nextBreakIn = breakIn;
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Süreyi saat:dakika formatında göster
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}s ${minutes}dk`;
    }
    return `${minutes}dk`;
  }

  // Gün isimlerini getir
  getDayName(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    return days[date.getDay()];
  }

  // Haftalık chart için maksimum değeri bul
  getMaxWeeklyValue(): number {
    if (!this.weeklyStats) return 0;
    return Math.max(...this.weeklyStats.dailyBreakdown.map(d => d.completedSessions), 1);
  }

  // Chart bar height hesapla (percentage)
  getBarHeight(sessions: number): number {
    const max = this.getMaxWeeklyValue();
    return max > 0 ? (sessions / max) * 100 : 0;
  }

  // Bugün mü kontrol et
  isToday(dateStr: string): boolean {
    const today = new Date();
    const date = new Date(dateStr);
    return today.toDateString() === date.toDateString();
  }
}
