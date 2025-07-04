
import { createAction, props } from '@ngrx/store';
import { UserRole } from 'src/app/enums/user-role.enum';
import { UserDetails } from 'src/app/auth/auth.services';

export const setRole = createAction(
  '[Auth] Set Role',
  props<{ role: UserRole }>()
);

export const clearRole = createAction(
  '[Auth] Clear Role'
);

export const setUserDetails = createAction(
  '[Auth] Set User Details',
  props<{ userDetails: UserDetails | null }>()
);