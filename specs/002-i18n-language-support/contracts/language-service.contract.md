# LanguageService API Kontratı

**Özellik**: 002-i18n-language-support
**Tarih**: 2025-10-21
**Amaç**: LanguageService public API spesifikasyonu ve kullanım dökümanı

## Genel Bakış

`LanguageService`, ngx-translate kütüphanesini wrap ederek uygulama genelinde dil yönetimini sağlayan merkezi servistir. Firestore persistence, tarayıcı dil algılama ve reactive state management sorumluluklarını içerir.

**Service Lokasyonu**: `src/app/core/services/language.service.ts`
**Provider Scope**: `providedIn: 'root'` (singleton)
**Dependencies**: `TranslateService` (ngx-translate), `SettingsService`, `AuthService`

---

## Public API

### 1. Observable Properties

#### `currentLanguage$: Observable<SupportedLanguageCode>`

Mevcut aktif dilin observable stream'i.

**Tip**: `Observable<'tr' | 'en'>`
**Initial Value**: `'tr'` (varsayılan)
**Emit Trigger**: Dil değiştiğinde (`changeLanguage` çağrısı sonrası)

**Kullanım**:
```typescript
// Component
export class HeaderComponent {
  private languageService = inject(LanguageService);
  currentLang$ = this.languageService.currentLanguage$;
}

// Template
<p>{{ 'home.welcome' | translate }} ({{ currentLang$ | async }})</p>
```

**Kullanım Senaryoları**:
- Dil seçicisinde aktif dili highlight etmek
- Locale-dependent pipe'larda locale parametresi sağlamak
- Analytics/logging için mevcut dili track etmek

---

#### `isChanging$: Observable<boolean>`

Dil değişikliği işlemi devam ediyor mu?

**Tip**: `Observable<boolean>`
**Initial Value**: `false`
**Emit Trigger**: `changeLanguage` başladığında `true`, bittiğinde `false`

**Kullanım**:
```typescript
// Settings component
export class SettingsComponent {
  private languageService = inject(LanguageService);
  isChangingLanguage$ = this.languageService.isChanging$;
}

// Template (loading indicator)
<select [disabled]="isChangingLanguage$ | async">
  <option value="tr">Türkçe</option>
  <option value="en">English</option>
</select>
<span *ngIf="isChangingLanguage$ | async">Değiştiriliyor...</span>
```

**Kullanım Senaryoları**:
- Dil değişikliği sırasında UI'yı disable etmek
- Loading spinner göstermek
- İkinci değişiklik isteğini engellemek

---

#### `lastError$: Observable<Error | null>`

Son dil değişikliği hatası (varsa).

**Tip**: `Observable<Error | null>`
**Initial Value**: `null`
**Emit Trigger**: Hata oluştuğunda `Error` instance, başarılı işlemde `null`

**Kullanım**:
```typescript
// Settings component
export class SettingsComponent {
  private languageService = inject(LanguageService);
  languageError$ = this.languageService.lastError$;
}

// Template (error message)
<div *ngIf="languageError$ | async as error" class="error">
  {{ 'errors.settings.saveFailed' | translate }}: {{ error.message }}
</div>
```

**Kullanım Senaryoları**:
- Kullanıcıya hata mesajı göstermek
- Retry mekanizması için hata state'ini track etmek
- Error logging/monitoring

---

### 2. Readonly Properties

#### `availableLanguages: readonly Language[]`

Desteklenen dillerin listesi.

**Tip**: `readonly Language[]`
**Value**: `SUPPORTED_LANGUAGES` constant (language.model.ts'den)

```typescript
readonly availableLanguages: readonly Language[] = [
  { code: 'tr', name: 'Türkçe', isDefault: true, locale: 'tr-TR' },
  { code: 'en', name: 'English', isDefault: false, locale: 'en-US' }
];
```

**Kullanım**:
```typescript
// Settings component
export class SettingsComponent {
  private languageService = inject(LanguageService);
  languages = this.languageService.availableLanguages;
}

// Template (language selector)
<select [(ngModel)]="selectedLang" (change)="onLanguageChange()">
  @for (lang of languages; track lang.code) {
    <option [value]="lang.code">{{ lang.name }}</option>
  }
</select>
```

**Kullanım Senaryoları**:
- Dil seçici dropdown options'larını populate etmek
- Desteklenen dilleri kullanıcıya göstermek
- Dil kod validasyonu

---

### 3. Methods

#### `initializeLanguage(): Promise<void>`

Uygulama başlatma sırasında dili initialize eder (APP_INITIALIZER'da çağrılır).

**Signature**:
```typescript
async initializeLanguage(): Promise<void>
```

**Returns**: `Promise<void>` (void Promise)
**Throws**: Error (catch edilir ve fallback tr'ye set edilir)

**Akış**:
1. `AuthService.getCurrentUser()` ile kullanıcı kontrolü
2. Eğer kullanıcı varsa:
   - `SettingsService.getSettings()` ile Firestore'dan settings yükle
   - `settings.language` varsa kullan, yoksa tarayıcı dilini algıla
3. Eğer kullanıcı yoksa:
   - `detectBrowserLanguage()` çağır
4. `TranslateService.use(lang)` ile çeviri dosyasını yükle
5. `currentLanguage$` observable'ını güncelle

**Kullanım**:
```typescript
// app.config.ts (APP_INITIALIZER)
export function initializeLanguage(languageService: LanguageService) {
  return (): Promise<void> => {
    return languageService.initializeLanguage();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeLanguage,
      deps: [LanguageService],
      multi: true
    }
  ]
};
```

**Hata Ele Alma**:
```typescript
try {
  await languageService.initializeLanguage();
} catch (error) {
  console.error('Dil başlatma hatası:', error);
  // Fallback 'tr' diline
}
```

**Performans**: SC-002 (500ms), actual ~200-300ms (HTTP cache ile <100ms)

---

#### `changeLanguage(languageCode: SupportedLanguageCode): Promise<void>`

Aktif dili değiştirir, TranslateService ve Firestore'u günceller.

**Signature**:
```typescript
async changeLanguage(languageCode: SupportedLanguageCode): Promise<void>
```

**Parameters**:
- `languageCode`: `'tr' | 'en'` (desteklenen dil kodu)

**Returns**: `Promise<void>`
**Throws**: Error (TranslateService veya Firestore hatası)

**Akış**:
1. `isChanging$` = `true` (loading state)
2. `TranslateService.use(languageCode)` çağır (UI anında güncellenir)
3. `SettingsService.updateLanguage(languageCode)` ile Firestore'a kaydet
4. `currentLanguage$` = `languageCode` (state güncelle)
5. `isChanging$` = `false`
6. `lastError$` = `null` (başarılı)

**Hata Durumunda**:
- `isChanging$` = `false`
- `lastError$` = `Error` instance
- TranslateService değişikliği geri alınmaz (partial success OK)

**Kullanım**:
```typescript
// Settings component
export class SettingsComponent {
  private languageService = inject(LanguageService);

  async onLanguageChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const lang = select.value as SupportedLanguageCode;

    try {
      await this.languageService.changeLanguage(lang);
      // Başarı mesajı göster
    } catch (error) {
      console.error('Dil değiştirme hatası:', error);
      // Hata mesajı göster
    }
  }
}
```

**Performans**:
- TranslateService.use(): ~50-100ms (JSON zaten cache'de)
- Firestore updateLanguage(): ~100-200ms (network)
- **Total**: <300ms (SC-002: 500ms hedefi altında)

---

#### `detectBrowserLanguage(): SupportedLanguageCode`

Tarayıcı dilini algılar ve desteklenen dil koduna eşler.

**Signature**:
```typescript
detectBrowserLanguage(): SupportedLanguageCode
```

**Parameters**: Yok
**Returns**: `'tr' | 'en'` (desteklenen dil kodu)
**Throws**: Yok (her zaman valid değer döner)

**Akış**:
1. `navigator.language` değerini oku (örn: "tr-TR", "en-US", "fr-FR")
2. İlk 2 karakteri al (language code)
3. `'tr'` ise → `'tr'` döndür
4. `'en'` ise → `'en'` döndür
5. Diğer diller → `'en'` döndür (fallback)

**Kullanım**:
```typescript
// Yeni kullanıcı için varsayılan dil belirleme
const defaultLang = this.languageService.detectBrowserLanguage();
await this.languageService.changeLanguage(defaultLang);
```

**Algılama Tablosu**:
| navigator.language | Algılanan Kod | Sonuç |
|--------------------|---------------|-------|
| `tr-TR` | `tr` | `'tr'` ✅ |
| `tr` | `tr` | `'tr'` ✅ |
| `en-US` | `en` | `'en'` ✅ |
| `en-GB` | `en` | `'en'` ✅ |
| `fr-FR` | `fr` | `'en'` (fallback) |
| `de-DE` | `de` | `'en'` (fallback) |

**SC-004 Compliance**: %90 başarı (Türkçe ve İngilizce tarayıcılar doğru algılanır)

---

## İnternal (Private) Methods

### `updateState(partial: Partial<LanguageServiceState>): void`

İnternal state'i günceller (private method, API'nin parçası değil).

```typescript
private updateState(partial: Partial<LanguageServiceState>): void {
  this.stateSubject.next({
    ...this.stateSubject.value,
    ...partial
  });
}
```

---

## State Machine Diagram

```
                    ┌──────────────┐
                    │  IDLE (tr)   │ ◄─── Initial State
                    └──────┬───────┘
                           │
                    changeLanguage('en')
                           │
                           ▼
                    ┌──────────────┐
                    │  CHANGING    │ (isChanging$ = true)
                    └──────┬───────┘
                           │
                    ┌──────┴──────┐
                    │             │
         Success    │             │  Error
                    │             │
                    ▼             ▼
          ┌──────────────┐  ┌─────────────┐
          │  IDLE (en)   │  │ IDLE + ERROR│ (lastError$ = Error)
          └──────────────┘  └─────────────┘
               │                   │
               │                   │
            NEW changeLanguage     │
               │                   │
               └───────────────────┘
```

---

## Dependency Injection Pattern

```typescript
// src/app/core/services/language.service.ts

import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from './settings.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'  // Singleton
})
export class LanguageService {
  // Constructor injection (constitution compliance)
  private translateService: TranslateService;
  private settingsService: SettingsService;
  private authService: AuthService;

  constructor() {
    // inject() kullanımı constructor içinde (injection context safe)
    this.translateService = inject(TranslateService);
    this.settingsService = inject(SettingsService);
    this.authService = inject(AuthService);
  }

  // ... implementation
}
```

**Rationale**: Constitution Principle III (Component Isolation & Standalone Architecture) uyumlu.

---

## Error Handling Contract

### Hata Tipleri

1. **TranslateService HTTP Load Error**: Çeviri dosyası yüklenemedi
   - **Neden**: Network hatası, dosya bulunamadı
   - **Fallback**: Varsayılan dil ('tr') kullan
   - **User Impact**: UI çevirileri varsayılan dilde

2. **Firestore Persistence Error**: Settings kaydedilemedi
   - **Neden**: Network hatası, permission denied
   - **Fallback**: TranslateService değişikliği korunur (partial success)
   - **User Impact**: Dil değişti ama sonraki açılışta persist olmaz

3. **Invalid Language Code**: Desteklenmeyen dil kodu
   - **Neden**: Manuel API çağrısı hatalı parametre ile
   - **Fallback**: TypeScript compile-time hatası (union type sayesinde)
   - **User Impact**: Runtime'a ulaşmaz

### Hata Yakalama Stratejisi

```typescript
async changeLanguage(lang: SupportedLanguageCode): Promise<void> {
  this.updateState({ isChanging: true, lastError: null });

  try {
    // 1. UI güncelleme (critical)
    await this.translateService.use(lang).toPromise();
    this.updateState({ currentLanguage: lang });

    // 2. Persistence (best-effort)
    try {
      await this.settingsService.updateLanguage(lang);
    } catch (persistError) {
      console.warn('Dil tercihi kaydedilemedi:', persistError);
      // Persist hatası user experience'ı bozmaz
    }

    this.updateState({ isChanging: false });
  } catch (error) {
    console.error('Dil değiştirme hatası:', error);
    this.updateState({ isChanging: false, lastError: error as Error });
    throw error; // Caller'a propagate
  }
}
```

---

## Performans Kontratı

| İşlem | Hedef (SC) | Tipik | Worst Case | Ölçüm Yöntemi |
|-------|-----------|-------|------------|---------------|
| `initializeLanguage()` | N/A | 200ms | 500ms | APP_INITIALIZER timing |
| `changeLanguage()` | <500ms | 250ms | 400ms | Performance.now() delta |
| `detectBrowserLanguage()` | N/A | <1ms | <1ms | Synchronous |
| Translation render | <500ms | <100ms | 200ms | LCP metric |

**Ölçüm Kodu**:
```typescript
const start = performance.now();
await languageService.changeLanguage('en');
const duration = performance.now() - start;
console.log(`changeLanguage duration: ${duration}ms`);
```

---

## Testability Contract

### Unit Test Mockları

```typescript
// language.service.spec.ts

const mockTranslateService = {
  use: jasmine.createSpy('use').and.returnValue(of({})),
  get: jasmine.createSpy('get').and.returnValue(of('translated')),
  onLangChange: new EventEmitter()
};

const mockSettingsService = {
  getSettings: jasmine.createSpy('getSettings').and.returnValue(Promise.resolve({
    language: 'tr'
  })),
  updateLanguage: jasmine.createSpy('updateLanguage').and.returnValue(Promise.resolve())
};

const mockAuthService = {
  getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ uid: 'test-uid' })
};
```

### Test Senaryoları

1. **Initialization Test**: `initializeLanguage()` authenticated user için Firestore'dan yükler
2. **Change Language Test**: `changeLanguage()` TranslateService ve Firestore'u günceller
3. **Browser Detection Test**: `detectBrowserLanguage()` doğru eşleme yapar
4. **Error Handling Test**: Network hatası durumunda `lastError$` emit eder
5. **State Management Test**: `currentLanguage$` doğru emit eder

---

## Backward Compatibility

**v1.0 (Önceki Versiyon)**: Dil desteği yok
**v2.0 (Bu Versiyon)**: i18n eklendi

**Breaking Changes**: Yok
**Migration**: Otomatik (Settings.language optional field)

**Mevcut Users**:
- `Settings.language` undefined ise → `detectBrowserLanguage()` kullan
- İlk `changeLanguage` çağrısında Firestore'a yazılır
- Sonraki açılışlarda persist edilen dil kullanılır

---

## Özet: API Surface

| Member | Type | Visibility | Purpose |
|--------|------|------------|---------|
| `currentLanguage$` | Observable | Public | Mevcut dil stream |
| `isChanging$` | Observable | Public | Loading state |
| `lastError$` | Observable | Public | Hata state |
| `availableLanguages` | readonly Array | Public | Desteklenen diller |
| `initializeLanguage()` | Promise<void> | Public | App başlatma |
| `changeLanguage()` | Promise<void> | Public | Dil değiştir |
| `detectBrowserLanguage()` | Sync | Public | Tarayıcı algılama |

---

**Kontrat Durumu**: ✅ TAMAMLANDI

**Sonraki Adım**: quickstart.md developer guide oluştur
