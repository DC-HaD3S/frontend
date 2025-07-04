import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  role$: Observable<string | null>;

  constructor(
    private store: Store<{ auth: { role: string | null } }>,
    private router: Router
  ) {

    this.role$ = this.store.select(state => state.auth.role);
  }

  ngOnInit(): void {
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }
}