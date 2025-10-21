<!--
Sync Impact Report:
- Version change: Template → 1.0.0 (Initial constitution)
- New principles added: 5 core principles
- Templates status:
  ✅ plan-template.md - Constitution principles align with planning requirements
  ✅ spec-template.md - Specification structure follows constitution
  ✅ tasks-template.md - Task categorization reflects principles
  ⚠ commands/*.md - Pending review for generic vs agent-specific guidance
- Follow-up TODOs: None
-->

# Pomodoro Timer Constitution

## Core Principles

### I. Firebase-First Architecture
Tüm veri yönetimi Firebase servisleri üzerinden yapılmalıdır:
- **Firestore**: Tüm kullanıcı verileri (tasks, sessions, settings) Firestore'da subcollection yapısıyla saklanır
- **Authentication**: Firebase Auth ile email/password kimlik doğrulama zorunludur
- **Offline Support**: Firestore offline persistence ve Auth local persistence aktif olmalıdır
- **Security Rules**: Tüm Firestore collections'lar user-scoped olmalı (`users/{userId}/...`)

**Rationale**: Firebase entegrasyonu projenin temel gereksinimidir. Kullanıcı verileri güvenliği ve offline çalışabilirlik kritik öneme sahiptir.

### II. TypeScript Strict Mode & Type Safety
TypeScript strict mode aktif olmalı, tüm kod tip güvenli olmalıdır:
- Interface ve model tanımları zorunludur (User, Task, PomodoroSession, Settings, Statistics)
- `any` kullanımı yasaktır (gerekli durumlarda `unknown` tercih edilir)
- Firestore Timestamp tipleri doğru şekilde handle edilmelidir
- RxJS Observable'lar için tip tanımları eksiksiz olmalıdır

**Rationale**: Tip güvenliği runtime hatalarını önler, refactoring sürecini güvenli hale getirir ve kod kalitesini artırır.

### III. Component Isolation & Standalone Architecture
Angular 20+ standalone component mimarisi kullanılmalıdır:
- Tüm component'ler standalone olmalıdır
- NgModule kullanımı yasaktır
- Service'ler `providedIn: 'root'` ile singleton olmalıdır
- Dependency Injection constructor-based değil `inject()` function kullanmalıdır (injection context hataları önlemek için constructor içinde çağrılmalı)
- Her feature kendi dizininde izole edilmelidir (auth, home, tasks, history, statistics, settings)

**Rationale**: Modern Angular mimarisi, daha iyi tree-shaking, daha az boilerplate ve daha temiz kod sağlar.

### IV. Dark Mode & Accessibility
Tüm UI component'leri dark mode uyumlu ve erişilebilir olmalıdır:
- Tailwind CSS dark mode classes zorunludur (`dark:` prefix)
- Hardcoded renkler yasaktır, semantic color tokens kullanılmalıdır
- ARIA attributes gerektiğinde eklenmelidir
- Klavye navigasyonu desteklenmelidir
- Responsive tasarım zorunludur (mobile-first approach)

**Rationale**: Kullanıcı deneyimi ve erişilebilirlik modern web uygulamalarının temel gereksinimlerindendir.

### V. Deterministic State & Change Detection
Angular change detection hataları önlenmelidir:
- Component method'ları deterministic olmalıdır (her çağrıda aynı sonucu vermeli)
- `Math.random()` gibi non-deterministic fonksiyonlar template'lerde kullanılmamalıdır
- State değişiklikleri async pipe veya manuel change detection ile yönetilmelidir
- ExpressionChangedAfterItHasBeenCheckedError hatası kabul edilemez

**Rationale**: Angular'ın change detection mekanizması deterministik kod gerektirir. Random değerler production'da kritik hatalara yol açar.

## Development Standards

### Code Quality
- **Linting**: ESLint kurallarına uyum zorunludur
- **Formatting**: Prettier ile otomatik formatlama (100 char limit)
- **Turkish Language**: Tüm UI metinleri, değişken isimleri ve komutlar Türkçe olmalıdır
- **Console Logging**: Production'a debug log'ları bırakılmamalıdır
- **Error Handling**: Tüm async işlemler try-catch ile korunmalıdır

### Firebase Best Practices
- **Composite Indexes**: Gerekli tüm Firestore composite index'leri `firestore.indexes.json`'da tanımlanmalıdır
- **Query Optimization**: Gereksiz field'lar query'lere dahil edilmemelidir
- **Batch Operations**: Çoklu write işlemleri batch veya transaction kullanmalıdır
- **Security**: Client-side validation server-side security rules'ı replace etmemelidir

### Testing Strategy
- **Unit Tests**: Tüm service'ler için unit test yazılmalıdır
- **Integration Tests**: Firebase entegrasyon testleri emulator kullanmalıdır
- **E2E Tests**: Kritik user flow'lar için e2e test coverage'ı sağlanmalıdır

## Governance

### Constitution Authority
Bu constitution tüm development practice'lerini override eder. PR review'ları ve feature implementation'ları bu prensiplere uygunluk açısından kontrol edilmelidir.

### Amendment Process
Constitution değişiklikleri için:
1. Değişiklik önerisi documentation'da belgelenmeli
2. Version bump rationale açıkça belirtilmeli (MAJOR/MINOR/PATCH)
3. Etkilenen template ve guidance dosyaları güncellenmeli
4. Migration plan gerekiyorsa hazırlanmalı

### Compliance & Review
- Tüm PR'lar constitution compliance kontrolünden geçmelidir
- Principle ihlalleri blocking issue olarak işaretlenmelidir
- Complexity artışı mutlaka justify edilmelidir
- CLAUDE.md dosyası runtime development guidance için kullanılmalıdır

**Version**: 1.0.0 | **Ratified**: 2025-10-21 | **Last Amended**: 2025-10-21
