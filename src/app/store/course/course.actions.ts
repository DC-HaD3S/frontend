import { createAction, props } from '@ngrx/store';
import { Course } from 'src/app/shared/models/course.model';
import { Enrollment } from 'src/app/shared/models/enrollment.model';

export const loadCourses = createAction('[Courses] Load Courses');
export const loadCoursesSuccess = createAction('[Courses] Load Courses Success', props<{ courses: Course[] }>());
export const loadCoursesFailure = createAction('[Courses] Load Courses Failure', props<{ error: string }>());

export const addCourse = createAction('[Courses] Add Course', props<{ course: Course }>());
export const updateCourse = createAction('[Courses] Update Course', props<{ course: Course }>());
export const deleteCourse = createAction('[Courses] Delete Course', props<{ courseId: number }>());

export const loadEnrollments = createAction('[Enrollments] Load Enrollments');
export const loadEnrollmentsSuccess = createAction('[Enrollments] Load Enrollments Success', props<{ enrollments: Enrollment[] }>());
export const loadEnrollmentsFailure = createAction('[Enrollments] Load Enrollments Failure', props<{ error: string }>());

export const enrollUser = createAction('[Enrollments] Enroll User', props<{ courseId: number; courseName: string }>());
export const enrollUserSuccess = createAction('[Enrollments] Enroll User Success', props<{ enrollment: Enrollment }>());
export const enrollUserFailure = createAction('[Enrollments] Enroll User Failure', props<{ error: string }>());

export const clearCourseError = createAction('[Courses] Clear Course Error');