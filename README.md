# Pomodoro Timer with Firebase Integration

Modern, Firebase-destekli bir Pomodoro zamanlayıcı uygulaması. Angular 20 ve Tailwind CSS ile geliştirilmiştir.

## 🚀 Özellikler

### ✅ Tamamlanan Özellikler (Phase 1-8)

#### 🔐 Kimlik Doğrulama (Phase 1-2)
- Firebase Authentication ile email/password girişi
- Kullanıcı kaydı (signup) ve giriş (login)
- Auth Guard ile korumalı sayfalar
- Otomatik oturum yönetimi

#### ⏱️ Pomodoro Zamanlayıcı (Phase 3-4)
- Çalışma, kısa mola ve uzun mola seansları
- Gerçek zamanlı sayaç gösterimi
- Başlat/Duraklat/Durdur kontrolleri
- Ses ve görsel bildirimler
- Session tracking ve Firebase'e kaydetme

#### 📊 İstatistikler (Phase 8)
- Günlük tamamlanan pomodoro sayısı
- Haftalık ve aylık istatistikler
- Grafik gösterimi (bar chart)
- Streak (seri) takibi
- Günlük hedef progress göstergesi

#### 📝 Görev Yönetimi (Phase 6)
- Görev oluşturma, düzenleme, silme
- Öncelik seviyeleri (Düşük, Orta, Yüksek)
- Görev tamamlama durumu
- Firebase Firestore entegrasyonu

#### 📜 Geçmiş (Phase 5)
- Tüm pomodoro seansları geçmişi
- Filtrele: Bugün, Bu Hafta, Bu Ay, Tümü
- Session detayları görüntüleme
- Tarih bazlı arama

#### ⚙️ Ayarlar (Phase 7)
- Özelleştirilebilir çalışma süresi (5-60 dk)
- Kısa mola süresi (1-15 dk)
- Uzun mola süresi (5-30 dk)
- Uzun mola aralığı (2-10 pomodoro)
- Günlük hedef ayarı (1-20 pomodoro)
- Otomatik başlatma seçenekleri
- Bildirim ve ses ayarları
- Karanlık mod desteği

## 🛠️ Teknolojiler

- **Frontend Framework**: Angular 20.3.0
- **UI Framework**: Tailwind CSS 3.4.1
- **Backend**: Firebase (Authentication, Firestore)
- **Language**: TypeScript 5.9.2
- **State Management**: RxJS 7.8.0
- **Icons**: Heroicons (SVG)

## 📋 Gereksinimler

- Node.js 18.x veya üzeri
- npm 9.x veya üzeri
- Firebase projesi (Authentication ve Firestore aktif)

## 🔧 Kurulum

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd sonnet45
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Firebase Yapılandırması

#### Firebase Projesi Oluşturma
1. [Firebase Console](https://console.firebase.google.com/) 'a gidin
2. Yeni proje oluşturun
3. Authentication'ı etkinleştirin ve Email/Password provider'ı aktifleştirin
4. Firestore Database oluşturun (production mode)

#### Firebase Config Dosyası
`src/environments/environment.ts` dosyasını oluşturun:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};
```

Firebase Console'dan projenizin config değerlerini kopyalayın.

### 4. Development Server'ı Başlatın
```bash
npm start
```

Tarayıcınızda `http://localhost:4200/` adresine gidin.

## 🏗️ Build

Production build için:
```bash
npm run build
```

Build dosyaları `dist/` dizininde oluşturulacaktır.

## 📂 Proje Yapısı

```
src/
├── app/
│   ├── core/                 # Core modüller
│   │   ├── guards/          # Route guards (auth)
│   │   ├── models/          # Data modelleri (TypeScript interfaces)
│   │   └── services/        # Servisler (Auth, Timer, Task, Statistics, vb.)
│   ├── features/            # Feature modülleri
│   │   ├── auth/           # Login & Signup
│   │   ├── home/           # Ana sayfa (Timer)
│   │   ├── tasks/          # Görev yönetimi
│   │   ├── history/        # Session geçmişi
│   │   ├── statistics/     # İstatistikler
│   │   └── settings/       # Ayarlar
│   └── shared/             # Paylaşılan componentler ve pipes
└── environments/           # Environment konfigürasyonları
```

## 🔥 Firestore Veri Yapısı

### Collections

#### `users/{userId}`
```typescript
{
  uid: string;
  email: string;
  createdAt: Timestamp;
}
```

#### `sessions/{sessionId}`
```typescript
{
  userId: string;
  taskId: string | null;
  startTime: Timestamp;
  endTime: Timestamp | null;
  duration: number;          // seconds
  status: 'active' | 'completed' | 'cancelled';
  completedAt: Timestamp | null;
  notes: string | null;
}
```

#### `tasks/{taskId}`
```typescript
{
  userId: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `settings/{userId}`
```typescript
{
  userId: string;
  workDuration: number;                // minutes
  shortBreakDuration: number;          // minutes
  longBreakDuration: number;           // minutes
  longBreakInterval: number;           // pomodoro count
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number;                 // 0-100
  darkMode: boolean;
  dailyGoal: number;                   // pomodoro count
  updatedAt: Timestamp;
}
```

## 🎯 Kullanım

### 1. Hesap Oluşturma
- Uygulamayı açın
- "Kayıt Ol" butonuna tıklayın
- Email ve şifre bilgilerinizi girin

### 2. Pomodoro Başlatma
- Ana sayfada "Başlat" butonuna tıklayın
- 25 dakikalık çalışma seansı başlar
- Süre bittiğinde bildirim alırsınız
- 4 pomodoro sonrası otomatik uzun mola

### 3. Görev Ekleme
- "Görevler" sayfasına gidin
- "+" butonuna tıklayın
- Görev bilgilerini girin

### 4. İstatistikleri İnceleme
- "İstatistikler" sayfasına gidin
- Günlük, haftalık ve aylık verilerinizi görün

## ⚙️ Konfigürasyon

### Varsayılan Ayarlar
- **Çalışma Süresi**: 25 dakika
- **Kısa Mola**: 5 dakika
- **Uzun Mola**: 15 dakika
- **Uzun Mola Aralığı**: 4 pomodoro
- **Günlük Hedef**: 8 pomodoro

Tüm ayarlar "Ayarlar" sayfasından özelleştirilebilir.

## 👨‍💻 Geliştirici

Proje, Specify framework ve Claude Code kullanılarak geliştirilmiştir.

---

**Not**: Bu uygulama Firebase'in ücretsiz planını kullanmaktadır. Yoğun kullanımda limitleri aşabilirsiniz.
