# Research: Pomodoro Firebase Entegrasyonu

**Date**: 2025-10-21
**Feature**: Pomodoro Firebase Integration
**Branch**: `001-pomodoro-firebase-integration`

## Overview

Bu doküman, Pomodoro uygulamasının Angular ve Firebase ile implementasyonu için gerekli teknoloji kararlarını ve araştırma bulgularını içerir.

## Technology Decisions

### 1. Frontend Framework: Angular 17+

**Decision**: Angular 17+ (standalone components yaklaşımı ile)

**Rationale**:
- Kullanıcı tarafından belirtildi ("angular ile yazılacak")
- Tailwind CSS ile uyumlu (tasarımlarda kullanılmış)
- TypeScript native support
- Güçlü dependency injection
- RxJS ile reactive programming
- AngularFire ile Firebase native entegrasyon

**Alternatives Considered**:
- React: Daha hafif ama kullanıcı Angular tercih etti
- Vue: Kolay öğrenme eğrisi ama ekosistem daha küçük

### 2. Firebase Integration: AngularFire v17

**Decision**: @angular/fire v17+ (resmi Angular Firebase kütüphanesi)

**Rationale**:
- Angular ile native entegrasyon
- Observable-based API (RxJS uyumlu)
- Tree-shakeable (bundle size optimization)
- TypeScript support
- Offline persistence built-in
- Auth guards ve interceptors için utilities

**Alternatives Considered**:
- Firebase JS SDK direkt kullanımı: Daha fazla boilerplate kod gerektirir
- Custom wrappers: Maintenance yükü yüksek

### 3. State Management: RxJS + Angular Services

**Decision**: Service-based state management with RxJS BehaviorSubjects

**Rationale**:
- Angular built-in yaklaşım
- Gereksiz karmaşıklık eklemiyor
- Firebase'den gelen Observable streams ile uyumlu
- Bu uygulama için yeterli (orta ölçekli state)

**Alternatives Considered**:
- NgRx/NGRX Signal Store: Over-engineering, bu uygulamada gerekli değil
- Akita: Ek dependency, learning curve
- Signals (Angular 17+): Henüz yeterince mature değil Firebase integration için

### 4. UI Styling: Tailwind CSS v3

**Decision**: Tailwind CSS v3+ (tasarımlarda kullanılmış)

**Rationale**:
- Tasarım dosyalarında zaten kullanılmış
- Utility-first approach (hızlı development)
- PurgeCSS ile küçük bundle size
- Dark mode support built-in
- Responsive design kolaylığı

**Alternatives Considered**:
- Angular Material: Tasarımlar custom, Material'e uymaz
- Bootstrap: Daha ağır, tasarımlara uymaz
- Custom CSS: Zaman alıcı, sürdürülebilirlik düşük

### 5. Offline Strategy: Firestore Offline Persistence

**Decision**: Firestore SDK'nın offline persistence özelliği + LocalStorage for settings

**Rationale**:
- Built-in IndexedDB kullanımı
- Otomatik senkronizasyon
- Conflict resolution otomatik
- AngularFire ile entegre
- Minimal kod, maksimum functionality

**Implementation**:
```typescript
import { initializeApp } from '@angular/fire/app';
import { getFirestore, enableIndexedDbPersistence } from '@angular/fire/firestore';

// app.config.ts içinde
enableIndexedDbPersistence(firestore)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
    } else if (err.code == 'unimplemented') {
      // The current browser doesn't support persistence
    }
  });
```

**Alternatives Considered**:
- Custom IndexedDB implementation: Çok fazla kod, hata riski
- LocalStorage only: Kapasite limiti (5-10MB), complex data için uygun değil
- Service Workers with Cache API: Over-engineering, offline persistence için gerekli değil

### 6. Timer Implementation: RxJS interval + Service

**Decision**: Custom TimerService with RxJS interval operator

**Rationale**:
- Hassas timer control (±1 saniye)
- Pause/resume functionality
- Observable streams (UI reactive updates)
- Background tab handling (Page Visibility API)

**Implementation Approach**:
```typescript
@Injectable({ providedIn: 'root' })
export class TimerService {
  private timerState$ = new BehaviorSubject<TimerState>({
    secondsRemaining: 1500, // 25 minutes
    isRunning: false,
    mode: 'focus'
  });

  private timerSubscription?: Subscription;

  start() {
    this.timerSubscription = interval(1000)
      .pipe(
        takeWhile(() => this.timerState$.value.secondsRemaining > 0),
        tap(() => this.tick())
      )
      .subscribe();
  }

  private tick() {
    const current = this.timerState$.value;
    this.timerState$.next({
      ...current,
      secondsRemaining: current.secondsRemaining - 1
    });
  }
}
```

**Alternatives Considered**:
- setTimeout/setInterval: RxJS interval daha güvenilir, cancellable
- Web Workers: Over-engineering, simple timer için gerekli değil
- requestAnimationFrame: Saniye hassasiyeti için gerekli değil

### 7. Testing Strategy

**Decision**:
- Unit tests: Jasmine + Karma (Angular default)
- E2E tests: Cypress
- Firebase: Emulator Suite for local testing

**Rationale**:
- Jasmine/Karma: Angular ekosisteminde standard
- Cypress: Modern, reliable, good DX
- Firebase Emulator: Gerçek Firebase'e ihtiyaç olmadan test

**Key Test Areas**:
1. Auth flow (login, signup, logout)
2. Timer accuracy (±1 saniye kontrol)
3. Firestore CRUD operations
4. Offline sync behavior
5. Statistics calculations

### 8. Form Handling: Reactive Forms

**Decision**: Angular Reactive Forms (@angular/forms)

**Rationale**:
- Type-safe
- Better validation control
- Easier testing
- RxJS integration
- Dynamic form building

**Example**:
```typescript
this.loginForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]]
});
```

**Alternatives Considered**:
- Template-driven forms: Daha az kontrol, test zorluğu
- Third-party form libraries: Gereksiz dependency

### 9. Change Detection: OnPush Strategy

**Decision**: ChangeDetectionStrategy.OnPush for all components

**Rationale**:
- Performance optimization
- Predictable change detection
- Forces immutable patterns
- Works well with Observables

**Implementation**:
```typescript
@Component({
  selector: 'app-timer-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

### 10. Bundle Optimization

**Decision**:
- Standalone components (tree-shakeable)
- Lazy loading for routes
- TailwindCSS PurgeCSS
- Firebase modular SDK

**Expected Bundle Size**: < 500KB (gzipped)

**Strategies**:
1. Code splitting by route
2. Defer loading non-critical features
3. Use async pipes (no manual subscriptions)
4. Import only needed Firebase services

## Security Considerations

### Firestore Security Rules

**Approach**: User-specific data isolation

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Sessions belong to users
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Tasks belong to users
    match /tasks/{taskId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### Authentication Flow

**Strategy**: Route guards + auth service

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    map(user => {
      if (user) {
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    })
  );
};
```

## Performance Optimizations

1. **Lazy Loading**: Routes lazy loaded by feature
2. **OnPush Change Detection**: All components use OnPush
3. **Virtual Scrolling**: For long task lists (if needed)
4. **Firebase Query Limits**: Paginate large result sets
5. **Unsubscribe Management**: Use takeUntil pattern or async pipe
6. **Image Optimization**: Use WebP format, lazy loading

## Development Workflow

### Setup Steps:
1. Install Angular CLI: `npm install -g @angular/cli`
2. Create project: `ng new pomodoro-app --standalone`
3. Add Firebase: `ng add @angular/fire`
4. Add Tailwind: `npm install -D tailwindcss postcss autoprefixer`
5. Configure environment files with Firebase config

### Local Development:
```bash
# Start Firebase emulators
firebase emulators:start

# Start Angular dev server
ng serve

# Run tests
ng test                  # Unit tests
ng e2e                   # E2E tests
```

## Open Questions & Future Research

1. **Progressive Web App (PWA)**:
   - Consider adding PWA support for offline mode
   - Service worker for caching
   - Add to homescreen capability

2. **Accessibility**:
   - Ensure WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - Focus management

3. **Analytics**:
   - Firebase Analytics integration
   - User behavior tracking
   - Performance monitoring

4. **Internationalization**:
   - Currently Turkish only
   - Consider i18n for future (Angular i18n package)

## References

- [Angular Documentation](https://angular.io/docs)
- [AngularFire Documentation](https://github.com/angular/angularfire)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [RxJS Documentation](https://rxjs.dev/)
- [Angular Performance Guide](https://angular.io/guide/performance-best-practices)

