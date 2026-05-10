import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpEvent, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);
  const token       = authService.getToken();

  // Clone request and attach Bearer token if available
  let authReq = req;
  if (token && !req.url.includes('/auth/refresh')) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  ) as Observable<HttpEvent<unknown>>;
};

function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService, router: Router): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        refreshTokenSubject.next(response.accessToken);
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${response.accessToken}` } }));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        router.navigate(['/auth/login']);
        return throwError(() => err);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(jwt => {
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${jwt}` } }));
      })
    );
  }
}
