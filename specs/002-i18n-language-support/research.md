# Araştırma Dökümanı: Angular 20 için ngx-translate Implementasyonu

**Özellik**: Çoklu Dil Desteği (i18n)
**Tarih**: 2025-10-21
**Araştıran**: AI Agent (speckit.plan Phase 0)

## Genel Bakış

Bu döküman ngx-translate kütüphanesinin Angular 20 standalone component mimarisinde kullanımı için araştırma sonuçlarını ve en iyi uygulama kararlarını içermektedir.

## 1. Angular 20+ Standalone Component'ler için ngx-translate Kurulumu

### Karar: Standalone Component Konfigürasyonu
**Seçilen**: `provideHttpClient` + `provideTranslateService` kullanımı `app.config.ts` içinde

**Gerekçe**:
- Angular 20'de NgModule kullanımı artık deprecated
- `TranslateModule.forRoot()` yerine functional provider pattern kullanımı
- Tree-shakeable ve daha performanslı
- Constitution Principle III uyumluluğu (Standalone Architecture)

**Implementasyon Pattern'i**:
```typescript
// app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';

// Translation loader factory
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'tr',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
};
```

**Değerlendirilen Alternatifler**:
- ❌ TranslateModule.forRoot() NgModule içinde: Angular 20 için deprecated pattern
- ❌ http-loader olmadan manuel JSON yükleme: Daha fazla boilerplate kod gerektirir
- ✅ **Seçilen**: importProvidersFrom + functional konfigürasyon

**Referanslar**:
- https://github.com/ngx-translate/core#angular-standalone-components
- Angular 20 standalone API dökümanları

---

## 2. Çeviri Dosyası Organizasyonu

### Karar: Düz (Flat) Anahtar Yapısı
**Seçilen**: `"auth.login.submit": "Giriş Yap"` (nokta notasyonu düz anahtarlar)

**Gerekçe**:
- TypeScript autocomplete desteği daha iyi
- Translation key'ler string literal olarak kullanılınca IDE support mükemmel
- Daha az iç içe yapı, daha az JSON parsing overhead
- Namespace collision riski düşük (feature prefix ile)

**Dosya Yapısı**:
```json
// assets/i18n/tr.json
{
  // Ortak paylaşılan çeviriler
  "common.cancel": "İptal",
  "common.save": "Kaydet",
  "common.delete": "Sil",
  "common.confirm": "Onayla",

  // Auth feature
  "auth.login.title": "Giriş Yap",
  "auth.login.email": "E-posta",
  "auth.login.password": "Şifre",
  "auth.login.submit": "Giriş",
  "auth.register.title": "Kayıt Ol",

  // Home feature
  "home.welcome": "Hoş Geldiniz",
  "home.startPomodoro": "Pomodoro Başlat",

  // Tasks feature
  "tasks.addTask": "Görev Ekle",
  "tasks.taskTitle": "Görev Başlığı",
  "tasks.priority.high": "Yüksek",
  "tasks.priority.medium": "Orta",
  "tasks.priority.low": "Düşük",

  // Settings feature
  "settings.title": "Ayarlar",
  "settings.language.label": "Dil",
  "settings.language.turkish": "Türkçe",
  "settings.language.english": "English",
  "settings.darkMode": "Karanlık Mod",
  "settings.workDuration": "Çalışma Süresi",

  // Statistics feature
  "statistics.title": "İstatistikler",
  "statistics.today": "Bugün",
  "statistics.week": "Bu Hafta",
  "statistics.month": "Bu Ay",
  "statistics.completedSessions": "Tamamlanan Oturumlar",
  "statistics.totalFocusTime": "Toplam Odaklanma Süresi",

  // History feature
  "history.title": "Geçmiş",
  "history.noSessions": "Henüz oturum kaydı yok",

  // Hata mesajları
  "errors.generic": "Bir hata oluştu",
  "errors.network": "Bağlantı hatası",
  "errors.auth.invalid": "Geçersiz kullanıcı adı veya şifre",
  "errors.auth.emailInUse": "Bu e-posta adresi zaten kullanımda"
}
```

**Değerlendirilen Alternatifler**:
- ❌ İç içe obje yapısı: `{ auth: { login: { submit: "..." } } }` - Daha karmaşık, autocomplete zorluğu
- ❌ Feature bazlı ayrı dosyalar: Lazy loading gereksiz (sadece 2 dil, küçük dosyalar)
- ✅ **Seçilen**: Dil başına tek düz dosya

**İsimlendirme Kuralı**:
- Format: `{feature}.{context}.{element}`
- Feature prefix zorunlu: `auth`, `home`, `tasks`, `settings`, `statistics`, `history`, `common`, `errors`
- Snake_case değil, camelCase: `addTask` ✅, `add_task` ❌
- Hiyerarşik gruplama: `.priority.high`, `.errors.auth.invalid`

---

## 3. Fallback Dil Stratejisi

### Karar: Eksik Çeviri Uyarısı ile İngilizce Fallback
**Seçilen**: `defaultLanguage: 'tr'`, `fallbackLanguage: 'en'`

**Gerekçe**:
- SC-006 uyumluluğu: "çeviri eksikliği hiçbir özelliği kullanılamaz yapmaz"
- Türkçe varsayılan (birincil kullanıcı tabanı Türk kullanıcılar)
- İngilizce evrensel fallback (eksik çeviri durumunda anlaşılır)
- Development'ta eksik key uyarısı console'da görünsün (production'da sessiz)

**Implementasyon**:
```typescript
// app.config.ts TranslateModule konfigürasyonu
TranslateModule.forRoot({
  defaultLanguage: 'tr',
  useDefaultLang: true,  // Mevcut dilde key yoksa default'a fallback
})

// LanguageService
changeLanguage(lang: 'tr' | 'en'): Promise<void> {
  return this.translateService.use(lang).toPromise();
  // Eksik key'ler otomatik olarak 'tr' diline fallback yapar
}
```

**Eksik Çeviri Ele Alma**:
```typescript
// Development: Console uyarısı
// Production: Sessiz fallback

// TranslateService'de custom MissingTranslationHandler (opsiyonel)
export class CustomMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    if (!environment.production) {
      console.warn(`Eksik çeviri key'i: ${params.key}`);
    }
    // Fallback olarak key'in kendisini döndür (developer görür)
    return params.key;
  }
}
```

**Değerlendirilen Alternatifler**:
- ❌ Fallback yok (key göster): Kullanıcı deneyimi kötü
- ❌ Aynı dil fallback (tr → tr): Eksik key durumunda yine eksik
- ✅ **Seçilen**: tr default, en fallback, development uyarısı

---

## 4. Locale ile Tarih ve Sayı Formatlama

### Karar: Angular Yerleşik Pipe'lar + LOCALE_ID Provider
**Seçilen**: `DatePipe` / `DecimalPipe` locale parametresi ile

**Gerekçe**:
- Native Angular çözümü, ngx-translate ile entegre değil ama uyumlu
- Locale-aware formatlama built-in (DatePipe: 'dd/MM/yyyy' vs 'MM/dd/yyyy')
- Constitution Principle III: Daha az dış bağımlılık
- Performance: Angular pipe'ları çok optimize

**Implementasyon Pattern'i**:
```typescript
// LanguageService
changeLanguage(lang: 'tr' | 'en'): Promise<void> {
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';

  // TranslateService'i güncelle
  await this.translateService.use(lang).toPromise();

  // Angular locale'i güncelle (DatePipe, DecimalPipe için)
  // Not: LOCALE_ID inject token, runtime değişiklik manuel pipe instantiation
  // veya pipe'larda locale parametresi kullanımı gerektirir

  return Promise.resolve();
}
```

**Template Kullanımı**:
```html
<!-- Tarih formatlama -->
<p>{{ session.startTime | date:'medium':undefined:currentLocale }}</p>

<!-- Sayı formatlama -->
<p>{{ statistics.totalFocusTime | number:'1.0-0':undefined:currentLocale }}</p>

<!-- Component -->
export class StatisticsComponent {
  currentLocale$ = this.languageService.currentLanguage$.pipe(
    map(lang => lang === 'tr' ? 'tr-TR' : 'en-US')
  );
}
```

**Locale Konfigürasyonu**:
```typescript
// app.config.ts
import { registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr';
import localeEn from '@angular/common/locales/en';

registerLocaleData(localeTr);
registerLocaleData(localeEn);

// Varsayılan locale
providers: [
  { provide: LOCALE_ID, useValue: 'tr-TR' }
]
```

**Değerlendirilen Alternatifler**:
- ❌ Tarih/sayı için özel pipe'lar: Gereksiz kod tekrarı, Angular pipe'lar yeterli
- ❌ moment.js / date-fns: Fazla bağımlılık, Angular native yeterli
- ✅ **Seçilen**: Angular DatePipe + DecimalPipe locale parametresi ile

**Dile Göre Tarih/Saat Formatları**:
- **Türkçe (tr-TR)**:
  - Tarih: `dd.MM.yyyy` (ör: 21.10.2025)
  - Saat: `HH:mm` (24-saat formatı)
  - TarihSaat: `dd.MM.yyyy HH:mm`

- **İngilizce (en-US)**:
  - Tarih: `MM/dd/yyyy` (ör: 10/21/2025)
  - Saat: `h:mm a` (12-saat AM/PM formatı)
  - TarihSaat: `MM/dd/yyyy h:mm a`

---

## 5. Tarayıcı Dil Algılama

### Karar: Manuel Eşleme ile `navigator.language`
**Seçilen**: Tarayıcı dilini algıla, desteklenen dillere eşle ('tr' | 'en')

**Gerekçe**:
- User Story 3 (P3): Tarayıcı dil tercihi algılama
- SC-004: %90 başarı oranı hedefi
- Basit ve güvenilir API (tüm modern browser'larda destekleniyor)

**Implementasyon**:
```typescript
// LanguageService
detectBrowserLanguage(): 'tr' | 'en' | null {
  // navigator.language örnekleri: "tr-TR", "en-US", "en", "fr-FR"
  const browserLang = navigator.language.toLowerCase();

  // Dil kodunu çıkar (ilk 2 karakter)
  const langCode = browserLang.split('-')[0];

  // Desteklenen dillere eşle
  if (langCode === 'tr') return 'tr';
  if (langCode === 'en') return 'en';

  // Desteklenmeyen dil → İngilizce fallback (SC-004 senaryo 3)
  return 'en';
}

async initializeLanguage(): Promise<void> {
  const user = this.authService.getCurrentUser();

  if (user) {
    // Kimliği doğrulanmış kullanıcı: Firestore'dan yükle
    const settings = await this.settingsService.getSettings();
    const savedLang = settings.language || this.detectBrowserLanguage() || 'tr';
    await this.translateService.use(savedLang).toPromise();
  } else {
    // Yeni kullanıcı: Tarayıcı dilini kullan
    const detectedLang = this.detectBrowserLanguage() || 'tr';
    await this.translateService.use(detectedLang).toPromise();
  }
}
```

**Tarayıcı Dil Algılama Kapsamı**:
- ✅ Türkçe tarayıcılar: `tr-TR`, `tr` → Türkçe
- ✅ İngilizce tarayıcılar: `en-US`, `en-GB`, `en-AU`, `en` → İngilizce
- ✅ Desteklenmeyen tarayıcılar: `fr-FR`, `de-DE`, `es-ES` → İngilizce (varsayılan fallback)

**Değerlendirilen Alternatifler**:
- ❌ IP tabanlı geolocation: Aşırı, gizlilik endişesi, dış API gerektirir
- ❌ Tarayıcı timezone algılama: Güvenilmez (VPN, timezone değişiklikleri)
- ✅ **Seçilen**: navigator.language (W3C standard, gizlilik-güvenli)

---

## 6. Çeviri Yükleme Stratejisi

### Karar: HTTP Loader ile Eager Loading
**Seçilen**: Uygulama başlangıcında çeviri dosyalarını hemen yükle

**Gerekçe**:
- Sadece 2 dil dosyası (~20-30KB toplam sıkıştırılmış)
- İlk sayfa render'ında çeviriler hazır olmalı (UI flicker önlemek için)
- SC-002: 500ms dil değişikliği hedefi (network latency zaten <200ms)
- Lazy loading karmaşıklığı gereksiz

**Implementasyon**:
```typescript
// TranslateHttpLoader konfigürasyonu
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(
    http,
    './assets/i18n/',  // Çeviri dosyaları yolu
    '.json'            // Dosya uzantısı
  );
}

// app.config.ts
TranslateModule.forRoot({
  defaultLanguage: 'tr',
  loader: {
    provide: TranslateLoader,
    useFactory: HttpLoaderFactory,
    deps: [HttpClient]
  }
})
```

**Yükleme Sırası**:
1. Uygulama başlatma
2. LanguageService.initializeLanguage() çağrılır (APP_INITIALIZER)
3. Varsayılan dili ('tr') HTTP ile yükle
4. Uygulamayı çeviriler ile render et

**Önbellekleme Stratejisi**:
- Tarayıcı HTTP cache (production'da cache-control header'ları)
- ServiceWorker cache (PWA desteği için)
- TranslateService dahili cache dışında in-memory cache yok

**Değerlendirilen Alternatifler**:
- ❌ Route bazlı lazy load: Gereksiz karmaşıklık, başlangıç yükleme zaten hızlı
- ❌ TypeScript içinde inline JSON: Bundle boyutu artar, HTTP cache'den yararlanılamaz
- ✅ **Seçilen**: Tarayıcı cache ile eager HTTP load

---

## 7. Runtime Dil Değişikliği Optimizasyonu

### Karar: TranslateService Observable + ChangeDetectionStrategy.OnPush
**Seçilen**: Minimal change detection cycle'ları ile reaktif dil güncellemeleri

**Gerekçe**:
- SC-002: 500ms içinde tüm UI güncellenmeli
- Constitution Principle V: Deterministik change detection
- Reaktif pattern (observable) Angular best practice

**Implementasyon Pattern'i**:
```typescript
// Component
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [TranslatePipe, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush  // Optimize
})
export class HeaderComponent {
  // Dil değiştiğinde çeviriler otomatik güncellenir
  // TranslatePipe, TranslateService.onLangChange'e subscribe olur
}

// Template
<h1>{{ 'home.welcome' | translate }}</h1>
<button>{{ 'common.save' | translate }}</button>
```

**Change Detection Tetikleyici**:
- TranslateService.use(lang) `onLangChange` event'i emit eder
- Tüm TranslatePipe instance'ları otomatik güncellenir
- ChangeDetectorRef.markForCheck() pipe tarafından otomatik çağrılır
- Manuel change detection'a gerek yok

**Performans Optimizasyonu**:
1. OnPush stratejisi: Component tree sadece input değişikliğinde kontrol edilir
2. TranslatePipe pure pipe: Değişmezse recompute yapılmaz
3. Async pipe: Observable unsubscribe otomatik (memory leak önleme)

**Değerlendirilen Alternatifler**:
- ❌ Manuel change detection (ChangeDetectorRef.detectChanges): Hataya açık, constitution ihlali
- ❌ Varsayılan change detection: Tüm component tree her tick'te kontrol edilir (yavaş)
- ✅ **Seçilen**: OnPush + reaktif pipe'lar (optimal)

---

## 8. Firestore Persistence Entegrasyonu

### Karar: Settings Document Extension
**Seçilen**: Mevcut `users/{userId}/settings` document'ına `language` field'ı ekle

**Gerekçe**:
- Constitution Principle I: Firebase-First Architecture
- Mevcut Settings infrastructure kullan (DRY)
- Offline persistence Firestore'da zaten var
- Kullanıcı settings atomik olarak güncellenir

**Firestore Şeması**:
```typescript
// users/{userId}/settings
interface Settings {
  userId: string;
  darkMode: boolean;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  dailyGoal: number;
  notifications: boolean;
  language: string;         // [YENİ] 'tr' | 'en'
  updatedAt: Timestamp;
}
```

**Firestore Rules** (user-scoped, zaten mevcut):
```javascript
// firestore.rules
match /users/{userId}/settings/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**Service Entegrasyonu**:
```typescript
// SettingsService (MODIFY)
async updateLanguage(language: 'tr' | 'en'): Promise<void> {
  const user = this.authService.getCurrentUser();
  if (!user) return;

  const settingsRef = doc(this.firestore, `users/${user.uid}/settings/preferences`);
  await updateDoc(settingsRef, {
    language,
    updatedAt: serverTimestamp()
  });
}

// LanguageService
async changeLanguage(lang: 'tr' | 'en'): Promise<void> {
  // 1. TranslateService'i güncelle (anında UI güncellemesi)
  await this.translateService.use(lang).toPromise();

  // 2. Firestore'a kaydet (arka planda)
  await this.settingsService.updateLanguage(lang);

  // 3. Reaktif stream'ler için subject'i güncelle
  this.currentLanguageSubject.next(lang);
}
```

**Değerlendirilen Alternatifler**:
- ❌ Ayrı `languages` collection: Gereksiz collection, settings içinde yeterli
- ❌ Sadece LocalStorage: Offline tamam ama çoklu cihaz senkronizasyonu yok
- ✅ **Seçilen**: Settings document field extension

---

## 9. Dil Başlatma için APP_INITIALIZER

### Karar: Uygulama Render Edilmeden Önce Dil Başlat
**Seçilen**: İlk render'dan önce dili yüklemek için Angular APP_INITIALIZER kullan

**Gerekçe**:
- İlk sayfa render'ında çeviriler hazır olmalı (UI flicker önlemek için)
- User Story 1, Senaryo 3: Uygulama açılışında dil korunmalı
- Async başlatma için Angular best practice

**Implementasyon**:
```typescript
// app.config.ts
import { APP_INITIALIZER } from '@angular/core';
import { LanguageService } from './core/services/language.service';

export function initializeLanguage(languageService: LanguageService) {
  return (): Promise<void> => {
    return languageService.initializeLanguage();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    // ... diğer provider'lar
    {
      provide: APP_INITIALIZER,
      useFactory: initializeLanguage,
      deps: [LanguageService],
      multi: true
    }
  ]
};
```

**Başlatma Akışı**:
1. Angular bootstrap başlar
2. APP_INITIALIZER çalışır (Promise resolve olana kadar uygulamayı bloklar)
3. LanguageService.initializeLanguage() çalışır:
   - Kullanıcı kimlik doğrulaması yapılmış mı kontrol et
   - Evet ise: Firestore settings'den dil yükle
   - Hayır ise: Tarayıcı dilini algıla
   - TranslateService.use() ile çeviri dosyasını yükle
4. Promise resolve olur
5. Uygulama doğru dil ile render edilir

**Hata Ele Alma**:
```typescript
// LanguageService.initializeLanguage()
async initializeLanguage(): Promise<void> {
  try {
    const user = this.authService.getCurrentUser();

    if (user) {
      const settings = await this.settingsService.getSettings();
      const lang = settings.language || this.detectBrowserLanguage() || 'tr';
      await this.translateService.use(lang).toPromise();
    } else {
      const lang = this.detectBrowserLanguage() || 'tr';
      await this.translateService.use(lang).toPromise();
    }
  } catch (error) {
    console.error('Dil başlatma başarısız, varsayılan (tr) kullanılıyor', error);
    // Hata durumunda Türkçe fallback
    await this.translateService.use('tr').toPromise();
  }
}
```

**Değerlendirilen Alternatifler**:
- ❌ Component ngOnInit'te yükle: UI flicker, geç yükleme
- ❌ Synchronous yükleme (bundle edilmiş): HTTP cache yararı yok
- ✅ **Seçilen**: APP_INITIALIZER async yükleme

---

## 10. Çeviri Anahtarı Tip Güvenliği (Bonus)

### Karar: Çeviri Anahtarları için Tip Güvenliği Yok (Basit Tut)
**Seçilen**: TypeScript validasyonu olmadan string literal anahtarlar

**Gerekçe**:
- Tip güvenli çeviri anahtarları karmaşık TypeScript gymnastics gerektirir
- ngx-translate native desteği yok (3. parti kütüphane gerekli)
- Development'ta eksik key uyarısı yeterli (console.warn)
- Build-time validation değil, runtime validation (TranslateService içinde)

**Mevcut Kullanım** (tip güvenliği yok):
```typescript
// Template
<h1>{{ 'home.welcome' | translate }}</h1>

// TypeScript
this.translateService.get('home.welcome').subscribe(text => ...);
```

**Tip Güvenli Alternatif** (reddedildi, çok karmaşık):
```typescript
// JSON'dan tip tanımı (build script gerektirir)
type TranslationKeys = 'home.welcome' | 'home.startPomodoro' | ... (250+ key)

// Kullanım
<h1>{{ translateKey('home.welcome') | translate }}</h1>
// Key yoksa TypeScript hatası
```

**Neden Reddedildi**:
- JSON'dan tip oluşturmak için özel build script gerekli
- 250+ string literal union type (IDE performansı düşer)
- JSON değişikliği her zaman tip regeneration gerektirir
- ngx-translate ekosisteminde yaygın değil

**Risk Azaltma Stratejisi**:
- Development: MissingTranslationHandler console uyarısı
- Code review: Çeviri kontrol listesi (yeni key eklendiğinde her iki dosyada da var mı?)
- Testing: E2E test eksik key kontrolü (DOM'da `[missing:]` scan)

---

## Özet: Nihai Kararlar

| Karar Kategorisi | Seçilen Yaklaşım | Gerekçe |
|-----------------|------------------|---------|
| **Kurulum** | provideHttpClient + importProvidersFrom(TranslateModule) | Angular 20 standalone best practice |
| **Dosya Yapısı** | Düz anahtarlar (`"auth.login.submit"`) | Daha iyi IDE desteği, daha az iç içe yapı |
| **Fallback** | tr varsayılan, en fallback | SC-006 uyumluluğu, Türk hedef kitle |
| **Tarih/Sayı Format** | Angular DatePipe + DecimalPipe locale ile | Native çözüm, ekstra bağımlılık yok |
| **Tarayıcı Algılama** | navigator.language | W3C standardı, gizlilik-güvenli |
| **Yükleme** | Eager HTTP load | Küçük dosyalar, ilk render için çeviriler gerekli |
| **Change Detection** | OnPush + TranslatePipe reaktif | Performans optimizasyonu, SC-002 uyumlu |
| **Persistence** | Firestore Settings document | Constitution Principle I uyumluluğu |
| **Başlatma** | APP_INITIALIZER | UI flicker önleme, garantili hazır durum |
| **Tip Güvenliği** | Hayır (basit tut) | Karmaşıklık vs fayda dengesi |

---

## Implementasyon Kontrol Listesi

- [ ] Bağımlılıkları kur: `npm install @ngx-translate/core @ngx-translate/http-loader`
- [ ] app.config.ts'de TranslateModule'ü HTTP loader ile konfigüre et
- [ ] app.config.ts'de locale'leri (tr-TR, en-US) kaydet
- [ ] LanguageService oluştur: initializeLanguage(), changeLanguage(), detectBrowserLanguage()
- [ ] Dil başlatma için APP_INITIALIZER ekle
- [ ] Settings modelini düzenle: `language?: string` field'ı ekle
- [ ] SettingsService'i düzenle: updateLanguage() metodu ekle
- [ ] Çeviri dosyaları oluştur: assets/i18n/tr.json, assets/i18n/en.json
- [ ] Settings component'ine dil seçici UI ekle
- [ ] Tüm hardcoded UI metinlerini çeviri anahtarları ile değiştir
- [ ] Tarih/sayı formatlamayı locale parametresi kullanacak şekilde güncelle
- [ ] LanguageService için unit testler yaz
- [ ] Firestore persistence için integration testler yaz
- [ ] Farklı tarayıcılarda tarayıcı dil algılamayı test et
- [ ] Her kod değişikliğinden sonra hot reload'u doğrula

---

**Araştırma Tamamlandı**: ✅ Tüm Phase 0 kararları dokümante edildi ve gerekçelendirildi

**Sonraki Phase**: data-model.md, contracts/, quickstart.md oluştur (Phase 1)
