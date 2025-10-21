// T027: Ana App Component
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsService } from './core/services/settings.service';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true
})
export class AppComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private languageService = inject(LanguageService);
  title = 'Pomodoro Timer';

  async ngOnInit() {
    // Initialize language first (before other initialization)
    await this.languageService.initializeLanguage();

    // Dark mode'u dinle ve uygula
    this.settingsService.settings$.subscribe(settings => {
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }
}
