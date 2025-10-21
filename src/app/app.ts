// T027: Ana App Component
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true
})
export class AppComponent implements OnInit {
  private settingsService = inject(SettingsService);
  title = 'Pomodoro Timer';

  ngOnInit() {
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
