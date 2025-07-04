import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { UserRole } from '../enums/user-role.enum';
import { AppState } from '../store/app.state';
import { clearRole, setRole, setUserDetails } from '../store/auth/auth.actions';

export interface UserDetails {
  id: number;
  email: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '${environment.apiUrl}';
  private authStateSubject = new BehaviorSubject<boolean>(this.isLoggedIn());

  constructor(
    private http: HttpClient,
    private store: Store<AppState>
  ) {
    window.addEventListener('storage', (event) => {
      if (event.key === 'token') {
        this.authStateSubject.next(this.isLoggedIn());
      }
    });
  }

  isAuthenticated$(): Observable<boolean> {
    return this.authStateSubject.asObservable().pipe(
      map(() => this.isLoggedIn()),
    );
  }

  private isValidToken(token: string | null): boolean {
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      JSON.parse(atob(parts[1])); 
      return true;
    } catch (e) {
      console.error('Invalid token format:', e);
      return false;
    }
  }

  private decodeToken(token: string): any {
    if (!this.isValidToken(token)) {
      console.error('Invalid token format');
      return {};
    }
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (e) {
      console.error('Error decoding JWT token:', e);
      return {};
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUsername(): string {
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      return decoded?.username || decoded?.sub || '';
    }
    return '';
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getUserId(): Observable<number> {
    return this.isAuthenticated$().pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          return of(0);
        }
        return this.http.get<{ id: number }>(`${this.apiUrl}/user/me`, { headers: this.getHeaders() }).pipe(
          map(response => response.id || 0),
          catchError(error => {
            console.error('Error fetching userId:', error);
            return of(0);
          })
        );
      })
    );
  }

  isAdmin(): boolean {
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      const rawRole = decoded?.role || decoded?.authorities || 'USER';
      const normalizedRole = (typeof rawRole === 'string' ? rawRole : rawRole[0] || 'USER')
        .replace('ROLE_', '')
        .toLowerCase();
      return normalizedRole.includes('admin');
    }
    return false;
  }

  initializeApp(): void {
    const token = this.getToken();
    if (token && this.isValidToken(token)) {
      const decoded = this.decodeToken(token);
      const rawRole = decoded?.role || decoded?.authorities || 'USER';
      const normalizedRole = (typeof rawRole === 'string' ? rawRole : rawRole[0] || 'USER')
        .replace('ROLE_', '')
        .toLowerCase();
      const role = normalizedRole.includes('admin') ? UserRole.ADMIN : UserRole.USER;
      const userDetails: UserDetails = {
        id: 0,
        email: decoded?.email || '',
        username: decoded?.username || decoded?.sub || ''
      };
      this.store.dispatch(setRole({ role }));
      this.store.dispatch(setUserDetails({ userDetails }));
      this.authStateSubject.next(true);
    } else {
      this.authStateSubject.next(false);
    }
  }

  login(username: string, password: string): Observable<string> {
    const body = { username, password };
    return this.http.post<any>(`${this.apiUrl}/auth/login`, body).pipe(
      map(response => {
        const token = response?.token || response?.jwt || (typeof response === 'string' ? response : null);
        if (!token) {
          throw new Error('Invalid login response: no token found');
        }
        if (!this.isValidToken(token)) {
          throw new Error('Invalid JWT token format');
        }
        localStorage.setItem('token', token);
        const decoded = this.decodeToken(token);
        const rawRole = decoded?.role || decoded?.authorities || 'USER';
        const normalizedRole = (typeof rawRole === 'string' ? rawRole : rawRole[0] || 'USER')
          .replace('ROLE_', '')
          .toLowerCase();
        const role = normalizedRole.includes('admin') ? UserRole.ADMIN : UserRole.USER;
        const userDetails = {
          id: Number(decoded?.userId) || 0,
          email: decoded?.email || '',
          username: decoded?.username || decoded?.sub || ''
        };
        this.store.dispatch(setRole({ role }));
        this.store.dispatch(setUserDetails({ userDetails }));
        this.authStateSubject.next(true);
        return token;
      }),
      catchError(err => {
        console.error('Login error:', err.status, err.message, err.error);
        this.authStateSubject.next(false);
        return throwError(() => new Error('Login failed. Please check your credentials.'));
      })
    );
  }

  signup(name: string, email: string, username: string, password: string, role: string = 'USER'): Observable<string> {
    const body = { name, email, username, password, role };
    return this.http.post<string>(`${this.apiUrl}/auth/signup`, body, { responseType: 'text' as 'json' }).pipe(
      tap(() => {
        this.store.dispatch(clearRole());
        this.store.dispatch(setUserDetails({ userDetails: null }));
        this.authStateSubject.next(false);
      }),
      catchError(err => {
        console.error('Signup error:', err);
        return throwError(() => new Error(err.error || 'Signup failed. Please try again.'));
      })
    );
  }

  checkUsername(username: string): Observable<boolean> {
    return this.http.get<string>(`${this.apiUrl}/auth/check-username?username=${encodeURIComponent(username)}`).pipe(
      map(response => response === 'Username is available'),
      catchError(err => {
        console.error('Check username error:', err);
        return throwError(() => new Error('Error checking username availability'));
      })
    );
  }

  checkEmail(email: string): Observable<boolean> {
    return this.http.get<string>(`${this.apiUrl}/auth/check-email?email=${encodeURIComponent(email)}`).pipe(
      map(response => response === 'Email is available'),
      catchError(err => {
        console.error('Check email error:', err);
        return throwError(() => new Error('Error checking email availability'));
      })
    );
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const isValid = !!token && this.isValidToken(token); 
    if (!isValid && token) {
      this.logout();
    }
    return isValid;
  }

  logout(): void {
    localStorage.removeItem('token');
    this.store.dispatch(clearRole());
    this.store.dispatch(setUserDetails({ userDetails: null }));
    this.authStateSubject.next(false);
  }
}