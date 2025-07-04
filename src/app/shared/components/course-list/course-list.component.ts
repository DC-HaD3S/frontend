import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, of, combineLatest, Subject, BehaviorSubject } from 'rxjs';
import { take, catchError, map, switchMap, tap, shareReplay, takeUntil } from 'rxjs/operators';

import { Course } from 'src/app/shared/models/course.model';
import { Feedback } from 'src/app/shared/models/feedback.model';
import { UserRole } from 'src/app/enums/user-role.enum';
import { AppState } from 'src/app/store/app.state';

import { CourseApplyDialogComponent } from 'src/app/modules/user/components/course-apply-dialog/course-apply-dialog.component';
import { loadCourses } from 'src/app/store/course/course.actions';
import { selectCourses, selectCourseError, selectEnrollments, selectCourseById } from 'src/app/store/course/course.selectors';

import { CourseService } from 'src/app/shared/services/course.service';
import { FeedbackService } from 'src/app/shared/services/feedback.service';
import { AuthService } from 'src/app/auth/auth.services';
import { faStar as solidStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import { faStar as emptyStar } from '@fortawesome/free-regular-svg-icons';


@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.css']
})
export class CourseListComponent implements OnInit, OnDestroy {
  courses$: Observable<Course[] | undefined>;
  error$: Observable<string | null>;
  isAdmin$: Observable<boolean>;
  role$: Observable<UserRole | null>;
  username$: Observable<string | null>;
  isAuthenticated$: Observable<boolean>;

  sortedCourses: Course[] = [];
  sortCriteria = 'title-asc';
  searchQuery = '';

  private originalCourses: Course[] = [];
  private filteredCourses: Course[] = [];

  hasCourses = false;
  isLoading = true;

  private enrollmentCache = new Map<number, Observable<boolean>>();
  private canApplyCache = new Map<number, Observable<boolean>>();
  private averageRatingCache = new Map<number, Observable<number>>();
  private destroy$ = new Subject<void>();
  solidStar = solidStar;
  faStarHalfAlt = faStarHalfAlt;
  emptyStar = emptyStar;

  private enrollmentRefresh$ = new BehaviorSubject<{ courseId: number | null }>({ courseId: null });
  loadingEnrollments = new Map<number, boolean>();

  constructor(
    private store: Store<AppState>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private courseService: CourseService,
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.courses$ = this.store.select(selectCourses).pipe(
      catchError(() => {
        console.error('Selector error: returning empty array');
        return of([]);
      })
    );
    this.error$ = this.store.select(selectCourseError);
    this.isAdmin$ = this.store.select(state => state.auth?.role === UserRole.ADMIN);
    this.role$ = this.store.select(state => state.auth?.role);
    this.username$ = this.store.select(state => state.auth?.user?.username || null);
    this.isAuthenticated$ = this.authService.isAuthenticated$();
  }

  ngOnInit(): void {
    this.store.dispatch(loadCourses());

    this.courses$.pipe(
      takeUntil(this.destroy$),
      switchMap(courses => {
        if (!Array.isArray(courses)) {
          this.resetCourseLists();
          return of([]);
        }

        this.originalCourses = [...courses];
        this.filteredCourses = [...courses];
        this.hasCourses = courses.length > 0;

        const preloadEnrollments$ = courses.map(course => {
          this.loadingEnrollments.set(course.id!, true);
          return this.getIsEnrolled$(course.id!).pipe(take(1));
        });

        return combineLatest(preloadEnrollments$).pipe(
          tap(() => {
            this.sortCourses();
            this.cdr.detectChanges();
            this.isLoading = false;
          })
        );
      }),
      catchError(err => {
        console.error('Failed during course/enrollment preload:', err);
        this.snackBar.open('Failed to load courses', 'Close', { duration: 5000 });
        this.isLoading = false;
        this.cdr.detectChanges();
        return of([]);
      })
    ).subscribe();

    this.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      if (error) {
        this.snackBar.open(`Error: ${error}`, 'Close', { duration: 5000 });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.isAuthenticated$.pipe(
      takeUntil(this.destroy$),
      tap(isAuthenticated => {
        if (!isAuthenticated) {
          this.enrollmentCache.clear();
          this.canApplyCache.clear();
          this.averageRatingCache.clear();
          this.loadingEnrollments.clear();
          this.cdr.detectChanges();
        }
      })
    ).subscribe();
  }

  getStarIcon(rating: number, index: number) {
    if (rating >= index) return solidStar;
    if (rating >= index - 0.5) return faStarHalfAlt;
    return emptyStar;
  }

  getStarColor(rating: number, index: number): string {
    if (rating >= index || rating >= index - 0.5) {
      return 'gold';
    }
    return '#d1d5db';
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterCourses(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredCourses = query
      ? this.originalCourses.filter(course => course.title?.toLowerCase().includes(query))
      : [...this.originalCourses];

    this.hasCourses = this.filteredCourses.length > 0;
    this.sortCourses();
    this.cdr.detectChanges();
  }

  sortCourses(): void {
    const [field, direction] = this.sortCriteria.split('-');
    this.sortedCourses = [...this.filteredCourses].sort((a, b) => {
      if (field === 'title') {
        return direction === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      if (field === 'price') {
        return direction === 'asc'
          ? (a.price ?? 0) - (b.price ?? 0)
          : (b.price ?? 0) - (a.price ?? 0);
      }
      return 0;
    });
    this.cdr.detectChanges();
  }

  getIsEnrolled$(courseId: number): Observable<boolean> {
    if (!this.enrollmentCache.has(courseId)) {
      const enrollment$ = combineLatest([
        this.isAdmin$,
        this.isAuthenticated$,
        this.enrollmentRefresh$,
        this.store.select(selectEnrollments),
        this.username$
      ]).pipe(
        switchMap(([isAdmin, isAuth, refresh, enrollments, username]) => {
          if (refresh.courseId !== null && refresh.courseId !== courseId) {
            const cached = this.enrollmentCache.get(courseId);
            if (cached) return cached;
          }

          if (isAdmin || !isAuth || courseId == null || username == null) {
            this.loadingEnrollments.set(courseId, false);
            return of(false);
          }

          const isEnrolled = enrollments.some(e => e.courseId === courseId && e.username === username);
          if (isEnrolled) {
            this.loadingEnrollments.set(courseId, false);
            return of(true);
          }

          return this.courseService.getEnrolledCourses().pipe(
            map(apiEnrollments => {
              const enrolled = apiEnrollments.some(e => e.courseId === courseId && e.username === username);
              this.loadingEnrollments.set(courseId, false);
              return enrolled;
            }),
            catchError(err => {
              console.error('Fetch enrollment failed:', err);
              this.snackBar.open('Failed to check enrollment status', 'Close', { duration: 5000 });
              this.loadingEnrollments.set(courseId, false);
              return of(false);
            })
          );
        }),
        shareReplay(1)
      );
      this.enrollmentCache.set(courseId, enrollment$);
    }
    return this.enrollmentCache.get(courseId)!;
  }

  getCanApply$(courseId: number): Observable<boolean> {
    if (!this.canApplyCache.has(courseId)) {
      this.canApplyCache.set(courseId, combineLatest([
        this.isAdmin$,
        this.getIsEnrolled$(courseId),
        this.store.select(selectCourseById(courseId)).pipe(map(c => c ?? null))
      ]).pipe(
        map(([isAdmin, isEnrolled, course]) => !isAdmin && !isEnrolled && !!course),
        shareReplay(1)
      ));
    }
    return this.canApplyCache.get(courseId)!;
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

  openApplyDialog(course: Course): void {
    if (!course.id) {
      this.snackBar.open('Error: Course ID is missing', 'Close', { duration: 5000 });
      return;
    }

    this.isAuthenticated$.pipe(take(1)).subscribe(auth => {
      if (!auth) {
        this.snackBar.open('Please log in to apply for courses', 'Close', { duration: 3000 });
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/courses' } });
        return;
      }

      this.role$.pipe(take(1)).subscribe(role => {
        if (role === UserRole.ADMIN) {
          this.snackBar.open('Admins cannot apply for courses', 'Close', { duration: 3000 });
        } else {
          const dialogRef = this.dialog.open(CourseApplyDialogComponent, {
            width: '500px',
            data: { course }
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              this.loadingEnrollments.set(course.id!, true);
              this.enrollmentCache.delete(course.id!);
              this.canApplyCache.delete(course.id!);
              this.enrollmentRefresh$.next({ courseId: course.id! });
              this.cdr.detectChanges();
            }
          });
        }
      });
    });
  }

  openDetailsDialog(course: Course): void {
    if (!course.id) {
      this.snackBar.open('Error: Course ID is missing', 'Close', { duration: 5000 });
      return;
    }
    this.router.navigate(['/course-details', course.id.toString()], {
      state: { course, allowApply: true }
    });
  }

  navigateToFeedback(courseId: number): void {
    if (courseId == null) {
      this.snackBar.open('Error: Course ID is missing', 'Close', { duration: 5000 });
      return;
    }
    this.router.navigate(['/feedback', courseId.toString()]).catch(err => {
      console.error('Navigation failed:', err);
      this.snackBar.open('Failed to navigate to feedback page', 'Close', { duration: 5000 });
    });
  }

  trackByCourseId(index: number, course: Course): number {
    return course.id ?? index;
  }
  getStarType(rating: number, index: number): 'full' | 'half' | 'empty' {
    if (rating >= index) {
      return 'full';
    } else if (rating >= index - 0.5) {
      return 'half';
    } else {
      return 'empty';
    }
  }

  pageSize = 9;
  currentPage = 0;

  get pagedCourses(): Course[] {
    const start = this.currentPage * this.pageSize;
    return this.sortedCourses.slice(start, start + this.pageSize);
  }


  get totalPages(): number {
    return Math.ceil(this.sortedCourses.length / this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.cdr.detectChanges();

    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.cdr.detectChanges();
    }
  }

  private resetCourseLists(): void {
    this.originalCourses = [];
    this.filteredCourses = [];
    this.sortedCourses = [];
    this.hasCourses = false;
    this.isLoading = false;
    this.cdr.detectChanges();
  }
}
