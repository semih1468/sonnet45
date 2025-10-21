// T049: Settings Service - Kullanıcı ayarlarını yönetme
import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, onSnapshot } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Settings } from '../models/settings.model';
import { SupportedLanguageCode } from '../models/language.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  // T050: Default ayarlar
  private defaultSettings: Settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
    soundVolume: 50,
    notificationsEnabled: true,
    darkMode: false,
    dailyGoal: 8
  };

  private settingsSubject = new BehaviorSubject<Settings>(this.defaultSettings);
  public settings$: Observable<Settings> = this.settingsSubject.asObservable();

  private unsubscribeSnapshot?: () => void;

  constructor() {
    // Kullanıcı değişikliklerini dinle
    this.authService.user$.subscribe(user => {
      if (user) {
        this.loadUserSettings(user.uid);
      } else {
        // Kullanıcı çıkış yaptı, default ayarlara dön
        this.unsubscribeSnapshot?.();
        this.settingsSubject.next(this.defaultSettings);
      }
    });
  }

  // T051: Firestore'dan ayarları yükle
  private loadUserSettings(userId: string) {
    const settingsRef = doc(this.firestore, `users/${userId}/settings/preferences`);

    // Real-time listener
    this.unsubscribeSnapshot = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Settings;
          this.settingsSubject.next(data);
        } else {
          // İlk kez, default ayarları kaydet
          this.saveSettings(this.defaultSettings);
        }
      },
      (error) => {
        console.error('Ayarlar yüklenirken hata:', error);
        this.settingsSubject.next(this.defaultSettings);
      }
    );
  }

  // T051: Ayarları Firestore'a kaydet
  async saveSettings(settings: Partial<Settings>): Promise<void> {
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }

    const settingsRef = doc(this.firestore, `users/${user.uid}/settings/preferences`);
    const currentSettings = this.settingsSubject.value;
    const updatedSettings = { ...currentSettings, ...settings };

    await setDoc(settingsRef, updatedSettings);
    this.settingsSubject.next(updatedSettings);
  }

  // Ayarları sıfırla
  async resetToDefaults(): Promise<void> {
    await this.saveSettings(this.defaultSettings);
  }

  // Mevcut ayarları al
  getCurrentSettings(): Settings {
    return this.settingsSubject.value;
  }

  /**
   * Get user settings (async version for APP_INITIALIZER)
   * Returns promise with current settings or null if not logged in
   */
  async getSettings(): Promise<Settings | null> {
    const user = await this.authService.getCurrentUser();

    if (!user) {
      return null;
    }

    const settingsRef = doc(this.firestore, `users/${user.uid}/settings/preferences`);
    const snapshot = await getDoc(settingsRef);

    if (snapshot.exists()) {
      return snapshot.data() as Settings;
    }

    return null;
  }

  /**
   * Update user's language preference
   * @param languageCode - The language code to set (tr or en)
   */
  async updateLanguage(languageCode: SupportedLanguageCode): Promise<void> {
    await this.saveSettings({ language: languageCode });
  }

  // Cleanup
  ngOnDestroy() {
    this.unsubscribeSnapshot?.();
  }
}
