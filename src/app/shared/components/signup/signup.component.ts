import { Component,Optional } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { take, tap } from 'rxjs/operators';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  name: string = '';
  email: string = '';
  username: string = '';
  password: string = '';
  role: string = 'USER';
  error: string = '';
  loading: boolean = false;
  usernameAvailable: boolean | null = null;
  emailAvailable: boolean | null = null;

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
  @Optional() public dialogRef?: MatDialogRef<SignupComponent>
  ) { }

  checkUsername(): void {
    if (this.username) {
      this.authService.checkUsername(this.username).subscribe({
        next: (available) => {
          this.usernameAvailable = available;
          this.error = available ? '' : 'Username already registered';
        },
        error: (err) => {
          this.usernameAvailable = null;
          this.error = err.message || 'Error checking username';
        }
      });
    }
  }

  checkEmail(): void {
    if (this.email) {
      this.authService.checkEmail(this.email).subscribe({
        next: (available) => {
          this.emailAvailable = available;
          this.error = available ? '' : 'Email already registered';
        },
        error: (err) => {
          this.emailAvailable = null;
          this.error = err.message || 'Error checking email';
        }
      });
    }
  }

  goToRegisteredUsers(): void {
    this.checkAuthAndNavigate('/admin/registered-users');
  }

  private checkAuthAndNavigate(path: string): void {
    this.authService.isAuthenticated$().pipe(
      take(1),
      tap((isAuthenticated: boolean) => {
        if (!isAuthenticated) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: path } });
        } else {
          this.router.navigate([path]);
        }
      })
    ).subscribe();
  }
  
  onSubmit(): void {
    this.loading = true;
    this.error = '';

    if (this.usernameAvailable === false) {
      this.error = 'Username already registered';
      this.loading = false;
      if (this.dialogRef) {
        this.dialogRef.close(false);
      }
      if (this.authService.isAdmin()) {
        this.goToRegisteredUsers();
      } else {
        this.router.navigate(['/login']);
      }
      return;
    }
    if (this.emailAvailable === false) {
      this.error = 'Email already registered';
      this.loading = false;
      if (this.dialogRef) {
        this.dialogRef.close(false);
      }
      if (this.authService.isAdmin()) {
        this.goToRegisteredUsers();
      } else {
        this.router.navigate(['/login']);
      }
      return;
    }
    if (this.role !== 'USER') {
      this.error = 'Only USER role is allowed for signup';
      this.loading = false;
      if (this.dialogRef) {
        this.dialogRef.close(false);
      }
      if (this.authService.isAdmin()) {
        this.goToRegisteredUsers();
      } else {
        this.router.navigate(['/login']);
      }
      return;
    }

    this.authService.signup(this.name, this.email, this.username, this.password, this.role).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('User successfully registered!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        if (this.dialogRef) {
          this.dialogRef.close(true); // Signal success for dialog
        }
        if (this.authService.isAdmin()) {
          this.goToRegisteredUsers();
        } else {
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'Signup failed. Please try again.';
        console.error('Signup error:', err);
        if (this.dialogRef) {
          this.dialogRef.close(false);
        }
        if (this.authService.isAdmin()) {
          this.goToRegisteredUsers();
        } else {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close(false);
    }
    if (this.authService.isAdmin()) {
      this.goToRegisteredUsers();
    } else {
      this.router.navigate(['/login']);
    }
  }
}