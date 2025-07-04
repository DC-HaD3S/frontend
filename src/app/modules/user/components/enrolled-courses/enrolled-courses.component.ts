import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, shareReplay, takeUntil, switchMap } from 'rxjs/operators';
import { Enrollment } from 'src/app/shared/models/enrollment.model';
import { Course } from 'src/app/shared/models/course.model';
import { Feedback } from 'src/app/shared/models/feedback.model';
import { selectEnrollments, selectCourseError } from 'src/app/store/course/course.selectors';
import { AuthService } from 'src/app/auth/auth.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CourseService } from 'src/app/shared/services/course.service';
import { FeedbackService } from 'src/app/shared/services/feedback.service';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { faStar as solidStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import { faStar as emptyStar } from '@fortawesome/free-regular-svg-icons';

@Component({
  selector: 'app-enrolled-courses',
  templateUrl: './enrolled-courses.component.html',
  styleUrls: ['./enrolled-courses.component.css']
})
export class EnrolledCoursesComponent implements OnInit, OnDestroy {
  enrollments$: Observable<Enrollment[]>;
  error$: Observable<string | null>;
  sortedEnrollments: Enrollment[] = [];
  paginatedEnrollments: Enrollment[] = [];
  isLoading: boolean = false;
  pageSize = 9;
  pageIndex = 0;

  private averageRatingCache = new Map<number, Observable<number>>();
  private destroy$ = new Subject<void>();
  solidStar = solidStar;
  faStarHalfAlt = faStarHalfAlt;
  emptyStar = emptyStar;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private authService: AuthService,
    private courseService: CourseService,
    private feedbackService: FeedbackService,
    private snackBar: MatSnackBar
  ) {
    this.enrollments$ = this.store.select(selectEnrollments);
    this.error$ = this.store.select(selectCourseError);
  }

  ngOnInit(): void {
    this.authService.isAuthenticated$().pipe(
      takeUntil(this.destroy$),
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          this.snackBar.open('Please log in to view enrollments.', 'Close', { duration: 5000 });
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/enrolled-courses' } });
          return of([]);
        }

        const username = this.authService.getUsername();
        if (!username) {
          this.snackBar.open('User not found. Please log in again.', 'Close', { duration: 5000 });
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/enrolled-courses' } });
          return of([]);
        }

        this.isLoading = true;
        return this.courseService.getCourses().pipe(
          switchMap(allCourses => {
            return this.courseService.getEnrolledCourses().pipe(
              map(enrollments => {
                this.sortedEnrollments = enrollments.map(enroll => ({
                  ...enroll,
                  body: allCourses.find(c => c.id === enroll.courseId)?.body || '',
                  imageUrl: allCourses.find(c => c.id === enroll.courseId)?.imageUrl || '',
                  price: allCourses.find(c => c.id === enroll.courseId)?.price ?? 0
                }));
                this.updatePaginatedEnrollments();
                this.isLoading = false;
                return enrollments;
              }),
              catchError(() => {
                this.snackBar.open('Failed to load enrolled courses.', 'Close', { duration: 5000 });
                this.isLoading = false;
                return of([]);
              })
            );
          }),
          catchError(() => {
            this.snackBar.open('Failed to load course details.', 'Close', { duration: 5000 });
            this.isLoading = false;
            return of([]);
          })
        );
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hasCourses(): boolean {
    return this.sortedEnrollments.length > 0;
  }

  truncateBody(body: string | undefined, maxLength: number): string {
    if (!body) return '';
    return body.length > maxLength ? body.substring(0, maxLength) + '...' : body;
  }

  getAverageRating$(courseId: number): Observable<number> {
    if (!this.averageRatingCache.has(courseId)) {
      const avg$ = this.feedbackService.getFeedbacksByCourseId(courseId).pipe(
        map((feedbacks: Feedback[]) => {
          if (!feedbacks.length) return 0;
          const sum = feedbacks.reduce((acc, f) => acc + Number(f.rating), 0);
          return Math.round((sum / feedbacks.length) * 2) / 2;
        }),
        catchError(err => {
          console.error('Rating fetch failed:', err);
          this.snackBar.open('Failed to load average rating', 'Close', { duration: 5000 });
          return of(0);
        }),
        shareReplay(1)
      );
      this.averageRatingCache.set(courseId, avg$);
    }
    return this.averageRatingCache.get(courseId)!;
  }

  getStarIcon(rating: number, index: number) {
    if (rating >= index) return this.solidStar;
    if (rating >= index - 0.5) return this.faStarHalfAlt;
    return this.emptyStar;
  }

  getStarColor(rating: number, index: number): string {
    if (rating >= index || rating >= index - 0.5) {
      return 'gold';
    }
    return '#d1d5db';
  }

  openDetailsDialog(enrollment: Enrollment): void {
    if (!enrollment.courseId) {
      console.error('Course ID is missing:', enrollment);
      this.snackBar.open('Error: Course ID is missing', 'Close', { duration: 5000 });
      return;
    }

    const course: Course = {
      id: enrollment.courseId,
      title: enrollment.courseName,
      body: enrollment.body || '',
      price: enrollment.price ?? 0,
      imageUrl: enrollment.imageUrl || ''
    };

    this.router.navigate(['/course-details', enrollment.courseId.toString()], {
      state: { course, allowApply: false }
    }).then(success => {
      console.log('Navigation success:', success);
    }).catch(err => {
      console.error('Navigation error:', err);
      this.snackBar.open('Failed to navigate to course details', 'Close', { duration: 5000 });
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedEnrollments();
  }

  updatePaginatedEnrollments(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedEnrollments = this.sortedEnrollments.slice(startIndex, endIndex);
  }

  trackByCourseId(index: number, enrollment: Enrollment): number {
    return enrollment.courseId ?? index;
  }
}