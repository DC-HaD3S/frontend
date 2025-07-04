import { createSelector } from '@ngrx/store';
import { CourseState } from './course.reducer';
import { AppState } from '../app.state';

export const selectCourseState = (state: AppState) => state.courses;

export const selectCourses = createSelector(
  selectCourseState,
  (state: CourseState) => state.courses
);

export const selectEnrollments = createSelector(
  selectCourseState,
  (state: CourseState) => state.enrollments
);

export const selectCourseError = createSelector(
  selectCourseState,
  (state: CourseState) => state.error
);
export const selectCourseById = (id: number) => createSelector(
  selectCourseState,
  (state) => state.courses?.find(course => course.id === id)
);

export const selectCourseMessage = createSelector(
  selectCourseState,
  (state: CourseState) => state.message
);