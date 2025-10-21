# Quickstart Guide: Pomodoro Firebase Integration

**Feature**: Pomodoro Firebase Integration
**Date**: 2025-10-21
**Branch**: `001-pomodoro-firebase-integration`

## Prerequisites

### Required Software

1. **Node.js**: v18.x veya üzeri
   ```bash
   node --version  # v18.13.0 veya üzeri
   ```

2. **npm**: v9.x veya üzeri (Node.js ile birlikte gelir)
   ```bash
   npm --version   # v9.0.0 veya üzeri
   ```

3. **Angular CLI**: v17.x
   ```bash
   npm install -g @angular/cli@latest
   ng version
   ```

4. **Firebase CLI**: v12.x veya üzeri
   ```bash
   npm install -g firebase-tools
   firebase --version
   ```

5. **Git**: Versiyon kontrol için
   ```bash
   git --version
   ```

### Firebase Account Setup

1. [Firebase Console](https://console.firebase.google.com/) adresinde hesap oluşturun
2. Yeni proje oluşturun: "Pomodoro App"
3. Authentication'ı aktif edin:
   - Authentication > Sign-in method
   - Email/Password provider'ı enable edin
4. Firestore veritabanını oluşturun:
   - Firestore Database > Create database
   - Test mode veya Production mode seçin (Security Rules'u sonra ekleyeceğiz)
   - Bölge: `europe-west1` (veya size en yakın)

## Project Initialization

### 1. Create Angular Project

```bash
# Proje klasörünü oluştur
ng new pomodoro-app --standalone --routing --style=scss

# Klasöre gir
cd pomodoro-app
```

Seçenekler:
- `--standalone`: Standalone components kullan (Angular 17+ best practice)
- `--routing`: Routing modülünü dahil et
- `--style=scss`: SCSS kullan (Tailwind için gerekli)

### 2. Install Dependencies

#### Core Dependencies

```bash
# AngularFire (Firebase için resmi Angular library)
ng add @angular/fire

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init

# RxJS (Angular ile birlikte gelir ama güncel olduğundan emin ol)
npm install rxjs@^7.8.0
```

#### Development Dependencies

```bash
# Testing
npm install -D @angular-devkit/build-angular
npm install -D karma karma-jasmine karma-chrome-launcher

# E2E Testing (Cypress)
npm install -D cypress
npx cypress open  # İlk kurulum için
```

### 3. Configure Tailwind CSS

**`tailwind.config.js`**:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        }
      }
    },
  },
  plugins: [],
}
```

**`src/styles.scss`**:
```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Global styles */
body {
  @apply bg-gray-50 text-gray-900;
  font-family: 'Inter', sans-serif;
}
```

### 4. Configure Firebase

#### Get Firebase Config

1. Firebase Console > Project Settings > General
2. "Your apps" bölümünde Web app ekle
3. Config objesini kopyala:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
  }
};
```

#### Create Environment Files

**`src/environments/environment.ts`**:
```typescript
export const environment = {
  production: false,
  firebase: {
    // Development Firebase config
    apiKey: "YOUR_DEV_API_KEY",
    authDomain: "your-app-dev.firebaseapp.com",
    projectId: "your-project-dev",
    storageBucket: "your-app-dev.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
  }
};
```

**`src/environments/environment.prod.ts`**:
```typescript
export const environment = {
  production: true,
  firebase: {
    // Production Firebase config
    apiKey: "YOUR_PROD_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "987654321",
    appId: "1:987654321:web:fedcba"
  }
};
```

#### Configure AngularFire

**`src/app/app.config.ts`**:
```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore, enableIndexedDbPersistence } from '@angular/fire/firestore';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => {
      const firestore = getFirestore();

      // Enable offline persistence
      enableIndexedDbPersistence(firestore)
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
          } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support offline persistence.');
          }
        });

      return firestore;
    })
  ]
};
```

### 5. Setup Firebase Security Rules

**`firestore.rules`**:
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false;

      // Subcollections
      match /{document=**} {
        allow read, write: if isOwner(userId);
      }
    }

    // Deny all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**`firestore.indexes.json`**:
```json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "completed", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### 6. Initialize Firebase in Project

```bash
# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select:
# - Firestore: Deploy rules and create indexes
# - Hosting: (optional) Configure hosting
# - Emulators: Set up emulators for local development

# Select your Firebase project from list
```

**`.firebaserc`** (created by firebase init):
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

**`firebase.json`**:
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist/pomodoro-app/browser",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### 7. Create Initial Project Structure

```bash
# Core folders
mkdir -p src/app/core/{guards,services,models,interceptors}

# Feature folders
mkdir -p src/app/features/{auth,home,tasks,statistics,settings}/components

# Shared folder
mkdir -p src/app/shared/{components,pipes,utils}

# Assets
mkdir -p src/assets/icons
```

### 8. Create Core Models

**`src/app/core/models/user.model.ts`**:
```typescript
export interface User {
  uid: string;
  email: string;
  createdAt: Date;
  lastLoginAt: Date;
}
```

**`src/app/core/models/session.model.ts`**:
```typescript
export type SessionStatus = 'active' | 'completed' | 'cancelled';

export interface PomodoroSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  status: SessionStatus;
  taskId: string | null;
  createdAt: Date;
}
```

## Running the Application

### Development Server

```bash
# Start Angular dev server
ng serve

# Application will be available at:
# http://localhost:4200
```

Server options:
```bash
# Open browser automatically
ng serve --open

# Custom port
ng serve --port 4300

# Production mode
ng serve --configuration production
```

### Firebase Emulators (Local Development)

```bash
# Start Firebase emulators
firebase emulators:start

# Emulator UI will be available at:
# http://localhost:4000

# Auth Emulator: http://localhost:9099
# Firestore Emulator: http://localhost:8080
```

**Using emulators in development**:

Update `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  useEmulators: true,  // Add this flag
  firebase: {
    // ... config
  }
};
```

Update `src/app/app.config.ts`:
```typescript
import { connectAuthEmulator } from '@angular/fire/auth';
import { connectFirestoreEmulator } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    provideAuth(() => {
      const auth = getAuth();
      if (environment.useEmulators) {
        connectAuthEmulator(auth, 'http://localhost:9099');
      }
      return auth;
    }),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
      }
      return firestore;
    })
  ]
};
```

## Testing

### Unit Tests

```bash
# Run all unit tests
ng test

# Run tests once (CI mode)
ng test --watch=false --browsers=ChromeHeadless

# Run specific test file
ng test --include='**/auth.service.spec.ts'

# Code coverage
ng test --code-coverage
# Coverage report: coverage/index.html
```

### E2E Tests (Cypress)

```bash
# Open Cypress Test Runner
npx cypress open

# Run headless
npx cypress run

# Run specific spec
npx cypress run --spec "cypress/e2e/auth-flow.cy.ts"
```

### Firebase Emulator Tests

```bash
# Start emulators with test data
firebase emulators:start --import=./test-data

# Export emulator data after tests
firebase emulators:export ./test-data
```

## Building for Production

```bash
# Build production bundle
ng build --configuration production

# Output directory: dist/pomodoro-app/

# Analyze bundle size
ng build --configuration production --stats-json
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer dist/pomodoro-app/stats.json
```

## Deployment

### Firebase Hosting

```bash
# Build production bundle
ng build --configuration production

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Security Rules
firebase deploy --only firestore:rules

# Deploy everything
firebase deploy
```

### Deploy to Custom Server

```bash
# Build
ng build --configuration production

# Copy dist/pomodoro-app/* to your server
# Ensure server redirects all routes to index.html (for SPA routing)
```

## Common Commands

```bash
# Development
ng serve                          # Start dev server
firebase emulators:start          # Start Firebase emulators
ng test                           # Run unit tests
npx cypress open                  # Open E2E test runner

# Code Generation
ng generate component features/auth/login    # Generate component
ng generate service core/services/auth       # Generate service
ng generate guard core/guards/auth           # Generate guard
ng generate pipe shared/pipes/duration       # Generate pipe

# Building
ng build                          # Development build
ng build --configuration production  # Production build

# Deployment
firebase deploy                   # Deploy to Firebase
firebase deploy --only hosting    # Deploy only hosting
firebase deploy --only firestore:rules  # Deploy only rules

# Maintenance
npm outdated                      # Check outdated packages
npm update                        # Update packages
ng update                         # Update Angular packages
ng update @angular/cli @angular/core  # Update Angular CLI and Core
```

## Environment Variables

Create `.env` file (add to `.gitignore`):

```bash
# Firebase Config (for local development)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
```

**Note**: Angular doesn't support `.env` by default. Use `environment.ts` files instead, or use a package like `dotenv` with custom webpack config.

## Troubleshooting

### Issue: Firebase connection errors

**Symptom**: `FirebaseError: Permission denied`

**Solution**:
1. Check authentication status
2. Verify security rules in Firebase Console
3. Ensure user is logged in
4. Check Firestore rules in `firestore.rules`

### Issue: Emulator connection refused

**Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:8080`

**Solution**:
1. Start emulators: `firebase emulators:start`
2. Check emulator ports in `firebase.json`
3. Verify `connectFirestoreEmulator` is called correctly

### Issue: Build errors with Tailwind

**Symptom**: Tailwind classes not applied

**Solution**:
1. Verify `tailwind.config.js` content paths
2. Check `@tailwind` directives in `styles.scss`
3. Restart dev server: `ng serve`

### Issue: Tests failing with Firebase

**Symptom**: Tests timeout or fail with Firebase errors

**Solution**:
1. Use Firebase emulators for tests
2. Mock Firebase services in unit tests
3. Check test configuration in `karma.conf.js`

### Issue: Offline persistence not working

**Symptom**: Data not available offline

**Solution**:
1. Check browser support (IndexedDB required)
2. Verify `enableIndexedDbPersistence()` is called
3. Only one tab can enable persistence at a time
4. Check browser console for errors

## Next Steps

1. **Read the specification**: `specs/001-pomodoro-firebase-integration/spec.md`
2. **Review data model**: `specs/001-pomodoro-firebase-integration/data-model.md`
3. **Check contracts**: `specs/001-pomodoro-firebase-integration/contracts/`
4. **Start with authentication**: Implement login/signup flow first
5. **Follow tasks**: When available, see `specs/001-pomodoro-firebase-integration/tasks.md`

## Useful Resources

- [Angular Documentation](https://angular.io/docs)
- [AngularFire Documentation](https://github.com/angular/angularfire)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [RxJS Documentation](https://rxjs.dev/)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)

## Support

For issues or questions:
1. Check this quickstart guide
2. Review specification and contracts
3. Consult Angular/Firebase documentation
4. Check Firebase Console for errors
5. Review browser console logs
