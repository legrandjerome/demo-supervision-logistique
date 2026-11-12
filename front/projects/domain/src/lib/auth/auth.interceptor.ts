import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from './auth.store';

const LOGIN_URL = '/api/login';

/** Ajoute le jeton aux appels API et ferme la session si l'API le refuse. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const token = store.token();
  const isApiCall = req.url.startsWith('/api/') && req.url !== LOGIN_URL;

  const request =
    token && isApiCall ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      const expired =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiCall &&
        store.isAuthenticated();
      if (expired) {
        store.logout();
        void router.navigate(['/connexion']);
      }
      return throwError(() => error);
    }),
  );
};
