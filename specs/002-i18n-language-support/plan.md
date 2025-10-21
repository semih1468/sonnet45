# Implementation Plan: Çoklu Dil Desteği (i18n)

**Branch**: `002-i18n-language-support` | **Date**: 2025-10-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-i18n-language-support/spec.md`

## Summary

Pomodoro Timer uygulamasına Türkçe ve İngilizce dil desteği eklenmesi. Kullanıcılar ayarlar sayfasından dil seçebilir, seçim Firestore'da saklanır ve ngx-translate kullanılarak runtime'da dinamik dil değişimi sağlanır. Tüm UI metinleri, hata mesajları ve zaman formatları çevrilir.

## Technical Context

**Language/Version**: TypeScript 5.9.2, Angular 20.3.0
**Primary Dependencies**:
- @ngx-translate/core (runtime i18n)
- @ngx-translate/http-loader (JSON translation dosyaları için)
- @angular/fire 20.0.1 (Firestore)
- Firebase 11.10.0
- RxJS 7.8.0
- Tailwind CSS 3.4.1

**Storage**: Firestore (user language preference: `users/{userId}/settings`), Assets (translation JSON files: `assets/i18n/{lang}.json`)
**Testing**: Jasmine + Karma (unit tests), Firebase Emulator (integration tests)
**Target Platform**: Web (Chrome, Firefox, Safari, Edge latest versions), PWA-ready
**Project Type**: Single-page Angular application (SPA)
**Performance Goals**:
- Dil değişikliği 500ms içinde tamamlanmalı (SC-002)
- İlk yükleme zamanı +50ms'den az artış
- Translation dosyası yüklemesi 200ms içinde

**Constraints**:
- Sayfa yenilenmeden dil değişikliği (FR-005)
- Firestore security rules user-scoped olmalı
- Offline support korunmalı
- Dark mode uyumluluğu bozulmamalı
- ng serve hot reload validation (her değişiklikten sonra kontrol)

**Scale/Scope**:
- 2 dil (Türkçe, İngilizce)
- ~200-250 çeviri anahtarı (tüm UI metinleri)
- 7 sayfa/component (auth, home, tasks, history, statistics, settings, shared)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Firebase-First Architecture
- **Compliance**: Dil tercihi Firestore `users/{userId}/settings.language` field'ında saklanacak
- **Offline Support**: Firestore offline persistence ile dil tercihi locally cache'lenir
- **Security**: Settings document zaten user-scoped, mevcut security rules geçerli
- **Status**: ✅ PASS

### ✅ II. TypeScript Strict Mode & Type Safety
- **Compliance**:
  - `Language` interface tanımlanacak: `{ code: 'tr' | 'en', name: string, isDefault: boolean }`
  - `TranslateService` tipi RxJS Observable<string> döndürür
  - `Settings` modeline `language?: string` field eklenecek (optional, default 'tr')
- **No `any` usage**: ngx-translate tipler kullanılacak
- **Status**: ✅ PASS

### ✅ III. Component Isolation & Standalone Architecture
- **Compliance**:
  - `TranslateModule` root app.config.ts'de provideHttpClient ile configure edilecek
  - Tüm component'ler standalone, `TranslatePipe` ve `TranslateDirective` import edilecek
  - `LanguageService` singleton (`providedIn: 'root'`)
  - Dependency injection `inject()` function ile constructor içinde
- **Status**: ✅ PASS

### ✅ IV. Dark Mode & Accessibility
- **Compliance**:
  - Dil seçim UI'ı dark mode uyumlu Tailwind classes kullanacak
  - Language selector `<select>` ARIA labels eklenecek
  - Klavye navigasyonu native select element ile sağlanır
- **Status**: ✅ PASS

### ✅ V. Deterministic State & Change Detection
- **Compliance**:
  - TranslateService observable'ı async pipe ile consume edilecek
  - Dil değişikliği deterministic (user action triggered)
  - Template'lerde `translate` pipe kullanımı deterministic
- **Status**: ✅ PASS

### Development Standards Compliance

**Code Quality**: ✅ ESLint + Prettier, Türkçe UI metinleri
**Testing**: ✅ Unit tests for LanguageService, integration tests for Firestore sync
**Error Handling**: ✅ TranslateService HTTP loader hataları try-catch ile handle edilecek
**Console Logging**: ✅ Production'da debug log yok (environment.production check)

## Project Structure

### Documentation (this feature)

```
specs/002-i18n-language-support/
├── plan.md              # Bu dosya (/speckit.plan output)
├── research.md          # Phase 0 output (ngx-translate best practices)
├── data-model.md        # Phase 1 output (Language, Settings models)
├── quickstart.md        # Phase 1 output (developer onboarding)
├── contracts/           # Phase 1 output (TranslateService API contract)
│   └── language-service.contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created yet)
```

### Source Code (repository root)

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── settings.model.ts      # [MODIFY] +language field
│   │   │   └── language.model.ts      # [CREATE] Language interface
│   │   └── services/
│   │       ├── settings.service.ts    # [MODIFY] language CRUD
│   │       └── language.service.ts    # [CREATE] ngx-translate wrapper
│   ├── features/
│   │   └── settings/
│   │       ├── settings.component.ts  # [MODIFY] +language selector
│   │       └── settings.component.html # [MODIFY] +language UI
│   ├── shared/
│   │   └── pipes/                     # [OPTIONAL] custom date/number format pipes
│   └── app.config.ts                  # [MODIFY] provideTranslateService
└── assets/
    └── i18n/
        ├── tr.json                    # [CREATE] Türkçe çeviriler
        └── en.json                    # [CREATE] İngilizce çeviriler

tests/
├── unit/
│   └── language.service.spec.ts       # [CREATE] LanguageService tests
└── integration/
    └── language-persistence.spec.ts   # [CREATE] Firestore sync tests
```

**Structure Decision**: Single Angular SPA. i18n infrastructure core/services'de merkezi, translation files assets/i18n'de JSON format. Mevcut feature folder structure korunuyor, sadece Settings modifikasyonu ve yeni LanguageService ekleniyor.

## Complexity Tracking

*No violations - bu özellik mevcut constitution principles'a tamamen uyumlu*

## Phase 0: Research & Decision Artifacts

### Research Tasks
1. ngx-translate best practices (Angular 20+ standalone components ile kullanım)
2. Translation file organization strategies (flat vs nested keys)
3. Runtime dil değişikliği change detection optimization
4. Locale-based date/number formatting (Angular DatePipe, DecimalPipe ile)
5. Tarayıcı dil algılama (`navigator.language` API best practices)

### Key Decisions to Document in research.md
- **Translation Key Structure**: Flat (`auth.login.submit`) vs Nested (`{ auth: { login: { submit: '...' } } }`)
  - **Recommendation**: Flat keys - TypeScript autocomplete için daha iyi
- **Default Language Fallback**: Eksik çeviri durumunda ne yapılacak?
  - **Recommendation**: İngilizce fallback (SC-006: "çeviri eksikliği hiçbir özelliği kullanılamaz yapmaz")
- **Date/Number Formatting**: Custom pipes vs Angular built-in pipes
  - **Recommendation**: Angular DatePipe + locale provider (daha az kod, native Angular)
- **Translation Loading**: Lazy load vs eager load
  - **Recommendation**: Eager load (2 dil, küçük JSON files, ilk yükleme performance'ı kritik değil)

## Phase 1: Design Artifacts

### data-model.md

```typescript
// Language entity
interface Language {
  code: 'tr' | 'en';
  name: string;           // "Türkçe" | "English"
  isDefault: boolean;
  locale: string;         // "tr-TR" | "en-US" (Angular locale için)
}

// Settings model extension (mevcut Settings interface'e eklenecek)
interface Settings {
  // ... existing fields
  language?: string;      // 'tr' | 'en', default: 'tr'
  // updatedAt: Timestamp (zaten var)
}

// Translation file structure (assets/i18n/tr.json)
interface TranslationFile {
  [key: string]: string;  // Flat structure
  // Örnek:
  // "common.cancel": "İptal"
  // "common.save": "Kaydet"
  // "settings.language.label": "Dil"
  // "auth.login.submit": "Giriş Yap"
}
```

### contracts/language-service.contract.md

```typescript
/**
 * LanguageService Contract
 * Responsible for: i18n runtime management, Firestore persistence sync
 */

class LanguageService {
  // Current language code observable
  currentLanguage$: Observable<string>;

  // Available languages (constant)
  readonly availableLanguages: Language[] = [
    { code: 'tr', name: 'Türkçe', isDefault: true, locale: 'tr-TR' },
    { code: 'en', name: 'English', isDefault: false, locale: 'en-US' }
  ];

  /**
   * Initialize language from Firestore settings or browser default
   * Called in app initialization (APP_INITIALIZER)
   */
  initializeLanguage(): Promise<void>;

  /**
   * Change current language
   * - Updates TranslateService
   * - Persists to Firestore settings
   * - Updates Angular LOCALE_ID for date/number pipes
   * @returns Promise resolving when language changed & saved
   */
  changeLanguage(languageCode: 'tr' | 'en'): Promise<void>;

  /**
   * Get browser preferred language
   * @returns 'tr' | 'en' | null (if unsupported language)
   */
  detectBrowserLanguage(): 'tr' | 'en' | null;
}
```

### quickstart.md

```markdown
# i18n Developer Quickstart

## Adding New Translations

1. **Add key to translation files**:
   ```json
   // assets/i18n/tr.json
   {
     "my.new.key": "Türkçe metin"
   }

   // assets/i18n/en.json
   {
     "my.new.key": "English text"
   }
   ```

2. **Use in template**:
   ```html
   <p>{{ 'my.new.key' | translate }}</p>
   ```

3. **Use in TypeScript**:
   ```typescript
   import { TranslateService } from '@ngx-translate/core';

   constructor() {
     const translate = inject(TranslateService);
     translate.get('my.new.key').subscribe(text => console.log(text));
   }
   ```

## Testing Language Switch

1. Run `ng serve`
2. Navigate to `/settings`
3. Select language from dropdown
4. Verify all UI texts update immediately
5. Refresh page - language should persist

## Hot Reload Validation

After every code change:
1. Check terminal for compilation errors
2. Check browser console for errors
3. Test language switch still works
4. Verify no broken translations (missing keys)
```

## Next Steps

### Immediate Actions (Phase 0 completion)
1. Generate comprehensive `research.md` with ngx-translate setup guide
2. Document translation key naming conventions
3. Research Angular 20 locale configuration for date/number formatting

### Phase 1 Deliverables
1. Complete `data-model.md` with full entity schemas
2. Create `contracts/language-service.contract.md` with API specifications
3. Finalize `quickstart.md` developer guide
4. Update `CLAUDE.md` with ngx-translate technology

### Phase 2 (tasks.md generation via `/speckit.tasks`)
- Will be created in next step with detailed implementation tasks
- Expected ~15-20 tasks covering:
  - npm install dependencies
  - Settings model modification
  - LanguageService creation
  - TranslateModule configuration
  - Translation file creation (tr.json, en.json)
  - Settings component UI update
  - All component template translation
  - Unit tests
  - Integration tests
  - Hot reload validation after each task

---

**Plan Status**: ✅ READY FOR PHASE 0 RESEARCH

**Constitution Compliance**: ✅ ALL GATES PASSED

**Next Command**: Continue to Phase 0 research generation (this command continues automatically)
