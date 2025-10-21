# Özellik Spesifikasyonu: Pomodoro Firebase Entegrasyonu

**Özellik Dalı**: `001-pomodoro-firebase-integration`
**Oluşturulma Tarihi**: 2025-10-21
**Durum**: Taslak
**Girdi**: Tasarımı hazır olan Pomodoro uygulamasının Firebase entegrasyonu yapılarak kodlanması

## Açıklamalar

### Oturum 2025-10-21

- S: Kullanıcılar mola sürelerini zamanlayıcı ile takip edebilmeli mi ve bu molalar Firebase'e kaydedilmez mi? → C: Molalar zamanlayıcı ile takip edilir ancak Firebase'e kaydedilmez
- S: Kullanıcılar Focus ve Break sürelerini özelleştirebilmeli mi? → C: Evet, kullanıcılar Focus ve Break sürelerini özelleştirebilir
- S: Üretkenlik serisi nasıl hesaplanmalı ve Firebase'e kaydedilmeli mi? → C: En az 1 Pomodoro tamamlanan günler ardışık sayılır, Firebase'e kaydedilir
- S: Günlük Pomodoro hedefi nasıl belirlenmeli? → C: Sistem otomatik hedef belirler (sabit 4 Pomodoro/gün)
- S: Görev tamamlandı olarak işaretlendiğinde ne olmalı? → C: Görev tamamlandı işaretlenir, Pomodoro sayısı korunur, Firebase'e kaydedilir
- S: Hangi frontend framework kullanılacak? → C: Angular (latest stable version)

## Kullanıcı Senaryoları & Test *(zorunlu)*

### Kullanıcı Hikayesi 1 - Pomodoro Oturumu Başlatma ve Kaydetme (Öncelik: P1)

Kullanıcı, bir Pomodoro çalışma oturumu başlatabilmeli ve bu oturum otomatik olarak bulutta kaydedilmelidir. Kullanıcı zamanlayıcıyı başlattığında, oturum bilgileri (başlangıç zamanı, görev adı) anlık olarak Firebase'e kaydedilir.

**Bu önceliğin nedeni**: Uygulamanın temel işlevselliğidir. Kullanıcı verilerinin bulutta saklanması, cihazlar arası senkronizasyon ve veri kaybını önleme için kritiktir.

**Bağımsız Test**: Kullanıcı zamanlayıcıyı başlatarak ve Firebase konsolundan verinin kaydedildiğini kontrol ederek tamamen test edilebilir. Oturum başlatma ve kaydetme işlevselliği bağımsız değer sağlar.

**Kabul Senaryoları**:

1. **Verilen** kullanıcı giriş yapmış durumda, **Ne zaman** yeni bir Pomodoro oturumu başlatırsa, **O zaman** oturum bilgileri Firebase'de kullanıcının hesabı altında kaydedilir
2. **Verilen** aktif bir internet bağlantısı var, **Ne zaman** oturum başlatılırsa, **O zaman** başlangıç zamanı ve görev adı 2 saniye içinde buluta kaydedilir
3. **Verilen** kullanıcı çevrimdışı, **Ne zaman** oturum başlatılırsa, **O zaman** veri yerel olarak saklanır ve bağlantı sağlandığında otomatik olarak senkronize edilir

---

### Kullanıcı Hikayesi 2 - Pomodoro Oturumu Tamamlama ve Geçmiş Görüntüleme (Öncelik: P2)

Kullanıcı, bir Pomodoro oturumunu tamamlayabilmeli ve tamamlanan oturum Firebase'de güncellenmelidir. Kullanıcı geçmiş oturumlarını görüntüleyebilmeli ve istatistiklerini takip edebilmelidir.

**Bu önceliğin nedeni**: Kullanıcıların üretkenliklerini izlemelerine ve motivasyonlarını sürdürmelerine olanak tanır. Geçmiş verilere erişim, kullanıcı deneyimini önemli ölçüde artırır.

**Bağımsız Test**: Kullanıcı bir oturum tamamlayarak, geçmiş sayfasını açarak ve tamamlanan oturumların listesini görerek bağımsız olarak test edilebilir.

**Kabul Senaryoları**:

1. **Verilen** aktif bir Pomodoro oturumu, **Ne zaman** süre tamamlanırsa, **O zaman** oturum durumu "tamamlandı" olarak güncellenir ve bitiş zamanı kaydedilir
2. **Verilen** kullanıcının tamamlanmış oturumları var, **Ne zaman** geçmiş sayfasını açarsa, **O zaman** tüm geçmiş oturumlar tarih sırasına göre listelenir
3. **Verilen** birden fazla gün boyunca oturumlar, **Ne zaman** istatistikler görüntülenirse, **O zaman** günlük, haftalık ve aylık toplam oturum sayısı ve süresi gösterilir

---

### Kullanıcı Hikayesi 3 - Kullanıcı Kimlik Doğrulama (Öncelik: P1)

Kullanıcı, Firebase Authentication ile giriş yapabilmeli ve çıkış yapabilmelidir. Her kullanıcının verileri kendi hesabı altında güvenli bir şekilde saklanmalıdır.

**Bu önceliğin nedeni**: Veri güvenliği ve gizliliği için kritiktir. Kullanıcıların kendi verilerine özel erişimi olmalı ve başka kullanıcıların verilerini görememeli.

**Bağımsız Test**: Kullanıcı giriş yaparak, oturum başlatarak ve başka bir cihazdan giriş yapıp aynı verileri görerek test edilebilir.

**Kabul Senaryoları**:

1. **Verilen** kullanıcı kayıtlı değil, **Ne zaman** e-posta ve şifre ile kayıt olursa, **O zaman** Firebase'de yeni bir kullanıcı hesabı oluşturulur
2. **Verilen** kayıtlı bir kullanıcı, **Ne zaman** doğru kimlik bilgileri ile giriş yaparsa, **O zaman** kullanıcının geçmiş Pomodoro verileri yüklenir
3. **Verilen** oturum açık kullanıcı, **Ne zaman** çıkış yaparsa, **O zaman** yerel oturum temizlenir ve veriler Firebase'de güvenli kalır

---

### Kullanıcı Hikayesi 4 - Görev Yönetimi (Öncelik: P3)

Kullanıcı, Pomodoro oturumları için görevler oluşturabilmeli, düzenleyebilmeli ve silebilmelidir. Her görev Firebase'de saklanmalı ve oturumlarla ilişkilendirilmelidir.

**Bu önceliğin nedeni**: Kullanıcıların çalışmalarını organize etmelerine ve hangi görevlerde ne kadar zaman harcadıklarını izlemelerine olanak tanır.

**Bağımsız Test**: Kullanıcı yeni görev oluşturarak, görev listesini görüntüleyerek ve bir görevi bir oturuma atayarak test edilebilir.

**Kabul Senaryoları**:

1. **Verilen** giriş yapmış kullanıcı, **Ne zaman** yeni görev oluşturursa, **O zaman** görev Firebase'de kaydedilir ve görev listesinde görünür
2. **Verilen** mevcut görevler, **Ne zaman** kullanıcı bir görevi düzenler veya silerse, **O zaman** değişiklikler Firebase'de anında güncellenir
3. **Verilen** bir görev seçilmiş, **Ne zaman** Pomodoro oturumu başlatılırsa, **O zaman** oturum bu görevle ilişkilendirilir
4. **Verilen** tamamlanmamış görev, **Ne zaman** kullanıcı tamamlandı olarak işaretlerse, **O zaman** görev durumu "tamamlandı" olarak güncellenir ve harcanan Pomodoro sayısı korunur

---

### Kullanıcı Hikayesi 5 - Zamanlayıcı Ayarları Özelleştirme (Öncelik: P3)

Kullanıcı, Focus ve Break zamanlayıcı sürelerini kişisel tercihlerine göre ayarlayabilmelidir. Bu ayarlar kullanıcının Firebase hesabında saklanmalı ve tüm cihazlarda senkronize olmalıdır.

**Bu önceliğin nedeni**: Kullanıcıların farklı çalışma ritimlerine sahip olması ve Pomodoro tekniğini kendi ihtiyaçlarına göre uyarlamak istemesi yaygındır.

**Bağımsız Test**: Kullanıcı ayarlar sayfasından Focus süresini 30 dakikaya değiştirerek ve yeni oturum başlatarak özelleştirilmiş sürenin uygulandığını görerek test edilebilir.

**Kabul Senaryoları**:

1. **Verilen** giriş yapmış kullanıcı ayarlar sayfasında, **Ne zaman** Focus süresini değiştirirse, **O zaman** yeni değer Firebase'e kaydedilir ve bir sonraki oturumda kullanılır
2. **Verilen** kullanıcı Break süresini özelleştirmiş, **Ne zaman** mola zamanı gelirse, **O zaman** özelleştirilmiş süre ile mola başlar
3. **Verilen** kullanıcı farklı cihazdan giriş yapmış, **Ne zaman** ayarlar yüklenirse, **O zaman** özelleştirilmiş Focus/Break süreleri tüm cihazlarda aynı olur

---

### Kenar Durumlar

- Kullanıcı çevrimdışıyken oturum başlatırsa ne olur? (Yerel depolama kullanılmalı, bağlantı sağlandığında senkronize edilmeli)
- Firebase bağlantısı oturum sırasında kesilirse ne olur? (Zamanlayıcı çalışmaya devam etmeli, veri bağlantı geri geldiğinde kaydedilmeli)
- Kullanıcı aynı anda birden fazla cihazdan giriş yaparsa ne olur? (En son güncelleme geçerli olmalı, çakışmalar çözülmeli)
- Kullanıcı oturumunu yarıda bırakırsa ne olur? (Oturum "yarıda kalan" olarak işaretlenmeli veya kullanıcıya devam etme/iptal etme seçeneği sunulmalı)
- Firebase kotası aşılırsa ne olur? (Kullanıcıya anlamlı hata mesajı gösterilmeli)
- Hesap silme durumunda veriler ne olur? (Kullanıcı verileri Firebase'den tamamen silinmeli - GDPR uyumlu)

## Gereksinimler *(zorunlu)*

### Fonksiyonel Gereksinimler

- **FR-001**: Sistem, kullanıcıların e-posta ve şifre ile Firebase Authentication üzerinden kayıt olmasına izin VERMELİDİR
- **FR-002**: Sistem, kayıtlı kullanıcıların e-posta ve şifre ile giriş yapmasına izin VERMELİDİR
- **FR-003**: Sistem, kullanıcıların güvenli bir şekilde çıkış yapabilmesini SAĞLAMALIDIR
- **FR-004**: Sistem, her Pomodoro oturumunu (başlangıç zamanı, bitiş zamanı, süre, durum, görev bilgisi) Firebase Firestore'da SAKLAMALIDIR
- **FR-005**: Sistem, kullanıcı verilerini yalnızca o kullanıcının erişebileceği şekilde İZOLE ETMELİDİR (Firestore Security Rules ile)
- **FR-006**: Sistem, çevrimdışı durumda yerel olarak veri kaydetmeli ve çevrimiçi olunduğunda otomatik olarak SENKRONİZE ETMELİDİR
- **FR-007**: Sistem, kullanıcıların tamamlanmış oturumlarının geçmişini görüntülemesine İZİN VERMELİDİR
- **FR-008**: Sistem, günlük, haftalık ve aylık Pomodoro istatistiklerini HESAPLAMALIDIR
- **FR-009**: Sistem, kullanıcıların görev oluşturmasına, düzenlemesine ve silmesine İZİN VERMELİDİR
- **FR-010**: Sistem, her oturumu bir görevle İLİŞKİLENDİREBİLMELİDİR
- **FR-011**: Sistem, Firebase bağlantı hatalarını YÖNETMELİ ve kullanıcıya anlamlı geri bildirim SAĞLAMALIDIR
- **FR-012**: Sistem, zamanlayıcı çalışırken Firebase bağlantısı kesilse bile kesintisiz ÇALIŞMALIDIR
- **FR-013**: Sistem, mola zamanlayıcısı SAĞLAMALIDİR (5 dakika varsayılan, yerel olarak çalışır, Firebase'e kaydedilmez)
- **FR-014**: Sistem, Focus ve Break zamanlayıcıları arasında otomatik GEÇİŞ YAPABİLMELİDİR
- **FR-015**: Sistem, kullanıcıların Focus ve Break sürelerini ÖZELLEŞTİRMESİNE izin VERMELİDİR
- **FR-016**: Sistem, zamanlayıcı ayarlarını (Focus/Break süreleri, ses, dark mode, otomatik başlatma) Firebase'de SAKLAMALIDIR
- **FR-017**: Sistem, kullanıcı ayarlarını cihazlar arası SENKRONİZE ETMELİDİR
- **FR-018**: Sistem, üretkenlik serisini (productivity streak) HESAPLAMALIDIR (en az 1 tamamlanmış Pomodoro olan ardışık günler)
- **FR-019**: Sistem, üretkenlik serisi verilerini Firebase'de SAKLAMALIDIR
- **FR-020**: Sistem, günlük ilerlemeyi SABİT 4 Pomodoro hedefine göre GÖSTERMELİDİR
- **FR-021**: Sistem, bir sonraki molaya kaç oturum kaldığını HESAPLAMALIDIR ve GÖSTERMELİDİR
- **FR-022**: Sistem, görevlerin tamamlanma durumunu (checkbox) YÖNETMELİDİR ve Firebase'de SAKLAMALIDIR
- **FR-023**: Sistem, tamamlanan görevlerin harcanan Pomodoro sayısını KORUМALIDIR

### Anahtar Varlıklar

- **Kullanıcı (User)**: Sistemde kayıtlı kullanıcı; Firebase Authentication UID'si, e-posta adresi, kayıt tarihi içerir
- **Pomodoro Oturumu (Pomodoro Session)**: Tek bir çalışma oturumu; başlangıç zamanı, bitiş zamanı, süre (genellikle 25 dakika), durum (aktif, tamamlandı, iptal edildi), ilişkili görev ID'si içerir
- **Görev (Task)**: Kullanıcının çalışmak istediği görev; görev adı, oluşturulma tarihi, tamamlanma durumu, toplam harcanan Pomodoro sayısı içerir
- **İstatistikler (Statistics)**: Kullanıcının üretkenlik metrikleri; toplam oturum sayısı, toplam çalışma süresi, günlük/haftalık/aylık trendler, üretkenlik serisi (ardışık günler), günlük ilerleme (tamamlanan/hedef 4 Pomodoro) içerir
- **Kullanıcı Ayarları (User Settings)**: Kullanıcının tercihleri; Focus süresi (varsayılan 25 dakika), Break süresi (varsayılan 5 dakika), ses aktif/pasif, dark mode aktif/pasif, otomatik başlatma aktif/pasif

## Başarı Kriterleri *(zorunlu)*

### Ölçülebilir Sonuçlar

- **SC-001**: Kullanıcılar hesap oluşturma ve giriş yapma işlemini 1 dakika içinde tamamlayabilmelidir
- **SC-002**: Pomodoro oturumu başlatıldığında, veri 3 saniye içinde Firebase'e kaydedilmelidir
- **SC-003**: Geçmiş oturumlar sayfası, 100'den fazla oturum olsa bile 2 saniye içinde yüklenmelidir
- **SC-004**: Çevrimdışı modda başlatılan oturumlar, bağlantı sağlandığında 5 saniye içinde senkronize edilmelidir
- **SC-005**: Kullanıcıların %95'i, ilk denemede başarılı bir şekilde oturum başlatabilmeli ve tamamlayabilmelidir
- **SC-006**: Sistem, aynı anda en az 1000 aktif kullanıcıyı performans kaybı olmadan desteklemelidir
- **SC-007**: Veri kaybı oranı %0.1'den az olmalıdır (ağ hataları ve çevrimdışı kullanım dahil)
- **SC-008**: Kullanıcılar farklı cihazlardan giriş yaptıklarında verilerinin senkronize olduğunu görebilmelidir (5 saniye içinde)

## Varsayımlar

- Firebase yapılandırması (firabase.txt dosyasındaki bilgiler) doğru ve çalışır durumdadır
- Kullanıcılar temel Pomodoro tekniği ile (25 dakika çalışma, 5 dakika mola) tanışıktır
- Uygulama Angular framework ile geliştirilecek ve modern web tarayıcılarında (Chrome, Firefox, Safari, Edge - son 2 versiyon) çalışacaktır
- Kullanıcıların çoğu çevrimiçi olarak kullanacaktır, ancak çevrimdışı destek kritik bir özelliktir
- Standart Firestore güvenlik kuralları uygulanacaktır (kullanıcılar yalnızca kendi verilerine erişebilir)
- E-posta doğrulaması ilk versiyonda opsiyoneldir (gelecek sürümlerde zorunlu hale getirilebilir)
- Şifre sıfırlama Firebase Authentication'ın yerleşik özelliği ile sağlanacaktır
- Varsayılan Focus süresi 25 dakika ve Break süresi 5 dakikadır (kullanıcılar bu süreleri özelleştirebilir)

## Kapsam Dışı

- Sosyal özellikler (arkadaş ekleme, liderlik tabloları, paylaşım)
- Üçüncü parti entegrasyonlar (Google Calendar, Trello, vb.)
- Mobil uygulama (bu spesifikasyon web uygulaması içindir)
- Takım/grup özellikleri (paylaşılan görevler, ekip istatistikleri)
- Bildirimler (tarayıcı bildirimleri, e-posta bildirimleri)
- Gelişmiş analitikler (grafikler, trendler, karşılaştırmalar) - temel istatistikler dahildir
- Özelleştirilebilir temalar veya görünüm ayarları
