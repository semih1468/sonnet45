// T029: Auth Guard
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, switchMap, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Auth initialized olana kadar bekle, sonra user state'i kontrol et
  return authService.authInitialized$.pipe(
    filter(initialized => initialized), // Auth initialize olana kadar bekle
    take(1),
    switchMap(() => authService.user$),
    take(1),
    map(user => {
      if (user) {
        return true;
      } else {
        // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
    })
  );
};
