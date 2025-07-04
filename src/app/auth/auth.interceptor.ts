import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.services';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    const isProtectedEndpoint = req.url.includes('/users') ||
      req.url.includes('/auth/me') ||
      req.url.includes('/feedback/') ||
      req.url.includes('/courses/');

    if (token && isProtectedEndpoint) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(cloned).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 403 || error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login'], { queryParams: { sessionExpired: true } });
            return throwError(() => new Error('Session expired or access denied. Please log in.'));
          }
          return throwError(() => error);
        })
      );
    }

    return next.handle(req);
  }
}