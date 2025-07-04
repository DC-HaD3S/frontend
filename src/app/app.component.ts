import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { setRole } from './store/auth/auth.actions';
import { UserRole } from './enums/user-role.enum';

interface AppState {
  auth: {
    role: string | null;
  };
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styles: []
})
export class AppComponent implements OnInit {
  role$: Observable<string | null>;

  constructor(
    private router: Router,
    private store: Store<AppState>
  ) {
    this.role$ = this.store.select(state => state.auth.role);

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
      }
    });

    const storedRole = localStorage.getItem('role');
    if (storedRole) {
      this.store.dispatch(setRole({ role: storedRole as UserRole }));
      this.router.navigate([`/${storedRole.toLowerCase()}/home`]);
    }
  }

  ngOnInit(): void {
    this.role$.subscribe((role: string | null) => {
      if (!role && !localStorage.getItem('role')) {
        this.router.navigate(['/']);
      }
    });
  }
}