# Veri Modeli: Çoklu Dil Desteği (i18n)

**Özellik**: 002-i18n-language-support
**Tarih**: 2025-10-21
**Amaç**: i18n özelliği için tüm veri yapılarını, interface'leri ve Firestore şemalarını tanımlamak

## Genel Bakış

Bu döküman i18n feature'ı için gerekli tüm veri modellerini, TypeScript interface'lerini ve Firestore document şemalarını içerir. Constitution Principle II (TypeScript Strict Mode & Type Safety) uyarınca tüm tipler `any` kullanmadan tanımlanmıştır.

---

## 1. Language Entity

Sistem tarafından desteklenen dilleri temsil eden model.

### TypeScript Interface

```typescript
// src/app/core/models/language.model.ts [CREATE]

/**
 * Sistem tarafından desteklenen dil
 */
export interface Language {
  /**
   * Dil kodu (ISO 639-1)
   * Sadece 'tr' ve 'en' destekleniyor
   */
  code: 'tr' | 'en';

  /**
   * Dil adı (native formda)
   * Örnek: "Türkçe", "English"
   */
  name: string;

  /**
   * Varsayılan dil olup olmadığı
   * Sadece bir dil true olabilir
   */
  isDefault: boolean;

  /**
   * Angular LOCALE_ID için locale string
   * Örnek: "tr-TR", "en-US"
   */
  locale: string;
}

/**
 * Desteklenen dil listesi (constant)
 */
export const SUPPORTED_LANGUAGES: readonly Language[] = [
  {
    code: 'tr',
    name: 'Türkçe',
    isDefault: true,
    locale: 'tr-TR'
  },
  {
    code: 'en',
    name: 'English',
    isDefault: false,
    locale: 'en-US'
  }
] as const;

/**
 * Desteklenen dil kodları union type
 */
export type SupportedLanguageCode = 'tr' | 'en';
```

### Kullanım Senaryoları

1. **Dil Seçici UI**: Settings component'te dropdown options olarak kullanılır
2. **Varsayılan Dil Belirleme**: `isDefault: true` olan dil uygulama başlangıcında yüklenir
3. **Locale Mapping**: Dil değiştiğinde Angular DatePipe/DecimalPipe için locale belirlenir

### Validasyon Kuralları

- `code`: Sadece 'tr' veya 'en' olabilir (compile-time type check)
- `name`: Boş olamaz (UI'da görüntülenecek)
- `isDefault`: Sadece bir dil için true (programmatik olarak garanti edilir)
- `locale`: Angular LOCALE_ID formatına uygun olmalı (xx-XX)

---

## 2. Settings Model Extension

Mevcut Settings interface'ine `language` field'ı eklenir.

### TypeScript Interface (Modified)

```typescript
// src/app/core/models/settings.model.ts [MODIFY]

import { Timestamp } from '@angular/fire/firestore';
import type { SupportedLanguageCode } from './language.model';

export interface Settings {
  workDuration: number;              // dakika cinsinden, default: 25
  shortBreakDuration: number;        // dakika cinsinden, default: 5
  longBreakDuration: number;         // dakika cinsinden, default: 15
  longBreakInterval: number;         // kaç pomodoro sonra long break, default: 4
  autoStartBreaks: boolean;          // default: false
  autoStartPomodoros: boolean;       // default: false
  soundEnabled: boolean;             // default: true
  soundVolume: number;               // 0-100, default: 50
  notificationsEnabled: boolean;     // default: true
  darkMode: boolean;                 // default: false
  dailyGoal: number;                 // günlük hedef pomodoro sayısı, default: 8

  /**
   * Kullanıcının tercih ettiği dil
   * [YENİ FIELD - i18n feature]
   * @default 'tr'
   */
  language?: SupportedLanguageCode;  // Optional: Backward compatibility için
}

/**
 * Backward compatibility (kullanımda kaldıysa)
 */
export interface UserSettings {
  userId: string;
  focusDuration: number;             // in seconds, default: 1500 (25 min)
  breakDuration: number;             // in seconds, default: 300 (5 min)
  soundEnabled: boolean;
  darkModeEnabled: boolean;
  autoStartEnabled: boolean;
  updatedAt: Date;

  /**
   * Kullanıcının tercih ettiği dil
   * [YENİ FIELD - i18n feature]
   */
  language?: SupportedLanguageCode;
}

export interface UpdateSettingsDto {
  focusDuration?: number;
  breakDuration?: number;
  soundEnabled?: boolean;
  darkModeEnabled?: boolean;
  autoStartEnabled?: boolean;

  /**
   * Dil değişikliği DTO
   * [YENİ FIELD - i18n feature]
   */
  language?: SupportedLanguageCode;
}

export const DEFAULT_SETTINGS: Omit<UserSettings, 'userId' | 'updatedAt'> = {
  focusDuration: 1500,               // 25 minutes
  breakDuration: 300,                // 5 minutes
  soundEnabled: true,
  darkModeEnabled: false,
  autoStartEnabled: false,
  language: 'tr'                     // [YENİ] Varsayılan dil: Türkçe
};
```

### Firestore Document Schema

```typescript
/**
 * Firestore path: users/{userId}/settings/preferences
 * Collection: settings
 * Document ID: preferences (fixed)
 */
interface SettingsDocument {
  userId: string;                    // User ID (security rules için)
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  notificationsEnabled: boolean;
  darkMode: boolean;
  dailyGoal: number;
  language: string;                  // 'tr' | 'en'
  updatedAt: Timestamp;              // serverTimestamp()
  createdAt?: Timestamp;             // İlk kayıtta set edilir
}
```

### Firestore Security Rules (No Change Needed)

```javascript
// firestore.rules (mevcut rules korunuyor)
match /users/{userId}/settings/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**Rationale**: Settings zaten user-scoped, `language` field'ı için yeni rule gerekmez.

### Migration Strategy

**Mevcut Users için Backward Compatibility**:
1. `language` field'ı optional (`?:`) tanımlandı
2. Firestore'da mevcut settings document'larında `language` yoksa:
   - LanguageService.initializeLanguage() tarayıcı dilini algılar
   - İlk dil değişikliğinde Firestore'a yazılır
   - Sonraki açılışlarda Firestore'dan okunur

**Kod Örneği**:
```typescript
// SettingsService.getSettings()
async getSettings(): Promise<Settings> {
  const user = this.authService.getCurrentUser();
  if (!user) return DEFAULT_SETTINGS;

  const settingsRef = doc(this.firestore, `users/${user.uid}/settings/preferences`);
  const settingsDoc = await getDoc(settingsRef);

  if (!settingsDoc.exists()) {
    return DEFAULT_SETTINGS;
  }

  const data = settingsDoc.data() as Settings;

  // Backward compatibility: language yoksa varsayılan 'tr'
  return {
    ...data,
    language: data.language || 'tr'
  };
}
```

---

## 3. Translation File Structure

Çeviri dosyalarının JSON yapısı.

### TypeScript Interface

```typescript
// src/app/core/models/translation.model.ts [CREATE]

/**
 * Çeviri dosyası yapısı (assets/i18n/*.json)
 * Flat key-value structure
 */
export interface TranslationFile {
  [key: string]: string;
}

/**
 * Çeviri anahtarı kategori prefix'leri
 */
export enum TranslationKeyPrefix {
  COMMON = 'common',
  AUTH = 'auth',
  HOME = 'home',
  TASKS = 'tasks',
  SETTINGS = 'settings',
  STATISTICS = 'statistics',
  HISTORY = 'history',
  ERRORS = 'errors'
}

/**
 * Çeviri anahtarı validator
 * Format: {prefix}.{context}.{element}
 * Örnek: "auth.login.submit"
 */
export function isValidTranslationKey(key: string): boolean {
  const parts = key.split('.');
  if (parts.length < 2) return false;

  const prefix = parts[0];
  return Object.values(TranslationKeyPrefix).includes(prefix as TranslationKeyPrefix);
}
```

### JSON Schema (assets/i18n/tr.json)

```json
{
  // Common - Ortak çeviriler
  "common.cancel": "İptal",
  "common.save": "Kaydet",
  "common.delete": "Sil",
  "common.confirm": "Onayla",
  "common.close": "Kapat",
  "common.edit": "Düzenle",
  "common.add": "Ekle",
  "common.remove": "Kaldır",
  "common.loading": "Yükleniyor...",
  "common.error": "Hata",
  "common.success": "Başarılı",

  // Auth - Kimlik doğrulama
  "auth.login.title": "Giriş Yap",
  "auth.login.email": "E-posta",
  "auth.login.password": "Şifre",
  "auth.login.submit": "Giriş",
  "auth.login.forgotPassword": "Şifremi Unuttum",
  "auth.register.title": "Kayıt Ol",
  "auth.register.confirmPassword": "Şifre (Tekrar)",
  "auth.logout": "Çıkış Yap",

  // Home - Ana sayfa
  "home.welcome": "Hoş Geldiniz",
  "home.startPomodoro": "Pomodoro Başlat",
  "home.pause": "Duraklat",
  "home.resume": "Devam Et",
  "home.stop": "Durdur",
  "home.skip": "Atla",
  "home.workTime": "Çalışma Zamanı",
  "home.breakTime": "Mola Zamanı",
  "home.selectTask": "Görev Seç",

  // Tasks - Görev yönetimi
  "tasks.title": "Görevler",
  "tasks.addTask": "Görev Ekle",
  "tasks.taskTitle": "Görev Başlığı",
  "tasks.taskDescription": "Görev Açıklaması",
  "tasks.priority.label": "Öncelik",
  "tasks.priority.high": "Yüksek",
  "tasks.priority.medium": "Orta",
  "tasks.priority.low": "Düşük",
  "tasks.estimatedPomodoros": "Tahmini Pomodoro",
  "tasks.completedPomodoros": "Tamamlanan",
  "tasks.dueDate": "Bitiş Tarihi",
  "tasks.status.active": "Aktif",
  "tasks.status.completed": "Tamamlandı",
  "tasks.noTasks": "Henüz görev yok",

  // Settings - Ayarlar
  "settings.title": "Ayarlar",
  "settings.language.label": "Dil",
  "settings.language.turkish": "Türkçe",
  "settings.language.english": "English",
  "settings.darkMode": "Karanlık Mod",
  "settings.workDuration": "Çalışma Süresi (dakika)",
  "settings.shortBreak": "Kısa Mola (dakika)",
  "settings.longBreak": "Uzun Mola (dakika)",
  "settings.longBreakInterval": "Uzun Mola Aralığı",
  "settings.autoStartBreaks": "Molaları Otomatik Başlat",
  "settings.autoStartPomodoros": "Pomodoro'ları Otomatik Başlat",
  "settings.soundEnabled": "Ses Bildirimleri",
  "settings.soundVolume": "Ses Seviyesi",
  "settings.notificationsEnabled": "Push Bildirimleri",
  "settings.dailyGoal": "Günlük Hedef",

  // Statistics - İstatistikler
  "statistics.title": "İstatistikler",
  "statistics.today": "Bugün",
  "statistics.thisWeek": "Bu Hafta",
  "statistics.thisMonth": "Bu Ay",
  "statistics.completedSessions": "Tamamlanan Oturumlar",
  "statistics.totalFocusTime": "Toplam Odaklanma Süresi",
  "statistics.averageSessionDuration": "Ortalama Oturum Süresi",
  "statistics.currentStreak": "Mevcut Seri",
  "statistics.bestStreak": "En İyi Seri",
  "statistics.noData": "Henüz veri yok",

  // History - Geçmiş
  "history.title": "Geçmiş",
  "history.sessionDate": "Tarih",
  "history.sessionDuration": "Süre",
  "history.sessionTask": "Görev",
  "history.noSessions": "Henüz oturum kaydı yok",

  // Errors - Hata mesajları
  "errors.generic": "Bir hata oluştu",
  "errors.network": "Bağlantı hatası",
  "errors.auth.invalid": "Geçersiz kullanıcı adı veya şifre",
  "errors.auth.emailInUse": "Bu e-posta adresi zaten kullanımda",
  "errors.auth.weakPassword": "Şifre çok zayıf",
  "errors.task.titleRequired": "Görev başlığı gerekli",
  "errors.task.notFound": "Görev bulunamadı",
  "errors.settings.saveFailed": "Ayarlar kaydedilemedi"
}
```

### JSON Schema (assets/i18n/en.json)

```json
{
  // Common
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.confirm": "Confirm",
  "common.close": "Close",
  "common.edit": "Edit",
  "common.add": "Add",
  "common.remove": "Remove",
  "common.loading": "Loading...",
  "common.error": "Error",
  "common.success": "Success",

  // Auth
  "auth.login.title": "Login",
  "auth.login.email": "Email",
  "auth.login.password": "Password",
  "auth.login.submit": "Login",
  "auth.login.forgotPassword": "Forgot Password",
  "auth.register.title": "Register",
  "auth.register.confirmPassword": "Confirm Password",
  "auth.logout": "Logout",

  // Home
  "home.welcome": "Welcome",
  "home.startPomodoro": "Start Pomodoro",
  "home.pause": "Pause",
  "home.resume": "Resume",
  "home.stop": "Stop",
  "home.skip": "Skip",
  "home.workTime": "Work Time",
  "home.breakTime": "Break Time",
  "home.selectTask": "Select Task",

  // Tasks
  "tasks.title": "Tasks",
  "tasks.addTask": "Add Task",
  "tasks.taskTitle": "Task Title",
  "tasks.taskDescription": "Task Description",
  "tasks.priority.label": "Priority",
  "tasks.priority.high": "High",
  "tasks.priority.medium": "Medium",
  "tasks.priority.low": "Low",
  "tasks.estimatedPomodoros": "Estimated Pomodoros",
  "tasks.completedPomodoros": "Completed",
  "tasks.dueDate": "Due Date",
  "tasks.status.active": "Active",
  "tasks.status.completed": "Completed",
  "tasks.noTasks": "No tasks yet",

  // Settings
  "settings.title": "Settings",
  "settings.language.label": "Language",
  "settings.language.turkish": "Türkçe",
  "settings.language.english": "English",
  "settings.darkMode": "Dark Mode",
  "settings.workDuration": "Work Duration (minutes)",
  "settings.shortBreak": "Short Break (minutes)",
  "settings.longBreak": "Long Break (minutes)",
  "settings.longBreakInterval": "Long Break Interval",
  "settings.autoStartBreaks": "Auto-start Breaks",
  "settings.autoStartPomodoros": "Auto-start Pomodoros",
  "settings.soundEnabled": "Sound Notifications",
  "settings.soundVolume": "Sound Volume",
  "settings.notificationsEnabled": "Push Notifications",
  "settings.dailyGoal": "Daily Goal",

  // Statistics
  "statistics.title": "Statistics",
  "statistics.today": "Today",
  "statistics.thisWeek": "This Week",
  "statistics.thisMonth": "This Month",
  "statistics.completedSessions": "Completed Sessions",
  "statistics.totalFocusTime": "Total Focus Time",
  "statistics.averageSessionDuration": "Average Session Duration",
  "statistics.currentStreak": "Current Streak",
  "statistics.bestStreak": "Best Streak",
  "statistics.noData": "No data yet",

  // History
  "history.title": "History",
  "history.sessionDate": "Date",
  "history.sessionDuration": "Duration",
  "history.sessionTask": "Task",
  "history.noSessions": "No session history yet",

  // Errors
  "errors.generic": "An error occurred",
  "errors.network": "Network error",
  "errors.auth.invalid": "Invalid email or password",
  "errors.auth.emailInUse": "This email is already in use",
  "errors.auth.weakPassword": "Password is too weak",
  "errors.task.titleRequired": "Task title is required",
  "errors.task.notFound": "Task not found",
  "errors.settings.saveFailed": "Failed to save settings"
}
```

### Validasyon Kuralları

1. **Key Consistency**: Her iki dosyada da aynı key'ler olmalı
2. **Format**: `{prefix}.{context}.{element}` formatına uygun
3. **No Empty Values**: Boş string değer olamaz
4. **No HTML**: Çeviri metinleri düz metin olmalı (XSS önleme)
5. **Placeholder Support**: `{{value}}` formatında parametre desteği (ngx-translate feature)

**Örnek Parametreli Çeviri**:
```json
{
  "tasks.completedCount": "{{count}} görev tamamlandı"
}
```

**Template Kullanımı**:
```html
<p>{{ 'tasks.completedCount' | translate:{ count: completedTasks.length } }}</p>
```

---

## 4. LanguageService State

LanguageService'in tuttuğu internal state modeli.

### TypeScript Interface

```typescript
// src/app/core/services/language.service.ts [CREATE]

import { BehaviorSubject, Observable } from 'rxjs';
import { Language, SupportedLanguageCode } from '../models/language.model';

/**
 * LanguageService internal state
 */
interface LanguageServiceState {
  /**
   * Mevcut aktif dil kodu
   */
  currentLanguage: SupportedLanguageCode;

  /**
   * Dil değişikliği loading durumu
   */
  isChanging: boolean;

  /**
   * Son dil değişikliği hatası (varsa)
   */
  lastError: Error | null;
}

/**
 * LanguageService state'i expose etmek için
 */
export interface LanguageState {
  currentLanguage$: Observable<SupportedLanguageCode>;
  isChanging$: Observable<boolean>;
  lastError$: Observable<Error | null>;
}
```

### State Management Pattern

```typescript
// LanguageService içinde
private stateSubject = new BehaviorSubject<LanguageServiceState>({
  currentLanguage: 'tr',
  isChanging: false,
  lastError: null
});

// Public observables (read-only)
public currentLanguage$ = this.stateSubject.pipe(map(s => s.currentLanguage));
public isChanging$ = this.stateSubject.pipe(map(s => s.isChanging));
public lastError$ = this.stateSubject.pipe(map(s => s.lastError));

// State mutation methods (private)
private setState(partial: Partial<LanguageServiceState>): void {
  this.stateSubject.next({
    ...this.stateSubject.value,
    ...partial
  });
}
```

**Rationale**: Reactive state management, Constitution Principle V uyumlu (Deterministic State).

---

## Entity Relationship Diagram

```
┌─────────────────┐
│   User (Auth)   │
└────────┬────────┘
         │ 1
         │
         │ 1
         ▼
┌─────────────────┐         ┌──────────────────┐
│    Settings     │────────>│    Language      │
│  (Firestore)    │  n:1    │   (Constant)     │
└─────────────────┘         └──────────────────┘
│ language: str   │         │ code: 'tr'|'en'  │
│ darkMode: bool  │         │ name: string     │
│ workDuration: # │         │ locale: string   │
│ ...             │         │ isDefault: bool  │
└─────────────────┘         └──────────────────┘
         │
         │ uses
         ▼
┌─────────────────────────┐
│  TranslationFile (JSON) │
└─────────────────────────┘
│ "key": "value" map      │
│ Flat structure          │
│ ~200-250 keys           │
└─────────────────────────┘
```

---

## Data Flow Diagram

```
1. App Initialization:
   User → AuthService → LanguageService.initializeLanguage()
                             ↓
              Check Settings.language in Firestore
                             ↓
                      Load translation JSON
                             ↓
                     Set TranslateService

2. User Changes Language (Settings Page):
   User clicks dropdown → LanguageService.changeLanguage('en')
                                   ↓
                       Update TranslateService (UI updates)
                                   ↓
                       Save to Firestore Settings.language
                                   ↓
                       Emit currentLanguage$ observable

3. Translation Usage (Component):
   Template: {{ 'home.welcome' | translate }}
                       ↓
              TranslatePipe → TranslateService.get('home.welcome')
                       ↓
              Return translated string from loaded JSON
```

---

## Özet: Tüm Model Dosyaları

| Dosya | Amaç | Tipler |
|-------|------|--------|
| `language.model.ts` | Dil entity tanımı | `Language`, `SupportedLanguageCode`, `SUPPORTED_LANGUAGES` |
| `settings.model.ts` | Settings extension | `Settings.language?`, `DEFAULT_SETTINGS.language` |
| `translation.model.ts` | Çeviri dosyası yapısı | `TranslationFile`, `TranslationKeyPrefix`, `isValidTranslationKey` |
| `language.service.ts` | Service state | `LanguageServiceState`, `LanguageState` |

---

## Type Safety Kontrol Listesi

- [x] Tüm interface'ler `any` kullanmadan tanımlandı
- [x] Union type'lar kullanıldı (`'tr' | 'en'`)
- [x] Optional field'lar `?:` ile işaretlendi (backward compat)
- [x] Readonly array'ler `readonly` veya `as const` ile işaretlendi
- [x] Observable tipler `Observable<T>` şeklinde tanımlandı
- [x] Firestore Timestamp tipi kullanıldı
- [x] Enum tanımları eklendi (TranslationKeyPrefix)
- [x] Validator fonksiyonları tip güvenli (isValidTranslationKey)

---

**Data Model Tamamlandı**: ✅ Tüm veri yapıları TypeScript strict mode ile tanımlandı

**Sonraki Adım**: contracts/ klasöründe LanguageService API kontratı oluştur
