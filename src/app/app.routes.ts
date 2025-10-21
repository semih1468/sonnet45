// T018: Ana Routing Yapılandırması
// T044: Auth Guard uygulandı
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/components/signup/signup').then(m => m.SignupComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then(m => m.HomeComponent),
    canActivate: [authGuard] // T044: Korumalı route
  },
  {
    path: 'tasks',
    loadComponent: () => import('./features/tasks/tasks').then(m => m.TasksComponent),
    canActivate: [authGuard] // T044: Korumalı route
  },
  {
    path: 'history',
    loadComponent: () => import('./features/history/history').then(m => m.HistoryComponent),
    canActivate: [authGuard] // T072: Session history sayfası
  },
  {
    path: 'statistics',
    loadComponent: () => import('./features/statistics/statistics').then(m => m.StatisticsComponent),
    canActivate: [authGuard] // T044: Korumalı route
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent),
    canActivate: [authGuard] // T044: Korumalı route
  },
  {
    path: 'how-to-use',
    loadComponent: () => import('./features/how-to-use/how-to-use').then(m => m.HowToUseComponent),
    canActivate: [authGuard] // Korumalı route
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard] // Korumalı route
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
