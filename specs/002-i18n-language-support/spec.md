# Feature Specification: Çoklu Dil Desteği (i18n)

**Feature Branch**: `002-i18n-language-support`
**Created**: 2025-10-21
**Status**: Draft
**Input**: User description: "dil desteği getirilmesi ingilizce ve türkçe kullanmayı düşünüyorum ilk başta ayarlar kısmından dil seçebilieyim bunların dışında oluşturacağın dökmanları türkçe oluştur projeyi incele ondan sonra işlemlerine başla"

## Clarifications

### Session 2025-10-21

- Q: Hangi i18n kütüphanesi kullanılacak? → A: ngx-translate - runtime çeviriler, dinamik dil değiştirme desteği, sayfa yenileme gerektirmez
- Q: Development workflow requirement? → A: Her işlemden sonra ng serve kontrol edilmeli (hot reload doğrulama)

## User Scenarios & Testing

### User Story 1 - Ayarlardan Dil Seçimi (Priority: P1)

Kullanıcı, uygulama dilini tercihlerine göre değiştirmek ister. Ayarlar sayfasında Türkçe ve İngilizce arasında seçim yapabilir ve seçtiği dil tüm uygulama genelinde anında uygulanır.

**Why this priority**: Bu özellik tüm i18n altyapısının temelini oluşturur. Dil değiştirme mekanizması olmadan diğer çeviriler anlamsızdır. Kullanıcıların uygulama dilini kontrol edebilmesi temel bir erişilebilirlik gereksinimidir.

**Independent Test**: Ayarlar sayfasında dil seçeneğini değiştirerek ve uygulamanın tüm sayfalarını ziyaret ederek test edilebilir. Başarı kriteri: Tüm UI metinlerinin seçilen dilde görüntülenmesi.

**Acceptance Scenarios**:

1. **Given** kullanıcı ayarlar sayfasında, **When** dil seçeneğini "Türkçe" seçer, **Then** tüm uygulama metinleri Türkçe görüntülenir ve tercih kaydedilir
2. **Given** kullanıcı ayarlar sayfasında, **When** dil seçeneğini "English" seçer, **Then** tüm uygulama metinleri İngilizce görüntülenir ve tercih kaydedilir
3. **Given** kullanıcı dil seçimini değiştirdi, **When** uygulamayı kapatıp tekrar açar, **Then** son seçtiği dil korunur ve otomatik yüklenir
4. **Given** kullanıcı herhangi bir sayfada, **When** ayarlardan dili değiştirir, **Then** mevcut sayfa yeniden yüklenmeden anında güncellenir

---

### User Story 2 - Tüm UI Metinlerinin Çevirisi (Priority: P2)

Kullanıcı seçtiği dilde uygulamanın tüm özelliklerini kullanabilir. Menüler, butonlar, bildirimler, hata mesajları, form etiketleri ve tüm kullanıcı arayüzü elemanları seçilen dilde görüntülenir.

**Why this priority**: Dil seçme altyapısı (P1) tamamlandıktan sonra, uygulamanın gerçekten çok dilli olması için tüm metinlerin çevrilmesi gerekir. Bu olmadan özellik yarım kalır.

**Independent Test**: Her bir sayfayı ve özelliği hem Türkçe hem İngilizce modda kullanarak test edilebilir. Başarı kriteri: Hardcoded metin kalmaması, tüm metinlerin çevrilmiş olması.

**Acceptance Scenarios**:

1. **Given** uygulama İngilizce modda, **When** login sayfasını görüntüler, **Then** tüm form etiketleri, butonlar ve mesajlar İngilizce görüntülenir
2. **Given** uygulama Türkçe modda, **When** timer çalıştırır, **Then** "Başlat", "Duraklat", "Durdur" gibi kontroller Türkçe görüntülenir
3. **Given** herhangi bir dil seçili, **When** bir hata oluşur, **Then** hata mesajı seçilen dilde gösterilir
4. **Given** uygulama İngilizce modda, **When** statistics sayfasını görüntüler, **Then** grafik başlıkları, metrikler ve zaman dilimleri İngilizce görüntülenir
5. **Given** uygulama Türkçe modda, **When** task oluşturur, **Then** form alanları, placeholder metinleri ve validasyon mesajları Türkçe görüntülenir

---

### User Story 3 - Tarayıcı Dil Tercihi Algılama (Priority: P3)

Yeni kullanıcı uygulamayı ilk kez açtığında, sistem tarayıcı dil ayarlarını kontrol eder ve kullanıcının diline uygun varsayılan dili otomatik seçer.

**Why this priority**: Kullanıcı deneyimini iyileştirir ancak manuel dil seçimi (P1) ve çevirilerin tamamlanması (P2) kadar kritik değildir. Nice-to-have bir özellik.

**Independent Test**: Tarayıcı dil ayarlarını değiştirerek ve yeni bir kullanıcı olarak uygulamayı ilk kez açarak test edilebilir. Başarı kriteri: Tarayıcı dili Türkçe ise Türkçe, İngilizce ise İngilizce başlatılması.

**Acceptance Scenarios**:

1. **Given** yeni kullanıcı tarayıcısı Türkçe dilinde, **When** uygulamayı ilk kez açar, **Then** uygulama Türkçe dilinde başlar
2. **Given** yeni kullanıcı tarayıcısı İngilizce dilinde, **When** uygulamayı ilk kez açar, **Then** uygulama İngilizce dilinde başlar
3. **Given** tarayıcı desteklenmeyen bir dilde (örn. Fransızca), **When** yeni kullanıcı uygulamayı açar, **Then** varsayılan dil olarak İngilizce yüklenir

---

### Edge Cases

- Kullanıcı dil değiştirirken aktif bir pomodoro timer çalışıyorsa ne olur? (Beklenti: Timer kesintisiz devam eder, sadece UI metinleri güncellenir)
- Firestore'da kaydedilmiş task'larda kullanıcı tarafından girilen metinler (örn. task başlığı) çevrilir mi? (Beklenti: Hayır, sadece sistem metinleri çevrilir, kullanıcı içeriği değil)
- Zaman formatları (12/24 saat, tarih formatı) dile göre değişir mi? (Beklenti: Türkçe için 24 saat, İngilizce için 12 saat AM/PM formatı)
- Rakamlar ve sayısal değerler dile göre format değiştirir mi? (Beklenti: Evet, binlik ayracı vb. dile uygun formatta)

## Requirements

### Functional Requirements

- **FR-001**: Sistem, Ayarlar sayfasında dil seçim kontrolü (dropdown/radio) sunmalıdır
- **FR-002**: Sistem, seçilen dil tercihini kullanıcı ayarlarında (Firestore) kaydetmelidir
- **FR-003**: Sistem, uygulamanın tüm UI metinlerini dinamik olarak yükleyebilmelidir
- **FR-004**: Sistem, minimum Türkçe ve İngilizce dillerini desteklemelidir
- **FR-005**: Dil değişikliği sayfa yenilenmeden anında uygulanmalıdır
- **FR-006**: Kullanıcının dil tercihi oturum kapansa bile korunmalıdır
- **FR-007**: Sistem, tarayıcı dil tercihini algılayarak varsayılan dili belirleyebilmelidir
- **FR-008**: Tüm hata mesajları, bildirimler ve form validasyonları çevrilmelidir
- **FR-009**: Zaman ve tarih formatları seçilen dile uygun şekilde görüntülenmelidir
- **FR-010**: Her sayfa ve component için çeviri dosyaları merkezi bir yapıda yönetilmelidir

### Key Entities

- **Language**: Sistem tarafından desteklenen bir dil (code: "tr" | "en", name: "Türkçe" | "English", isDefault: boolean)
- **Translation**: Belirli bir anahtar için çeviri metni (key: string, tr: string, en: string)
- **UserLanguagePreference**: Kullanıcının kayıtlı dil tercihi (userId: string, languageCode: string, updatedAt: Date)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Kullanıcılar dil değişikliğini 2 saniyeden kısa sürede tamamlayabilir (Ayarlar → Dil Seç → Kaydet)
- **SC-002**: Dil değiştirildikten sonra tüm UI elemanları 500ms içinde güncellenir (sayfa yenilenmeden)
- **SC-003**: Uygulamanın %100'ü (tüm sayfalar ve bileşenler) her iki dilde de eksiksiz çevrilmiş olur
- **SC-004**: Yeni kullanıcıların %90'ı ilk açılışta doğru dille karşılanır (tarayıcı dil algılama başarısı)
- **SC-005**: Dil tercihi %100 oranında korunur (oturum kapansa bile)
- **SC-006**: Çeviri eksikliği nedeniyle hiçbir özellik kullanılamaz hale gelmez (fallback mekanizması)

## Scope

### In Scope

- Türkçe ve İngilizce dil desteği
- Ayarlar sayfasında dil seçim kontrolü
- Tüm UI metinlerinin çevirisi (menüler, butonlar, başlıklar, etiketler, placeholder'lar)
- Hata mesajları ve bildirim metinlerinin çevirisi
- Zaman/tarih formatlarının dile göre ayarlanması
- Tarayıcı dil tercihini algılama
- Dil tercihinin Firestore'da saklanması
- Çeviri dosyalarının merkezi yönetimi

### Out of Scope

- Üçüncü diller (Almanca, Fransızca vb.) - gelecekte eklenebilir
- Kullanıcı tarafından girilen içeriğin otomatik çevirisi (task başlıkları, notlar vb.)
- Sağdan sola (RTL) dil desteği (Arapça, İbranice vb.)
- Sayfa bazlı ayrı dil tercihi (örn. menü İngilizce, content Türkçe)
- Sesli bildirim metinlerinin çevirisi (text-to-speech)

## Assumptions

- Kullanıcılar iki dilden birini tercih edecek, mixed-language kullanımı olmayacak
- Çeviriler statik JSON dosyalarında saklanacak (veritabanında değil)
- Tarayıcı `navigator.language` API'sini destekliyor
- Tüm çeviriler development zamanında hazır olacak (kullanıcılar çeviri ekleyemez)
- Dil değişikliği tüm açık tab'lerde senkronize olmayacak (sadece mevcut tab)
- Development sırasında her işlemden sonra ng serve hot reload doğrulaması yapılacak

## Dependencies

- Mevcut Settings modeline `language` field'ı eklenmesi gerekli
- Tüm component'lerde hardcoded metinlerin translation key'lere dönüştürülmesi gerekli
- ngx-translate (@ngx-translate/core, @ngx-translate/http-loader) paketlerinin projeye eklenmesi ve konfigürasyonu gerekli

## Open Questions

(Şu anda açık soru yok - tüm gereksinimler net)

