import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { CourseService } from '../../shared/services/course.service';
import { AuthService } from '../../auth/auth.services';
import { of } from 'rxjs';
import { map, mergeMap, catchError, withLatestFrom, filter, switchMap, take } from 'rxjs/operators';
import {
  loadCourses, loadCoursesSuccess, loadCoursesFailure,
  addCourse, updateCourse, deleteCourse,
  loadEnrollments, loadEnrollmentsSuccess, loadEnrollmentsFailure,
  enrollUser, enrollUserSuccess, enrollUserFailure
} from './course.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../app.state';
import { selectEnrollments } from './course.selectors';
import { EMPTY } from 'rxjs';


@Injectable()
export class CourseEffects {
  loadCourses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCourses),
      mergeMap(() =>
        this.courseService.getCourses().pipe(
          map(courses => loadCoursesSuccess({ courses })),
          catchError(error => of(loadCoursesFailure({ error: error.message })))
        )
      )
    )
  );

  addCourse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addCourse),
      mergeMap(({ course }) =>
        this.courseService.addCourse(course).pipe(
          map(response => addCourse({ course: response.data })),
          catchError(error => of(loadCoursesFailure({ error: error.message })))
        )
      )
    )
  );

  updateCourse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateCourse),
      mergeMap(({ course }) =>
        this.courseService.updateCourse(course).pipe(
          map(response => updateCourse({ course: response.data })),
          catchError(error => of(loadCoursesFailure({ error: error.message })))
        )
      )
    )
  );

  deleteCourse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteCourse),
      mergeMap(({ courseId }) =>
        this.courseService.deleteCourse(courseId).pipe(
          map(() => deleteCourse({ courseId })),
          catchError(error => of(loadCoursesFailure({ error: error.message })))
        )
      )
    )
  );

  loadEnrollments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadEnrollments),
      mergeMap(() =>
        this.courseService.getEnrolledCourses().pipe(
          map(enrollments => loadEnrollmentsSuccess({ enrollments })),
          catchError(error => of(loadEnrollmentsFailure({ error: error.message })))
        )
      )
    )
  );

enrollUser$ = createEffect(() =>
  this.actions$.pipe(
    ofType(enrollUser),
    withLatestFrom(
      this.store.select(state => state.auth?.user?.username || null),
      this.store.select(selectEnrollments)
    ),
    switchMap(([{ courseId, courseName }, username, enrollments]) => {
      if (!username) {
        return of(enrollUserFailure({ error: 'User not authenticated' }));
      }

      const isEnrolled = enrollments.some(e => e.courseId === courseId && e.username === username);
      if (isEnrolled) {
        return of(enrollUserSuccess({
          enrollment: { username, courseId, courseName }
        }));
      }

      return this.courseService.enrollUser(courseId, courseName).pipe(
        map(() => enrollUserSuccess({ enrollment: { username, courseId, courseName } })),
        catchError(error => {
          const msg = error?.message?.toLowerCase() || '';
          if (msg.includes('already enrolled') || msg.includes('duplicate')) {
            return of(enrollUserSuccess({ enrollment: { username, courseId, courseName } }));
          }
          return of(enrollUserFailure({ error: error.message || 'Unknown error' }));
        })
      );
    })
  )
);


  constructor(
    private actions$: Actions,
    private courseService: CourseService,
    private authService: AuthService,
    private store: Store<AppState>
  ) {}
}