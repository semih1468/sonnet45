// T142-T148: Statistics Component - İstatistikler sayfası
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { StatisticsService } from '../../core/services/statistics.service';
import { DailyStats, WeeklyStats, MonthlyStats } from '../../core/models/statistics.model';

@Component({
  selector: 'app-statistics',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
  standalone: true
})
export class StatisticsComponent implements OnInit {
  private statisticsService = inject(StatisticsService);
  private translateService = inject(TranslateService);

  isLoading = true;
  todayStats: DailyStats | null = null;
  weeklyStats: WeeklyStats | null = null;
  monthlyStats: MonthlyStats | null = null;
  todayProgress = 0;
  nextBreakIn = 0;
  timeRange: 'weekly' | 'monthly' = 'weekly';

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

    const hourShort = this.translateService.instant('common.hourShort');
    const minuteShort = this.translateService.instant('common.minuteShort');

    if (hours > 0) {
      return `${hours}${hourShort} ${minutes}${minuteShort}`;
    }
    return `${minutes}${minuteShort}`;
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

  // Time range değiştirme
  setTimeRange(range: 'weekly' | 'monthly') {
    this.timeRange = range;
  }

  // Chart verilerini getir
  getChartData() {
    if (this.timeRange === 'weekly') {
      return this.weeklyStats?.dailyBreakdown || [];
    }
    // Monthly için haftalık breakdown döndür (şimdilik weekly ile aynı)
    return this.weeklyStats?.dailyBreakdown || [];
  }

  // Tarih aralığı metni
  getDateRangeText(): string {
    const now = new Date();
    if (this.timeRange === 'weekly') {
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(now.setDate(weekStart.getDate() + 6));
      return `${this.formatDate(weekStart)} - ${this.formatDate(weekEnd)}`;
    } else {
      const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                         'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      return monthNames[now.getMonth()] + ' ' + now.getFullYear();
    }
  }

  // İlerleme yüzdesi - bar height için
  getProgressPercentage(sessions: number): number {
    const max = this.getMaxWeeklyValue();
    return max > 0 ? (sessions / max) * 100 : 0;
  }

  // Gün kısaltması
  getDayAbbr(dateStr: string): string {
    const days = ['P', 'Pt', 'S', 'Ç', 'P', 'C', 'Ct'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  }

  // Tarih formatlama
  private formatDate(date: Date): string {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
                   'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }
}
