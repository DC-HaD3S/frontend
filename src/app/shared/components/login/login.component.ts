import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/auth.services';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private store: Store<{ auth: { role: string | null } }>,
    private dialog: MatDialog
  ) {}

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    
    this.authService.login(this.username, this.password).subscribe({
      next: (token) => {
        this.loading = false;
        this.store.select(state => state.auth.role).subscribe(role => {
          if (role) {
            this.router.navigate([`/${role}/home`]);
          } else {
            this.error = 'Role not found. Please try again.';
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'Login failed. Please try again.';
      }
    });
  }



  onSignup(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/signup']);
  }
}