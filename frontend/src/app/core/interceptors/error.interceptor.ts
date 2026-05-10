import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        if (error.status === 401) {
            // Handled by AuthInterceptor for token refresh, 
            // but if refresh also fails, we might want to show a message.
            if (req.url.includes('/refresh')) {
                errorMessage = 'Session expired. Please login again.';
            } else {
                return throwError(() => error);
            }
        } else if (error.status === 403) {
          errorMessage = error.error?.message || 'Access denied. You do not have permission.';
        } else if (error.status === 404) {
          errorMessage = 'Resource not found.';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid request.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = error.error?.message || errorMessage;
        }
      }

      snackBar.open(errorMessage, 'Close', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });

      return throwError(() => error);
    })
  );
};
