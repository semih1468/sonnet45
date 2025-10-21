import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { StatisticsService } from '../../core/services/statistics.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  standalone: true
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private statisticsService = inject(StatisticsService);
  private router = inject(Router);

  user: any = null;
  totalPomodoros = 0;
  totalFocusHours = 0;
  currentStreak = 0;
  profileImage = '';

  async ngOnInit() {
    // Get current user
    this.user = this.authService.getCurrentUser();

    // Load statistics
    await this.loadStatistics();

    // Set profile image (default avatar if not set)
    this.profileImage = this.user?.photoURL || this.getDefaultAvatar();
  }

  async loadStatistics() {
    try {
      // Get all-time statistics
      const allTimeStats = await this.statisticsService.getAllTimeStats();
      this.totalPomodoros = allTimeStats?.completedSessions || 0;
      this.totalFocusHours = Math.floor((allTimeStats?.totalWorkTime || 0) / 3600);

      // Get current streak
      const streak = await this.statisticsService.getCurrentStreak();
      this.currentStreak = streak;
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  getDefaultAvatar(): string {
    // Return a default avatar with user initial
    const initial = this.user?.displayName?.charAt(0)?.toUpperCase() || 'U';
    return `https://ui-avatars.com/api/?name=${initial}&background=FF4B4B&color=fff&size=128`;
  }

  getUserDisplayName(): string {
    return this.user?.displayName || this.user?.email?.split('@')[0] || 'User';
  }

  navigateToSettings() {
    this.router.navigate(['/settings']);
  }

  navigateToEditProfile() {
    // For now, redirect to settings
    this.router.navigate(['/settings']);
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}