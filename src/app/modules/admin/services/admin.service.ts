import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../user/models/user.model';
import { UserRole } from 'src/app/enums/user-role.enum';
import { environment } from 'src/environment/environment.prod';

interface RawEnrollment {
  username: string;
  courseId: number;
  courseName: string;
}
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = '${environment.apiUrl}/users';

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  getAllUsers(): Observable<User[]> {
    return this.http.get<any[]>(`${this.baseUrl}`).pipe(
      map(users => users.map(user => ({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        username: user.username || user.sub || '',
        role: (user.role?.replace('ROLE_', '').toLowerCase() || 'user') as UserRole,
        password: user.password || ''
      }))),
      catchError(error => {
        const errorMessage = error.status === 401 || error.status === 403
          ? 'Unauthorized: Please log in as an admin.'
          : `Error fetching users: ${error.error?.message || 'Unknown error'}`;
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  getEnrolledUsers(): Observable<RawEnrollment[]> {
    return this.http.get<RawEnrollment[]>(`${this.baseUrl}/enrolled`);
  }
  deleteUserByEmail(userEmail: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/delete?userEmail=${encodeURIComponent(userEmail)}`
    );
  }
}
