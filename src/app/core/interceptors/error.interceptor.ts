// T017: Error Interceptor
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Bir hata oluştu';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Hata: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = `Sunucu Hatası: ${error.status}\nMesaj: ${error.message}`;
      }

      // Log error for debugging
      console.error('HTTP Error:', errorMessage);

      // Return observable with error message
      return throwError(() => new Error(errorMessage));
    })
  );
};
