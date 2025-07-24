import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap, shareReplay, tap, take, finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';
import { AuthService } from '../../auth/auth.services';
import { Store } from '@ngrx/store';
import { selectEnrollments } from '../../store/course/course.selectors';
import { AppState } from '../../store/app.state';
import { loadEnrollments } from '../../store/course/course.actions';
import { environment } from 'src/environment/environment.prod';

export interface HighestEnrollmentDTO {
  courseId: number;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = environment.apiUrl;
  private enrollmentCache: Enrollment[] | null = null;
  private enrollmentRefresh$ = new BehaviorSubject<void>(undefined);
  private enrollingCourses = new Set<number>();
  private highestEnrollmentsCache: HighestEnrollmentDTO[] | null = null;
  private highestEnrollmentsRefresh$ = new BehaviorSubject<void>(undefined);
  private coursesCache: Course[] | null = null;
  private coursesRefresh$ = new BehaviorSubject<void>(undefined);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private store: Store<AppState>
  ) {}

  getCourses(): Observable<Course[]> {
    if (this.coursesCache) {
      return of(this.coursesCache);
    }

    return this.coursesRefresh$.pipe(
      switchMap(() =>
        this.http.get<Course[]>(`${this.apiUrl}/courses`).pipe(
          map(courses => courses || []),
          tap(courses => {
            this.coursesCache = courses;
          }),
          catchError(error => {
            console.error('Courses API Error:', error);
            this.snackBar.open(`Error fetching courses: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 5000 });
            return throwError(() => new Error(error.error?.message || 'Failed to fetch courses'));
          })
        )
      ),
      shareReplay(1)
    );
  }

  clearCoursesCache(): void {
    this.coursesCache = null;
    this.coursesRefresh$.next();
  }

  getHighestEnrolledCourses(): Observable<HighestEnrollmentDTO[]> {
    if (this.highestEnrollmentsCache) {
      return of(this.highestEnrollmentsCache);
    }

    return this.highestEnrollmentsRefresh$.pipe(
      switchMap(() =>
        this.http.get<HighestEnrollmentDTO[]>(`${this.apiUrl}/courses/highest-enrolled-users-count`).pipe(
          map(enrollments => enrollments || []),
          tap(enrollments => {
            this.highestEnrollmentsCache = enrollments;
          }),
          catchError(error => {
            console.error('Highest Enrolled Courses API Error:', error);
            this.snackBar.open(`Error fetching highest enrolled courses: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 5000 });
            return of([]);
          }),
          shareReplay(1)
        )
      )
    );
  }

  getEnrolledCourses(): Observable<Enrollment[]> {
    return this.authService.isAuthenticated$().pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) return of([]);

        if (this.enrollmentCache) return of(this.enrollmentCache);

        return this.enrollmentRefresh$.pipe(
          switchMap(() =>
            this.http.get<Enrollment[]>(`${this.apiUrl}/courses/enrolled-courses`).pipe(
              switchMap(enrollments => {
                // Fetch course details to get instructorId and instructor
                return this.getCourses().pipe(
                  map(courses => {
                    const cleaned = (enrollments || []).map(e => {
                      const course = courses.find(c => c.id === e.courseId);
                      return {
                        username: e.username || '',
                        courseId: Number(e.courseId),
                        courseName: e.courseName || '',
                        body: course?.body || '',
                        price: course?.price ?? 0,
                        imageUrl: course?.imageUrl || '',
                        instructorId: course?.instructorId ?? null,
                        instructor: course?.instructor || 'Unknown Instructor'
                      };
                    });
                    this.enrollmentCache = cleaned;
                    return cleaned;
                  })
                );
              }),
              catchError(error => {
                console.error('Enrolled Courses API Error:', error);
                if (error.status === 403) {
                  this.snackBar.open('Access denied: Please log in.', 'Close', { duration: 5000 });
                }
                return of([]);
              }),
              shareReplay(1)
            )
          )
        );
      })
    );
  }

  addCourse(course: Course): Observable<{ message: string, data: Course }> {
    return this.authService.isAuthenticated$().pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          this.snackBar.open('Please log in to add a course.', 'Close', { duration: 5000 });
          return throwError(() => new Error('User not authenticated'));
        }
        return this.http.post<{ message: string, data: Course }>(`${this.apiUrl}/courses`, course).pipe(
          tap(() => {
            this.clearCoursesCache();
          }),
          catchError(error => {
            console.error('Add Course API Error:', error);
            this.snackBar.open(`Error adding course: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 5000 });
            return throwError(() => new Error(error.error?.message || 'Failed to add course'));
          })
        );
      })
    );
  }

  updateCourse(course: Course): Observable<{ message: string, data: Course }> {
    return this.authService.isAuthenticated$().pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          this.snackBar.open('Please log in to update a course.', 'Close', { duration: 5000 });
          return throwError(() => new Error('User not authenticated'));
        }

        const courseDTO = {
          title: course.title,
          price: course.price,
          body: course.body,
          imageUrl: course.imageUrl,
          instructor: course.instructor
        };

        return this.http.put<{ message: string, data: Course }>(`${this.apiUrl}/courses/${course.id}`, courseDTO).pipe(
          tap(() => {
            this.clearCoursesCache();
          }),
          catchError(error => {
            console.error('Update Course API Error:', error);
            this.snackBar.open(`Error updating course: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 5000 });
            return throwError(() => new Error(error.error?.message || 'Failed to update course'));
          })
        );
      })
    );
  }

  deleteCourse(courseId: number): Observable<{ message: string, data: null }> {
    return this.authService.isAuthenticated$().pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          this.snackBar.open('Please log in to delete a course.', 'Close', { duration: 5000 });
          return throwError(() => new Error('User not authenticated'));
        }
        return this.http.delete<{ message: string, data: null }>(`${this.apiUrl}/courses/${courseId}`).pipe(
          tap(() => {
            this.clearCoursesCache();
          }),
          catchError(error => {
            console.error('Delete Course API Error:', error);
            this.snackBar.open(`Error deleting course: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 5000 });
            return throwError(() => new Error(error.error?.message || 'Failed to delete course'));
          })
        );
      })
    );
  }

  enrollUser(courseId: number, courseName: string): Observable<{ message: string }> {
    if (this.enrollingCourses.has(courseId)) {
      return of({ message: 'Enrollment already in progress' });
    }

    this.enrollingCourses.add(courseId);

    return this.authService.isAuthenticated$().pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          this.snackBar.open('Please log in to enroll.', 'Close', { duration: 5000 });
          return throwError(() => new Error('User not authenticated'));
        }

        const username = this.authService.getUsername();
        if (!username) {
          this.snackBar.open('User information not available.', 'Close', { duration: 5000 });
          return throwError(() => new Error('User not identified'));
        }

        this.store.dispatch(loadEnrollments());

        return this.store.select(selectEnrollments).pipe(
          take(1),
          switchMap(enrollments => {
            const isEnrolled = enrollments.some(e => e.courseId === courseId && e.username === username);
            if (isEnrolled) {
              return of({ message: 'Already enrolled in the course' });
            }

            const payload = { courseId };
            return this.http.post<{ message: string }>(`${this.apiUrl}/users/apply-course`, payload).pipe(
              tap(() => {
                this.enrollmentCache = null;
                this.enrollmentRefresh$.next();
              }),
              catchError(error => {
                const silent = error instanceof Error && error.message === 'Enrollment silently failed (already handled).';
                if (silent) {
                  return of({ message: 'Already enrolled in the course' });
                }

                const msg = error.error?.message || '';
                const isDuplicate = msg.includes('duplicate') || msg.includes('already enrolled');
                if (!isDuplicate) {
                  console.error('Enroll API Error:', {
                    status: error.status,
                    message: error.message,
                    error: error.error,
                    url: error.url
                  });
                }

                let errorMessage = 'Failed to enroll';
                if (error.status === 403) {
                  errorMessage = 'Access denied: Please check your login status or permissions.';
                } else if (isDuplicate) {
                  return of({ message: 'Already enrolled in the course' });
                } else if (error.error?.message) {
                  errorMessage = error.error.message;
                }

                this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
                return throwError(() => new Error(errorMessage));
              }),
              finalize(() => this.enrollingCourses.delete(courseId))
            );
          })
        );
      })
    );
  }
}