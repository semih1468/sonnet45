// T059: Browser Notification Service
import { Injectable, inject } from '@angular/core';
import { SettingsService } from './settings.service';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private settingsService = inject(SettingsService);
  private permission: NotificationPermission = 'default';

  constructor() {
    // Mevcut izin durumunu kontrol et
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  // T060: Notification izni iste
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Bu tarayıcı bildirimleri desteklemiyor');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    } catch (error) {
      console.error('Bildirim izni alınamadı:', error);
      return false;
    }
  }

  // T061: Bildirim gönder
  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    // Ayarları kontrol et
    const settings = await this.settingsService.settings$.pipe(take(1)).toPromise();

    if (!settings?.notificationsEnabled) {
      return;
    }

    // İzin kontrolü
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return;
      }
    }

    try {
      const notification = new Notification(title, {
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        ...options
      });

      // Bildirime tıklandığında pencereyi odakla
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 5 saniye sonra otomatik kapat
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Bildirim gönderilemedi:', error);
    }
  }

  // Pomodoro tamamlandığında bildirim
  async notifyPomodoroComplete(): Promise<void> {
    await this.sendNotification('Pomodoro Tamamlandı! 🎉', {
      body: 'Harika iş! Şimdi mola zamanı.',
      tag: 'pomodoro-complete',
      requireInteraction: false
    });
  }

  // Mola tamamlandığında bildirim
  async notifyBreakComplete(): Promise<void> {
    await this.sendNotification('Mola Bitti! ⏰', {
      body: 'Yeni bir pomodoro başlatmaya hazır mısın?',
      tag: 'break-complete',
      requireInteraction: false
    });
  }

  // Long break tamamlandığında bildirim
  async notifyLongBreakComplete(): Promise<void> {
    await this.sendNotification('Uzun Mola Bitti! 🚀', {
      body: 'Harika bir dinlenme! Şimdi tekrar işe koyulalım.',
      tag: 'long-break-complete',
      requireInteraction: false
    });
  }

  // İzin durumunu kontrol et
  hasPermission(): boolean {
    return this.permission === 'granted';
  }

  // Bildirim desteği var mı?
  isSupported(): boolean {
    return 'Notification' in window;
  }
}
