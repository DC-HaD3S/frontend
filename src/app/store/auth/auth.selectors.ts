import { createSelector } from '@ngrx/store';
import { AppState, AuthState } from '../app.state';

export const selectAuthState = (state: AppState) => state.auth;

export const selectRole = createSelector(
  selectAuthState,
  (state: AuthState) => state.role
);

export const selectUserDetails = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);