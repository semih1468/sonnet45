// T124: Settings Component - Ayarlar sayfası
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { Settings } from '../../core/models/settings.model';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  standalone: true
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private fb = inject(FormBuilder);

  // Math for template usage
  Math = Math;

  isLoading = false;
  isSaving = false;
  showSuccessMessage = false;

  // T128-T130: Settings Form
  settingsForm: FormGroup = this.fb.group({
    workDuration: [25, [Validators.required, Validators.min(5), Validators.max(60)]],
    shortBreakDuration: [5, [Validators.required, Validators.min(1), Validators.max(15)]],
    longBreakDuration: [15, [Validators.required, Validators.min(5), Validators.max(30)]],
    longBreakInterval: [4, [Validators.required, Validators.min(2), Validators.max(10)]],
    autoStartBreaks: [false],
    autoStartPomodoros: [false],
    notificationsEnabled: [true],
    soundEnabled: [true],
    soundVolume: [50, [Validators.min(0), Validators.max(100)]],
    darkMode: [false],
    dailyGoal: [8, [Validators.required, Validators.min(1), Validators.max(20)]]
  });

  async ngOnInit() {
    await this.loadSettings();
  }

  // T132: Load user settings
  async loadSettings() {
    this.isLoading = true;
    try {
      const settings = this.settingsService.getCurrentSettings();
      this.settingsForm.patchValue({
        workDuration: settings.workDuration,
        shortBreakDuration: settings.shortBreakDuration,
        longBreakDuration: settings.longBreakDuration,
        longBreakInterval: settings.longBreakInterval,
        autoStartBreaks: settings.autoStartBreaks,
        autoStartPomodoros: settings.autoStartPomodoros,
        notificationsEnabled: settings.notificationsEnabled,
        soundEnabled: settings.soundEnabled,
        soundVolume: settings.soundVolume,
        darkMode: settings.darkMode,
        dailyGoal: settings.dailyGoal
      });

      // T138: Apply dark mode
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // T133-T135: Save settings
  async onSubmit() {
    if (this.settingsForm.invalid) return;

    this.isSaving = true;
    this.showSuccessMessage = false;

    try {
      const formValue = this.settingsForm.value;
      const settings: Partial<Settings> = {
        workDuration: formValue.workDuration,
        shortBreakDuration: formValue.shortBreakDuration,
        longBreakDuration: formValue.longBreakDuration,
        longBreakInterval: formValue.longBreakInterval,
        autoStartBreaks: formValue.autoStartBreaks,
        autoStartPomodoros: formValue.autoStartPomodoros,
        notificationsEnabled: formValue.notificationsEnabled,
        soundEnabled: formValue.soundEnabled,
        soundVolume: formValue.soundVolume,
        darkMode: formValue.darkMode,
        dailyGoal: formValue.dailyGoal
      };

      await this.settingsService.saveSettings(settings);

      // T138: Apply dark mode immediately
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      this.showSuccessMessage = true;
      setTimeout(() => this.showSuccessMessage = false, 3000);
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
    } finally {
      this.isSaving = false;
    }
  }

  async resetToDefaults() {
    if (!confirm('Tüm ayarları varsayılan değerlere sıfırlamak istediğinize emin misiniz?')) return;

    this.settingsForm.patchValue({
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      notificationsEnabled: true,
      soundEnabled: true,
      soundVolume: 50,
      darkMode: false,
      dailyGoal: 8
    });

    await this.onSubmit();
  }

  toggleDarkMode() {
    const currentValue = this.settingsForm.get('darkMode')?.value;
    this.settingsForm.patchValue({ darkMode: !currentValue });
  }

  decrementDailyGoal() {
    const currentValue = this.settingsForm.get('dailyGoal')?.value || 1;
    this.settingsForm.patchValue({ dailyGoal: Math.max(1, currentValue - 1) });
  }

  incrementDailyGoal() {
    const currentValue = this.settingsForm.get('dailyGoal')?.value || 1;
    this.settingsForm.patchValue({ dailyGoal: Math.min(20, currentValue + 1) });
  }
}
