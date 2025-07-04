import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { UserRole } from '../../../enums/user-role.enum';
import { AppState } from '../../../store/app.state';
import { AuthService } from 'src/app/auth/auth.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { clearRole, setUserDetails } from 'src/app/store/auth/auth.actions';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  isAuthenticated$: Observable<boolean>;
  role$: Observable<UserRole | null>;
  username$: Observable<string>;

  constructor(
    private router: Router,
    private store: Store<AppState>,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$();
    this.role$ = this.store.select(state => state.auth.role);
    this.username$ = this.store.select(state => state.auth.user?.username).pipe(
      map(username => username || 'User') 
    );
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToAdminHome(): void {
    this.checkAuthAndNavigate('/admin/home');
  }

  goToAdminFeedbacks(): void {
    this.checkAuthAndNavigate('/admin/feedbacks');
  }

  goToAboutUs(): void {
    this.router.navigate(['/about-us']);
  }

  goToAdminEnrolled(): void {
    this.checkAuthAndNavigate('/admin/enrolled');
  }

  goToAdminManageCourses(): void {
    this.checkAuthAndNavigate('/admin/manage-courses');
  }

  goToUserFeedback(): void {
    this.checkAuthAndNavigate('/user/feedback');
  }

  goToRegisteredUsers(): void {
    this.checkAuthAndNavigate('/admin/registered-users');
  }

  goToUserEnrolled(): void {
    this.checkAuthAndNavigate('/user/enrolled');
  }

logout(): void {
  this.authService.logout();
  this.snackBar.open('Logged out successfully', 'Close', { duration: 3000 });
  this.router.navigate(['/login']).then(() => {
    this.store.dispatch(clearRole());
    this.store.dispatch(setUserDetails({ userDetails: null }));
  });
}

  private checkAuthAndNavigate(path: string): void {
    this.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: path } });
          return;
        }
        this.router.navigate([path]);
      })
    ).subscribe();
  }
}