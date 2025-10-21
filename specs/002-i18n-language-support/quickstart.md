# Çoklu Dil Desteği (i18n) - Developer Quickstart

**Özellik**: 002-i18n-language-support
**Tarih**: 2025-10-21
**Hedef Kitle**: Pomodoro Timer projesine katkıda bulunan geliştiriciler

## Genel Bakış

Bu döküman, i18n feature'ını kullanmaya ve genişletmeye başlamak için pratik bir kılavuzdur. Yeni çeviri ekleme, dil değiştirme, ve yaygın sorunları çözme senaryolarını içerir.

---

## Hızlı Başlangıç: 5 Dakikada i18n

### 1. Yeni Çeviri Anahtarı Eklemek

#### Adım 1: Çeviri Dosyalarını Güncelle

Her iki dil dosyasına da aynı anahtarı ekle:

```json
// src/assets/i18n/tr.json
{
  "myFeature.myButton": "Butona Tıkla",
  "myFeature.myLabel": "Etiket Metni"
}
```

```json
// src/assets/i18n/en.json
{
  "myFeature.myButton": "Click Button",
  "myFeature.myLabel": "Label Text"
}
```

**İsimlendirme Kuralı**:
- Format: `{feature}.{context}.{element}`
- Feature prefix: `auth`, `home`, `tasks`, `settings`, `statistics`, `history`, `common`, `errors`
- camelCase kullan: `myButton` ✅, `my_button` ❌

#### Adım 2: Template'te Kullan

```html
<!-- translate pipe ile -->
<button>{{ 'myFeature.myButton' | translate }}</button>
<label>{{ 'myFeature.myLabel' | translate }}</label>

<!-- translate directive ile -->
<p [translate]="'myFeature.myButton'"></p>
```

#### Adım 3: ng serve Kontrol

1. Terminal'de compilation hatası yok mu kontrol et
2. Browser console'da hata yok mu kontrol et
3. Dil değiştir, çeviri değişiyor mu test et

✅ **Tamamlandı!** Yeni çeviriniz kullanıma hazır.

---

### 2. TypeScript'te Çeviri Kullanmak

#### Component'te Kullanım

```typescript
import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  template: `<p>{{ translatedText }}</p>`
})
export class MyFeatureComponent {
  private translateService = inject(TranslateService);
  translatedText = '';

  ngOnInit(): void {
    // Synchronous (mevcut dilde)
    this.translatedText = this.translateService.instant('myFeature.myButton');

    // Asynchronous (observable)
    this.translateService.get('myFeature.myLabel').subscribe(text => {
      console.log(text);
    });
  }
}
```

**Ne Zaman instant(), Ne Zaman get()**:
- `instant()`: Çeviri zaten yüklenmiş, hemen değer gerekli
- `get()`: Çeviri yüklenmemiş olabilir, observable döner

#### Parametreli Çeviri

```json
// tr.json
{
  "tasks.completedCount": "{{count}} görev tamamlandı"
}

// en.json
{
  "tasks.completedCount": "{{count}} tasks completed"
}
```

```html
<!-- Template -->
<p>{{ 'tasks.completedCount' | translate:{ count: 5 } }}</p>
<!-- Output TR: "5 görev tamamlandı" -->
<!-- Output EN: "5 tasks completed" -->
```

```typescript
// TypeScript
const text = this.translateService.instant('tasks.completedCount', { count: 5 });
```

---

### 3. Dil Değiştirme (Programmatik)

```typescript
import { Component, inject } from '@angular/core';
import { LanguageService } from './core/services/language.service';

@Component({...})
export class SettingsComponent {
  private languageService = inject(LanguageService);

  async changeToEnglish(): Promise<void> {
    try {
      await this.languageService.changeLanguage('en');
      console.log('Dil değiştirildi: İngilizce');
    } catch (error) {
      console.error('Dil değiştirme hatası:', error);
    }
  }

  async changeToTurkish(): Promise<void> {
    await this.languageService.changeLanguage('tr');
  }
}
```

**Reactive Kullanım** (önerilen):
```typescript
export class SettingsComponent {
  private languageService = inject(LanguageService);

  // Mevcut dili track et
  currentLang$ = this.languageService.currentLanguage$;

  // Loading state
  isChanging$ = this.languageService.isChanging$;
}
```

```html
<select [disabled]="isChanging$ | async" [(ngModel)]="selectedLang" (change)="onLanguageChange()">
  <option value="tr">Türkçe</option>
  <option value="en">English</option>
</select>

<p *ngIf="isChanging$ | async">Dil değiştiriliyor...</p>
<p>Mevcut dil: {{ currentLang$ | async }}</p>
```

---

## Yaygın Kullanım Senaryoları

### Scenario 1: Yeni Sayfa Çevirisi

Yeni bir sayfa (örn: `ReportsComponent`) eklediniz ve tüm metinleri çevirmek istiyorsunuz.

#### 1. Çeviri Anahtarlarını Belirle

```typescript
// reports.component.ts
// Hardcoded metinler:
// - "Reports"
// - "Generate Report"
// - "Download PDF"
// - "No reports available"
```

#### 2. Anahtarları tr.json ve en.json'a Ekle

```json
// tr.json
{
  "reports.title": "Raporlar",
  "reports.generate": "Rapor Oluştur",
  "reports.downloadPdf": "PDF İndir",
  "reports.noReports": "Henüz rapor yok"
}

// en.json
{
  "reports.title": "Reports",
  "reports.generate": "Generate Report",
  "reports.downloadPdf": "Download PDF",
  "reports.noReports": "No reports available"
}
```

#### 3. Template'i Güncelle

```html
<!-- ÖNCE (hardcoded) -->
<h1>Reports</h1>
<button>Generate Report</button>
<a>Download PDF</a>
<p>No reports available</p>

<!-- SONRA (i18n) -->
<h1>{{ 'reports.title' | translate }}</h1>
<button>{{ 'reports.generate' | translate }}</button>
<a>{{ 'reports.downloadPdf' | translate }}</a>
<p>{{ 'reports.noReports' | translate }}</p>
```

#### 4. Test Et

```bash
# ng serve zaten çalışıyor
# Browser'da /reports sayfasını aç
# Settings → Dil → English seçeneğini seç
# Tüm metinlerin İngilizce olduğunu doğrula
```

---

### Scenario 2: Hata Mesajı Çevirisi

Firebase/Firestore hatalarını kullanıcı dostu mesajlara çevirmek istiyorsunuz.

#### 1. Hata Mesajlarını Çevirilere Ekle

```json
// tr.json
{
  "errors.auth.emailAlreadyInUse": "Bu e-posta adresi zaten kullanımda",
  "errors.auth.weakPassword": "Şifre çok zayıf (minimum 6 karakter)",
  "errors.auth.userNotFound": "Kullanıcı bulunamadı",
  "errors.network": "İnternet bağlantısı hatası",
  "errors.generic": "Bir hata oluştu, lütfen tekrar deneyin"
}

// en.json
{
  "errors.auth.emailAlreadyInUse": "This email is already in use",
  "errors.auth.weakPassword": "Password is too weak (minimum 6 characters)",
  "errors.auth.userNotFound": "User not found",
  "errors.network": "Network connection error",
  "errors.generic": "An error occurred, please try again"
}
```

#### 2. Error Handler Service Oluştur

```typescript
// src/app/core/services/error-handler.service.ts
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private translateService = inject(TranslateService);

  getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Firebase Auth errors
      if (error.message.includes('email-already-in-use')) {
        return this.translateService.instant('errors.auth.emailAlreadyInUse');
      }
      if (error.message.includes('weak-password')) {
        return this.translateService.instant('errors.auth.weakPassword');
      }
      // Network errors
      if (error.message.includes('network')) {
        return this.translateService.instant('errors.network');
      }
    }

    // Fallback
    return this.translateService.instant('errors.generic');
  }
}
```

#### 3. Component'te Kullan

```typescript
export class LoginComponent {
  private errorHandler = inject(ErrorHandlerService);
  errorMessage = '';

  async login(): Promise<void> {
    try {
      await this.authService.login(email, password);
    } catch (error) {
      this.errorMessage = this.errorHandler.getErrorMessage(error);
    }
  }
}
```

```html
<div *ngIf="errorMessage" class="error">{{ errorMessage }}</div>
```

---

### Scenario 3: Tarih/Saat Formatı Dil Bazlı

Statistics sayfasında tarihler İngilizce'de MM/dd/yyyy, Türkçe'de dd.MM.yyyy formatında olmalı.

#### 1. Component'te Locale Observable Oluştur

```typescript
import { Component, inject } from '@angular/core';
import { LanguageService } from './core/services/language.service';
import { map } from 'rxjs/operators';

export class StatisticsComponent {
  private languageService = inject(LanguageService);

  // Mevcut dil kodunu locale'e map et
  currentLocale$ = this.languageService.currentLanguage$.pipe(
    map(lang => lang === 'tr' ? 'tr-TR' : 'en-US')
  );
}
```

#### 2. Template'te DatePipe ile Kullan

```html
<!-- Tarih formatı dile göre değişir -->
<p>{{ session.startTime | date:'medium':undefined:(currentLocale$ | async) }}</p>

<!-- Türkçe: 21.10.2025 14:30 -->
<!-- İngilizce: 10/21/2025 2:30 PM -->
```

**DatePipe Format Options**:
- `'short'`: Kısa format
- `'medium'`: Orta format
- `'long'`: Uzun format
- `'full'`: Tam format
- `'dd.MM.yyyy HH:mm'`: Custom format

---

## Hot Reload Validation Workflow

Her kod değişikliğinden sonra ng serve kontrolü (Constitution requirement).

### Checklist

1. **Terminal Kontrolü**:
   ```
   ✓ Compilation successful
   ✗ ERROR in ... → Düzelt ve tekrar kontrol
   ```

2. **Browser Console Kontrolü**:
   ```javascript
   // Console'da error var mı?
   ✓ No errors
   ✗ TranslateService: Missing key "..." → Çeviri anahtarını ekle
   ```

3. **Dil Değişikliği Testi**:
   - Settings → Dil → English seç
   - Tüm sayfaları ziyaret et (auth, home, tasks, settings, statistics, history)
   - Hiçbir metin hardcoded kalmamalı
   - Eksik çeviri varsa → tr.json ve en.json'a ekle

4. **Dark Mode Kontrolü**:
   - Settings → Dark Mode → Aç
   - i18n ile ilgili UI elemanları dark mode uyumlu mu?
   - Dil seçici dropdown dark mode'da okunabilir mi?

---

## Debugging & Troubleshooting

### Problem 1: "Missing translation for key: home.welcome"

**Sebep**: Çeviri anahtarı JSON dosyalarında yok.

**Çözüm**:
```json
// tr.json VE en.json'a ekle
{
  "home.welcome": "Hoş Geldiniz" // TR
  "home.welcome": "Welcome"      // EN
}
```

---

### Problem 2: Dil değiştirince bazı metinler değişmiyor

**Sebep**: Hardcoded metinler var (translate pipe kullanılmamış).

**Çözüm**:
```html
<!-- Yanlış -->
<h1>Welcome</h1>

<!-- Doğru -->
<h1>{{ 'home.welcome' | translate }}</h1>
```

---

### Problem 3: Dil değişikliği Firestore'a kaydolmuyor

**Sebep**: LanguageService.changeLanguage() hata veriyor.

**Debug**:
```typescript
this.languageService.lastError$.subscribe(error => {
  if (error) {
    console.error('Language service error:', error);
  }
});
```

**Yaygın Nedenler**:
- Network hatası → Internet bağlantısı kontrol et
- Permission denied → Firestore security rules kontrol et
- User not authenticated → AuthService.getCurrentUser() null dönüyor

---

### Problem 4: ng serve compilation error: "Cannot find module 'ngx-translate'"

**Sebep**: ngx-translate paketleri kurulmamış.

**Çözüm**:
```bash
npm install @ngx-translate/core @ngx-translate/http-loader
```

---

## Best Practices

### ✅ DO: Yapılması Gerekenler

1. **Her zaman çeviri key'lerini prefix ile kullan**:
   ```json
   ✅ "tasks.addTask": "Görev Ekle"
   ❌ "addTask": "Görev Ekle"
   ```

2. **Parametreli çeviriler için placeholder kullan**:
   ```json
   ✅ "tasks.count": "{{count}} görev"
   ❌ Hardcoded count değeri
   ```

3. **Template'te translate pipe kullan** (TypeScript'te instant değil):
   ```html
   ✅ {{ 'home.welcome' | translate }}
   ❌ TypeScript: this.welcome = this.translateService.instant('home.welcome')
   ```

4. **Her kod değişikliğinden sonra ng serve kontrol et**:
   - Compilation error yok mu?
   - Browser console error yok mu?
   - Dil değişikliği çalışıyor mu?

---

### ❌ DON'T: Yapılmaması Gerekenler

1. **JSON dosyalarına yorum ekleme** (JSON yorumu desteklemez):
   ```json
   ❌ {
     // Bu bir yorum
     "key": "value"
   }

   ✅ {
     "key": "value"
   }
   ```

2. **Çeviri key'lerinde boşluk kullanma**:
   ```json
   ❌ "my key": "value"
   ✅ "my.key": "value"
   ```

3. **Sadece bir dosyayı güncelleme** (her iki dil dosyası da güncellenme li):
   ```json
   ❌ Sadece tr.json'a ekleme
   ✅ Hem tr.json hem en.json'a ekleme
   ```

4. **HTML içeren çeviriler**:
   ```json
   ❌ "welcome": "<strong>Hoş Geldiniz</strong>"
   ✅ "welcome": "Hoş Geldiniz"  // HTML component'te ekle
   ```

---

## Hızlı Referans: Komutlar

```bash
# Dependencies kurulumu
npm install @ngx-translate/core @ngx-translate/http-loader

# Development server (hot reload ile)
ng serve

# Build (production)
ng build --configuration production

# Unit testleri çalıştır
ng test

# Linting
ng lint
```

---

## Hızlı Referans: Dosya Yolları

```
src/
├── assets/i18n/
│   ├── tr.json                     # Türkçe çeviriler
│   └── en.json                     # İngilizce çeviriler
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── language.model.ts   # Language interface
│   │   │   └── settings.model.ts   # Settings.language field
│   │   └── services/
│   │       ├── language.service.ts # LanguageService
│   │       └── settings.service.ts # Settings persistence
│   └── app.config.ts               # TranslateModule config
```

---

## Sonraki Adımlar

1. **Tüm hardcoded metinleri çevir**: Uygulamayı tara, hangi metinler hardcoded → tr.json/en.json'a ekle
2. **Test coverage artır**: LanguageService unit testleri, i18n integration testleri
3. **Üçüncü dil ekle** (gelecekte): research.md'deki pattern'i takip et, yeni JSON dosyası ekle

---

**Quickstart Tamamlandı**: ✅ i18n kullanımı için hazırsınız!

**Soru/Sorun**: Takıldığınız bir yer olursa `specs/002-i18n-language-support/` klasöründeki diğer dökümanları inceleyin (research.md, data-model.md, contracts/)

**Not**: Bu döküman mevcut implementation tamamlandıktan sonra güncellenebilir (gerçek kullanım örnekleri eklenebilir).
