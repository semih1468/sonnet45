# Tasks: Pomodoro Firebase Entegrasyonu

**Input**: `/specs/001-pomodoro-firebase-integration/` klasöründeki tasarım dökümanları
**Önkoşullar**: plan.md (zorunlu), spec.md (kullanıcı hikayeleri için zorunlu), research.md, data-model.md, contracts/

**Organizasyon**: Görevler, her hikayenin bağımsız olarak uygulanabilmesi ve test edilebilmesi için kullanıcı hikayelerine göre gruplandırılmıştır.

## Format: `[ID] [P?] [Story] Açıklama`
- **[P]**: Paralel çalıştırılabilir (farklı dosyalar, bağımlılık yok)
- **[Story]**: Bu görevin ait olduğu kullanıcı hikayesi (örn: US1, US2, US3)
- Açıklamalarda tam dosya yolları belirtilmiştir

## Yol Konvansiyonları
- **Angular projesi**: `src/app/` repository root'unda
- Yollar plan.md yapısına göre ayarlanmıştır

---

## Faz 1: Kurulum (Paylaşılan Altyapı)

**Amaç**: Proje başlatma ve temel yapı oluşturma

- [X] T001 Angular CLI ile yeni proje oluştur (ng new pomodoro-app --standalone --routing --style=scss)
- [X] T002 AngularFire ve Firebase SDK'larını yükle (@angular/fire v17+, Firebase SDK v10.x)
- [X] T003 [P] Tailwind CSS kurulumunu yapılandır (tailwind.config.js, styles.scss)
- [X] T004 [P] TypeScript ve linting konfigürasyonu (tsconfig.json, eslint)
- [X] T005 Firebase projesi konfigürasyonunu environment dosyalarına ekle (src/environments/)
- [X] T006 Proje klasör yapısını oluştur (core/, features/, shared/ klasörleri)
- [X] T007 [P] Firebase Emulator Suite kurulumunu yapılandır (firebase.json)
- [X] T008 [P] Git repository başlat ve .gitignore dosyasını yapılandır

---

## Faz 2: Temel Altyapı (Bloke Eden Önkoşullar)

**Amaç**: TÜM kullanıcı hikayeleri için gerekli olan çekirdek altyapı - Bu faz tamamlanmadan kullanıcı hikayesi çalışmasına başlanamaz

**⚠️ KRİTİK**: Bu faz tamamlanmadan hiçbir kullanıcı hikayesi çalışması başlayamaz

- [X] T009 Firebase konfigürasyonunu app.config.ts'de yapılandır (provideFirebaseApp, provideAuth, provideFirestore)
- [X] T010 Firestore offline persistence'ı etkinleştir (enableIndexedDbPersistence)
- [X] T011 [P] Core model interface'lerini oluştur: User modeli src/app/core/models/user.model.ts
- [X] T012 [P] Core model interface'lerini oluştur: PomodoroSession modeli src/app/core/models/session.model.ts
- [X] T013 [P] Core model interface'lerini oluştur: Task modeli src/app/core/models/task.model.ts
- [X] T014 [P] Core model interface'lerini oluştur: UserSettings modeli src/app/core/models/settings.model.ts
- [X] T015 [P] Core model interface'lerini oluştur: DailyStats modeli src/app/core/models/statistics.model.ts
- [X] T016 [P] Core model interface'lerini oluştur: TimerState modeli src/app/core/models/timer.model.ts
- [X] T017 Error interceptor oluştur src/app/core/interceptors/error.interceptor.ts
- [X] T018 Ana routing yapılandırmasını oluştur src/app/app.routes.ts
- [X] T019 [P] Shared utility'leri oluştur: Tarih yardımcı fonksiyonları src/app/shared/utils/date.utils.ts
- [X] T020 [P] Shared utility'leri oluştur: Validators src/app/shared/utils/validators.ts
- [X] T021 [P] Shared pipe'ları oluştur: Duration pipe src/app/shared/pipes/duration.pipe.ts
- [X] T022 [P] Shared pipe'ları oluştur: Date format pipe src/app/shared/pipes/date-format.pipe.ts
- [X] T023 [P] Shared component'leri oluştur: Loading spinner src/app/shared/components/loading-spinner/
- [X] T024 [P] Shared component'leri oluştur: Error message src/app/shared/components/error-message/
- [X] T025 Firestore Security Rules dosyasını oluştur ve deploy et (firestore.rules)
- [X] T026 Firestore indexes dosyasını oluştur (firestore.indexes.json)
- [X] T027 Ana app component yapısını oluştur src/app/app.component.ts

**Kontrol Noktası**: Temel altyapı hazır - kullanıcı hikayesi implementasyonları artık paralel başlayabilir

---

## Faz 3: Kullanıcı Hikayesi 1 - Kullanıcı Kimlik Doğrulama (Öncelik: P1) 🎯 MVP

**Hedef**: Firebase Authentication ile kullanıcı kayıt, giriş ve çıkış işlevselliği. Her kullanıcının verileri kendi hesabı altında güvenli şekilde saklanır.

**Bağımsız Test**: Kullanıcı kayıt olabilir, giriş yapabilir, çıkış yapabilir ve başka cihazdan giriş yaparak aynı verileri görebilir.

### Kullanıcı Hikayesi 1 İmplementasyonu

- [ ] T028 [P] [US1] AuthService interface ve implementasyonunu oluştur src/app/core/services/auth.service.ts
- [ ] T029 [P] [US1] Auth guard oluştur src/app/core/guards/auth.guard.ts
- [ ] T030 [US1] Login component oluştur src/app/features/auth/components/login/login.component.ts
- [ ] T031 [US1] Login component HTML template'ini oluştur src/app/features/auth/components/login/login.component.html
- [ ] T032 [US1] Login component stillendirmesini yap src/app/features/auth/components/login/login.component.scss
- [ ] T033 [US1] Signup component oluştur src/app/features/auth/components/signup/signup.component.ts
- [ ] T034 [US1] Signup component HTML template'ini oluştur src/app/features/auth/components/signup/signup.component.html
- [ ] T035 [US1] Signup component stillendirmesini yap src/app/features/auth/components/signup/signup.component.scss
- [ ] T036 [US1] Auth routing'ini yapılandır src/app/features/auth/auth.routes.ts
- [ ] T037 [US1] AuthService'e signup metodunu implement et (createUserWithEmailAndPassword, Firestore user dokümantı oluştur)
- [ ] T038 [US1] AuthService'e login metodunu implement et (signInWithEmailAndPassword)
- [ ] T039 [US1] AuthService'e logout metodunu implement et (signOut, yerel oturum temizleme)
- [ ] T040 [US1] AuthService'e onAuthStateChanged listener ekle (user$ Observable)
- [ ] T041 [US1] Login formuna reactive form validasyonu ekle (email, password zorunlu)
- [ ] T042 [US1] Signup formuna reactive form validasyonu ekle (email format, password min 6 karakter)
- [ ] T043 [US1] Auth hata mesajlarını kullanıcı dostu hale getir (Firebase error code → Türkçe mesaj)
- [ ] T044 [US1] Korumalı route'lar için auth guard uygula (home, tasks, statistics, settings)
- [ ] T045 [US1] Oturum açık kullanıcıyı login/signup sayfalarından home'a yönlendir

**Kontrol Noktası**: Bu noktada, Kullanıcı Hikayesi 1 tamamen işlevsel ve bağımsız olarak test edilebilir olmalıdır

---

## Faz 4: Kullanıcı Hikayesi 2 - Pomodoro Oturumu Başlatma ve Kaydetme (Öncelik: P1) 🎯 MVP

**Hedef**: Kullanıcı bir Pomodoro çalışma oturumu başlatabilir ve bu oturum otomatik olarak Firebase'e kaydedilir. Çevrimdışı mod desteği ile yerel kayıt ve otomatik senkronizasyon.

**Bağımsız Test**: Kullanıcı zamanlayıcıyı başlatır, Firebase konsolundan verinin kaydedildiğini kontrol eder. Çevrimdışıyken başlatılan oturumlar çevrimiçi olduğunda senkronize edilir.

### Kullanıcı Hikayesi 2 İmplementasyonu

- [ ] T046 [P] [US2] TimerService'i oluştur src/app/core/services/timer.service.ts
- [ ] T047 [P] [US2] SessionsService'i oluştur src/app/features/home/services/sessions.service.ts
- [ ] T048 [US2] Home container component oluştur src/app/features/home/home.component.ts
- [ ] T049 [US2] Home component HTML template'ini oluştur src/app/features/home/home.component.html
- [ ] T050 [US2] Home component stillendirmesini yap src/app/features/home/home.component.scss
- [ ] T051 [P] [US2] Timer display presentational component oluştur src/app/features/home/components/timer-display/timer-display.component.ts
- [ ] T052 [P] [US2] Timer controls presentational component oluştur src/app/features/home/components/timer-controls/timer-controls.component.ts
- [ ] T053 [P] [US2] Progress ring presentational component oluştur src/app/features/home/components/progress-ring/progress-ring.component.ts
- [ ] T054 [US2] Home routing'ini yapılandır (lazy loading)
- [ ] T055 [US2] TimerService'e RxJS interval ile timer state yönetimi ekle (BehaviorSubject<TimerState>)
- [ ] T056 [US2] TimerService'e start() metodu implement et (countdown başlat, state güncelle)
- [ ] T057 [US2] TimerService'e pause() metodu implement et (timer duraklat)
- [ ] T058 [US2] TimerService'e resume() metodu implement et (timer devam ettir)
- [ ] T059 [US2] TimerService'e reset() metodu implement et (timer sıfırla)
- [ ] T060 [US2] TimerService'e mode switch ekle (focus ↔ break geçişi)
- [ ] T061 [US2] SessionsService'e createSession() metodu ekle (Firestore addDoc ile session kaydet)
- [ ] T062 [US2] SessionsService'e getActiveSession() metodu ekle (status == 'active' sorgusu)
- [ ] T063 [US2] Timer display component'ine kalan süreyi göster (MM:SS formatı, duration pipe kullan)
- [ ] T064 [US2] Timer controls component'ine start/pause/reset butonları ekle
- [ ] T065 [US2] Progress ring component'ine SVG circular progress göster
- [ ] T066 [US2] Home component'te timer state'i subscribe et ve UI'ı güncelle
- [ ] T067 [US2] Start butonuna tıklandığında session oluştur ve Firebase'e kaydet
- [ ] T068 [US2] Çevrimdışı mod kontrolü ekle ve yerel kayıt (offline persistence otomatik)
- [ ] T069 [US2] Session başlatıldığında kullanıcıya görsel feedback ver (loading spinner)
- [ ] T070 [US2] Firebase yazma hatasında kullanıcıya anlamlı hata mesajı göster
- [ ] T071 [US2] Timer tamamlandığında ses bildirimi çal (opsiyonel, ayarlardan kontrol edilecek)

**Kontrol Noktası**: Bu noktada, Kullanıcı Hikayeleri 1 VE 2 tamamen işlevsel ve bağımsız olarak test edilebilir olmalıdır

---

## Faz 5: Kullanıcı Hikayesi 3 - Pomodoro Oturumu Tamamlama ve Geçmiş Görüntüleme (Öncelik: P2)

**Hedef**: Kullanıcı bir Pomodoro oturumunu tamamlayabilir, tamamlanan oturum Firebase'de güncellenir. Geçmiş oturumları görüntüleyebilir ve günlük/haftalık/aylık istatistikleri takip edebilir.

**Bağımsız Test**: Kullanıcı bir oturum tamamlar, geçmiş sayfasını açar ve tamamlanan oturumların listesini görür. İstatistikler sayfasında günlük, haftalık ve aylık toplamları görür.

### Kullanıcı Hikayesi 3 İmplementasyonu

- [ ] T072 [P] [US3] StatisticsService'i oluştur src/app/features/statistics/services/statistics.service.ts
- [ ] T073 [US3] SessionsService'e completeSession() metodu ekle (endTime set et, status 'completed' yap)
- [ ] T074 [US3] SessionsService'e cancelSession() metodu ekle (status 'cancelled' yap)
- [ ] T075 [US3] SessionsService'e getCompletedSessions() metodu ekle (limit 100, orderBy createdAt desc)
- [ ] T076 [US3] SessionsService'e getSessionsByDateRange() metodu ekle (tarih aralığında sorgulama)
- [ ] T077 [US3] StatisticsService'e updateDailyStats() metodu ekle (Firestore transaction ile günlük stats güncelle)
- [ ] T078 [US3] StatisticsService'e getDailyStats() metodu ekle (belirli bir günün stats'ını getir)
- [ ] T079 [US3] StatisticsService'e getWeeklyStats() metodu ekle (haftalık aggregation)
- [ ] T080 [US3] StatisticsService'e getMonthlyStats() metodu ekle (aylık aggregation)
- [ ] T081 [US3] StatisticsService'e calculateStreak() metodu ekle (ardışık gün hesaplama)
- [ ] T082 [US3] Timer tamamlandığında otomatik olarak completeSession() çağır
- [ ] T083 [US3] Session tamamlandığında updateDailyStats() çağır (session count++, totalFocusTime artır)
- [ ] T084 [P] [US3] Statistics container component oluştur src/app/features/statistics/statistics.component.ts
- [ ] T085 [P] [US3] Stats overview presentational component oluştur src/app/features/statistics/components/stats-overview/stats-overview.component.ts
- [ ] T086 [P] [US3] Weekly chart presentational component oluştur src/app/features/statistics/components/weekly-chart/weekly-chart.component.ts
- [ ] T087 [P] [US3] Streak display presentational component oluştur src/app/features/statistics/components/streak-display/streak-display.component.ts
- [ ] T088 [US3] Statistics routing'ini yapılandır (lazy loading)
- [ ] T089 [US3] Stats overview component'ine günlük özet göster (tamamlanan oturumlar, toplam süre)
- [ ] T090 [US3] Weekly chart component'ine son 7 günün grafiğini göster (basit bar chart)
- [ ] T091 [US3] Streak display component'ine productivity streak göster (ardışık gün sayısı)
- [ ] T092 [US3] Statistics sayfasında günlük ilerlemeyi göster (4 Pomodoro hedefine göre progress bar)
- [ ] T093 [US3] Statistics sayfasında bir sonraki molaya kaç oturum kaldığını göster
- [ ] T094 [US3] Geçmiş oturumları liste halinde göster (tarih, süre, görev adı)
- [ ] T095 [US3] Geçmiş listesinde pagination veya infinite scroll ekle (performans için)

**Kontrol Noktası**: Bu noktada, Kullanıcı Hikayeleri 1, 2 VE 3 tamamen işlevsel ve bağımsız olarak test edilebilir olmalıdır

---

## Faz 6: Kullanıcı Hikayesi 4 - Görev Yönetimi (Öncelik: P3)

**Hedef**: Kullanıcı Pomodoro oturumları için görevler oluşturabilir, düzenleyebilir ve silebilir. Her görev Firebase'de saklanır ve oturumlarla ilişkilendirilir.

**Bağımsız Test**: Kullanıcı yeni görev oluşturur, görev listesini görüntüler, bir görevi bir oturuma atar, görevi tamamlandı olarak işaretler.

### Kullanıcı Hikayesi 4 İmplementasyonu

- [ ] T096 [P] [US4] TasksService'i oluştur src/app/features/tasks/services/tasks.service.ts
- [ ] T097 [US4] TasksService'e createTask() metodu ekle (Firestore addDoc)
- [ ] T098 [US4] TasksService'e getTasks() metodu ekle (completed == false, real-time listener)
- [ ] T099 [US4] TasksService'e getCompletedTasks() metodu ekle (completed == true)
- [ ] T100 [US4] TasksService'e updateTask() metodu ekle (title veya completed güncelle)
- [ ] T101 [US4] TasksService'e deleteTask() metodu ekle (Firestore delete + ilişkili session'ların taskId'sini null yap)
- [ ] T102 [US4] TasksService'e incrementPomodoroCount() metodu ekle (session tamamlandığında çağrılacak)
- [ ] T103 [P] [US4] Tasks container component oluştur src/app/features/tasks/tasks.component.ts
- [ ] T104 [P] [US4] Task list presentational component oluştur src/app/features/tasks/components/task-list/task-list.component.ts
- [ ] T105 [P] [US4] Task item presentational component oluştur src/app/features/tasks/components/task-item/task-item.component.ts
- [ ] T106 [P] [US4] Task form presentational component oluştur src/app/features/tasks/components/task-form/task-form.component.ts
- [ ] T107 [US4] Tasks routing'ini yapılandır (lazy loading)
- [ ] T108 [US4] Task form component'ine reactive form ekle (title validasyonu: 1-200 karakter)
- [ ] T109 [US4] Task item component'ine checkbox ekle (completed durumunu toggle et)
- [ ] T110 [US4] Task item component'ine edit modu ekle (inline editing)
- [ ] T111 [US4] Task item component'ine delete butonu ekle (confirmation dialog ile)
- [ ] T112 [US4] Task item component'ine Pomodoro count göster (tamamlanan Pomodoro sayısı)
- [ ] T113 [US4] Task list component'inde görevleri filtrele (aktif/tamamlanmış)
- [ ] T114 [US4] Home component'e görev seçimi dropdown ekle (session başlatırken görev seçilebilir)
- [ ] T115 [US4] Session oluşturulurken seçili görevin taskId'sini session'a ekle
- [ ] T116 [US4] Session tamamlandığında ilişkili görevin pomodoroCount'unu artır (incrementPomodoroCount)
- [ ] T117 [US4] Görev tamamlandı işaretlendiğinde completedAt timestamp'ini set et
- [ ] T118 [US4] Görev silme işleminde batch write kullan (task + ilişkili session'lar)
- [ ] T119 [US4] Optimistic UI update ekle (görev ekleme/silme/güncelleme anında UI'da göster)

**Kontrol Noktası**: Bu noktada, Kullanıcı Hikayeleri 1, 2, 3 VE 4 tamamen işlevsel ve bağımsız olarak test edilebilir olmalıdır

---

## Faz 7: Kullanıcı Hikayesi 5 - Zamanlayıcı Ayarları Özelleştirme (Öncelik: P3)

**Hedef**: Kullanıcı Focus ve Break zamanlayıcı sürelerini kişisel tercihlerine göre ayarlayabilir. Bu ayarlar Firebase'de saklanır ve tüm cihazlarda senkronize edilir.

**Bağımsız Test**: Kullanıcı ayarlar sayfasından Focus süresini 30 dakikaya değiştirir, yeni oturum başlatır ve özelleştirilmiş sürenin uygulandığını görür. Başka cihazdan giriş yapınca ayarlar senkronize olmuştur.

### Kullanıcı Hikayesi 5 İmplementasyonu

- [ ] T120 [P] [US5] SettingsService'i oluştur src/app/features/settings/services/settings.service.ts
- [ ] T121 [US5] SettingsService'e getSettings() metodu ekle (real-time listener, default settings ile merge)
- [ ] T122 [US5] SettingsService'e updateSettings() metodu ekle (Firestore setDoc with merge)
- [ ] T123 [US5] SettingsService'e DEFAULT_SETTINGS constant tanımla (focusDuration: 1500, breakDuration: 300)
- [ ] T124 [P] [US5] Settings container component oluştur src/app/features/settings/settings.component.ts
- [ ] T125 [P] [US5] Timer settings presentational component oluştur src/app/features/settings/components/timer-settings/timer-settings.component.ts
- [ ] T126 [P] [US5] General settings presentational component oluştur src/app/features/settings/components/general-settings/general-settings.component.ts
- [ ] T127 [US5] Settings routing'ini yapılandır (lazy loading)
- [ ] T128 [US5] Timer settings component'ine reactive form ekle (focusDuration, breakDuration validasyonu)
- [ ] T129 [US5] Timer settings form validasyonu: focusDuration 300-3600 saniye (5-60 dakika)
- [ ] T130 [US5] Timer settings form validasyonu: breakDuration 60-900 saniye (1-15 dakika)
- [ ] T131 [US5] General settings component'ine checkbox'lar ekle (soundEnabled, darkModeEnabled, autoStartEnabled)
- [ ] T132 [US5] Settings form'u kullanıcının mevcut ayarları ile initialize et
- [ ] T133 [US5] Settings form'u kaydedildiğinde Firebase'e kaydet (updateSettings)
- [ ] T134 [US5] Settings değişikliklerinde loading state göster
- [ ] T135 [US5] Settings başarıyla kaydedildiğinde success mesajı göster
- [ ] T136 [US5] TimerService'e settings değişikliklerini dinle ve timer konfigürasyonunu güncelle
- [ ] T137 [US5] Kullanıcı ilk giriş yaptığında default settings'i Firebase'e kaydet (initializeUserSettings)
- [ ] T138 [US5] Dark mode ayarına göre tema değiştir (Tailwind dark: class)
- [ ] T139 [US5] Sound enabled ayarına göre timer tamamlama sesini çal/çalma
- [ ] T140 [US5] Auto-start enabled ayarına göre Focus→Break→Focus otomatik geçiş

**Kontrol Noktası**: Tüm kullanıcı hikayeleri artık bağımsız olarak işlevsel olmalıdır

---

## Faz 8: Cilalama ve Çapraz Kesim İşlevleri

**Amaç**: Birden fazla kullanıcı hikayesini etkileyen iyileştirmeler

- [ ] T141 [P] App component'e navigation bar ekle (Home, Tasks, Statistics, Settings linkleri)
- [ ] T142 [P] Navigation bar'a kullanıcı email ve logout butonu ekle
- [ ] T143 [P] Navigation bar'da active route highlight et
- [ ] T144 [P] Responsive design kontrolü (mobile, tablet, desktop)
- [ ] T145 [P] Tüm component'lerde OnPush change detection strategy kullan
- [ ] T146 [P] Tüm Observable subscription'larında takeUntil pattern uygula (memory leak önleme)
- [ ] T147 [P] Loading state'leri tüm async işlemlerde göster
- [ ] T148 [P] Error boundary ve global error handling iyileştir
- [ ] T149 Accessibility kontrolleri yap (ARIA labels, keyboard navigation, focus management)
- [ ] T150 [P] Firestore Security Rules'u production için sıkılaştır
- [ ] T151 [P] Firestore indexes'leri test et ve optimize et
- [ ] T152 Bundle size analizi yap ve gerekirse lazy loading ekle
- [ ] T153 [P] Performance optimization: virtual scrolling görev listesinde (uzun listeler için)
- [ ] T154 [P] Performance optimization: ChangeDetectionStrategy.OnPush tüm component'lerde
- [ ] T155 [P] README.md dosyasını güncelle (kurulum, kullanım, test talimatları)
- [ ] T156 [P] quickstart.md doğrulaması yap (tüm adımları test et)

---

## Bağımlılıklar ve Yürütme Sırası

### Faz Bağımlılıkları

- **Kurulum (Faz 1)**: Bağımlılık yok - hemen başlanabilir
- **Temel Altyapı (Faz 2)**: Kurulum tamamlandıktan sonra - TÜM kullanıcı hikayelerini bloke eder
- **Kullanıcı Hikayeleri (Faz 3+)**: Tümü Temel Altyapı fazının tamamlanmasına bağlı
  - Kullanıcı hikayeleri daha sonra paralel ilerleyebilir (kadro varsa)
  - Veya öncelik sırasına göre sıralı (P1 → P2 → P3)
- **Cilalama (Son Faz)**: İstenen tüm kullanıcı hikayelerinin tamamlanmasına bağlı

### Kullanıcı Hikayesi Bağımlılıkları

- **Kullanıcı Hikayesi 1 (P1 - Authentication)**: Temel Altyapı'dan (Faz 2) sonra başlayabilir - Diğer hikayelere bağımlı değil
- **Kullanıcı Hikayesi 2 (P1 - Session Başlatma)**: US1 tamamlandıktan sonra (auth gerekli) - Bağımsız test edilebilir
- **Kullanıcı Hikayesi 3 (P2 - Session Tamamlama)**: US2 tamamlandıktan sonra (session başlatma gerekli) - Bağımsız test edilebilir
- **Kullanıcı Hikayesi 4 (P3 - Görev Yönetimi)**: US1 ve US2 tamamlandıktan sonra - US3'ten bağımsız
- **Kullanıcı Hikayesi 5 (P3 - Ayarlar)**: US1 ve US2 tamamlandıktan sonra - US3 ve US4'ten bağımsız

### Her Kullanıcı Hikayesi İçinde

- Modeller servislerden önce
- Servisler endpoint/component'lerden önce
- Çekirdek implementasyon entegrasyondan önce
- Hikaye tamamlanmadan sonraki önceliğe geçme

### Paralel Fırsatlar

- Kurulum fazındaki tüm [P] işaretli görevler paralel çalıştırılabilir
- Temel Altyapı fazındaki tüm [P] işaretli görevler paralel çalıştırılabilir (Faz 2 içinde)
- Temel Altyapı fazı tamamlandıktan sonra, tüm kullanıcı hikayeleri paralel başlayabilir (ekip kapasitesi izin verirse)
- Bir hikaye içinde [P] işaretli modeller paralel çalıştırılabilir
- Farklı kullanıcı hikayeleri farklı ekip üyeleri tarafından paralel çalışılabilir

---

## Paralel Örnek: Kullanıcı Hikayesi 2

```bash
# Kullanıcı Hikayesi 2 için tüm paralel görevleri birlikte başlat:
# Görev: T046 [P] [US2] TimerService'i oluştur
# Görev: T047 [P] [US2] SessionsService'i oluştur
# Görev: T051 [P] [US2] Timer display component oluştur
# Görev: T052 [P] [US2] Timer controls component oluştur
# Görev: T053 [P] [US2] Progress ring component oluştur
```

---

## İmplementasyon Stratejisi

### Önce MVP (Sadece Kullanıcı Hikayesi 1 ve 2)

1. Faz 1'i tamamla: Kurulum
2. Faz 2'yi tamamla: Temel Altyapı (KRİTİK - tüm hikayeleri bloke eder)
3. Faz 3'ü tamamla: Kullanıcı Hikayesi 1 (Authentication)
4. Faz 4'ü tamamla: Kullanıcı Hikayesi 2 (Session Başlatma)
5. **DUR VE DOĞRULA**: Kullanıcı Hikayeleri 1 ve 2'yi bağımsız test et
6. Hazırsa deploy/demo yap

### Artırımlı Teslimat

1. Kurulum + Temel Altyapı → Temel hazır
2. Kullanıcı Hikayesi 1 ekle → Bağımsız test et → Deploy/Demo (Authentication)
3. Kullanıcı Hikayesi 2 ekle → Bağımsız test et → Deploy/Demo (MVP - Session başlatma!)
4. Kullanıcı Hikayesi 3 ekle → Bağımsız test et → Deploy/Demo (Geçmiş ve istatistikler)
5. Kullanıcı Hikayesi 4 ekle → Bağımsız test et → Deploy/Demo (Görev yönetimi)
6. Kullanıcı Hikayesi 5 ekle → Bağımsız test et → Deploy/Demo (Ayarlar)
7. Her hikaye önceki hikayeleri bozmadan değer katar

### Paralel Ekip Stratejisi

Birden fazla geliştirici ile:

1. Ekip Kurulum + Temel Altyapı'yı birlikte tamamlar
2. Temel Altyapı tamamlandıktan sonra:
   - Geliştirici A: Kullanıcı Hikayesi 1 (Authentication)
   - Geliştirici B: Kullanıcı Hikayesi 2 (Session Başlatma) - US1 tamamlandıktan sonra
   - Geliştirici C: US1 ve US2 hazır olunca → Kullanıcı Hikayesi 4 (Görev Yönetimi)
   - Geliştirici D: US2 hazır olunca → Kullanıcı Hikayesi 3 (Session Tamamlama)
3. Hikayeler bağımsız olarak tamamlanır ve entegre edilir

---

## Notlar

- [P] görevler = farklı dosyalar, bağımlılık yok
- [Story] etiketi görevi belirli kullanıcı hikayesine bağlar (izlenebilirlik için)
- Her kullanıcı hikayesi bağımsız olarak tamamlanabilir ve test edilebilir olmalıdır
- Her görev veya mantıksal grup sonrası commit yapın
- Hikayeyi bağımsız doğrulamak için herhangi bir kontrol noktasında durun
- Kaçının: belirsiz görevler, aynı dosya çakışmaları, bağımsızlığı bozan çapraz hikaye bağımlılıkları

## Özet

- **Toplam görev sayısı**: 158 görev
- **Kullanıcı hikayesi başına görev sayısı**:
  - US1 (Authentication): 18 görev (T028-T045)
  - US2 (Session Başlatma): 26 görev (T046-T071)
  - US3 (Session Tamamlama & İstatistikler): 24 görev (T072-T095)
  - US4 (Görev Yönetimi): 24 görev (T096-T119)
  - US5 (Ayarlar): 21 görev (T120-T140)
  - Setup: 8 görev (T001-T008)
  - Foundational: 19 görev (T009-T027)
  - Polish: 18 görev (T141-T158)

- **Paralel fırsatlar**: 47 görev [P] işaretli (paralel çalıştırılabilir)
- **Önerilen MVP kapsamı**: US1 + US2 (Authentication + Session Başlatma)
- **Format validasyonu**: ✅ Tüm görevler checkbox, ID, [P]/[Story] etiketleri ve dosya yolları içermektedir
