import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.services';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private router: Router
  ) {}

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

  onSubmit(): void {
    this.loading = true;
    this.error = '';

    if (this.usernameAvailable === false) {
      this.error = 'Username already registered';
      this.loading = false;
      return;
    }
    if (this.emailAvailable === false) {
      this.error = 'Email already registered';
      this.loading = false;
      return;
    }
    if (this.role !== 'USER') {
      this.error = 'Only USER role is allowed for signup';
      this.loading = false;
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
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'Signup failed. Please try again.';
        console.error('Signup error:', err);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/login']);
  }
}