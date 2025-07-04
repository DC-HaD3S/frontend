import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, combineLatest, of, Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app.state';
import { UserRole } from '../../../enums/user-role.enum';
import { Course } from '../../models/course.model';
import { Feedback } from '../../models/feedback.model';
import { FeedbackService } from '../../services/feedback.service';
import { CourseService } from '../../services/course.service';
import { selectCourseById, selectEnrollments } from '../../../store/course/course.selectors';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CourseApplyDialogComponent } from 'src/app/modules/user/components/course-apply-dialog/course-apply-dialog.component';
import { FeedbackDialogComponent } from 'src/app/modules/user/components/feedback/feedback-dialog.component';
import { map, tap, switchMap, catchError, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-course-details',
  templateUrl: './course-details-dialog.component.html',
  styleUrls: ['./course-details-dialog.component.css']
})
export class CourseDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  course: Course | null = null;
  feedbacks: Feedback[] = [];
  dataSource: MatTableDataSource<Feedback> = new MatTableDataSource<Feedback>([]);
  displayedColumns: string[] = ['username', 'rating', 'comments', 'actions'];
  sortField: string = 'rating';
  sortOrder: 'asc' | 'desc' = 'desc';
  searchTerm: string = '';
  isAdmin$: Observable<boolean>;
  isEnrolled$: Observable<boolean>;
  canApply$: Observable<boolean>;
  username$: Observable<string | null>;
  allowApply: boolean = false;
  averageRating: number | null = null;
  private destroy$ = new Subject<void>();

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<AppState>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private feedbackService: FeedbackService,
    private courseService: CourseService,
    private cdr: ChangeDetectorRef
  ) {
    this.isAdmin$ = this.store.select(state => state.auth?.role === UserRole.ADMIN);
    this.username$ = this.store.select(state => state.auth?.user?.username || null);
    const courseId$ = this.route.paramMap.pipe(
      map(paramMap => {
        const id = paramMap.get('id');
        return id ? parseInt(id, 10) : null;
      })
    );

    this.isEnrolled$ = combineLatest([
      this.isAdmin$,
      this.store.select(selectEnrollments),
      this.username$,
      this.route.paramMap
    ]).pipe(
      switchMap(([isAdmin, enrollments, username, paramMap]) => {
        if (isAdmin) {
          return of(false);
        }
        const courseId = paramMap.get('id');
        const numericId = courseId ? parseInt(courseId, 10) : null;
        if (numericId == null || username == null) {
          return of(false);
        }
        if (enrollments.length > 0) {
          const isEnrolled = enrollments.some(enrollment => {
            const match = enrollment.courseId === numericId && enrollment.username === username;
            return match;
          });
          return of(isEnrolled);
        }
        return this.courseService.getEnrolledCourses().pipe(
          map(apiEnrollments => {
            const isEnrolled = apiEnrollments.some(enrollment => {
              const match = enrollment.courseId === numericId && enrollment.username === username;
              return match;
            });
            return isEnrolled;
          }),
          catchError(err => {
            console.error('CourseDetailsComponent: Failed to fetch enrollments:', err);
            this.snackBar.open('Failed to check enrollment status', 'Close', { duration: 5000 });
            return of(false);
          })
        );
      }),
      takeUntil(this.destroy$)
    );

    this.canApply$ = combineLatest([
      this.isAdmin$,
      this.isEnrolled$,
      this.username$,
      courseId$.pipe(
        switchMap(id => id ? this.store.select(selectCourseById(id)) : of(null))
      )
    ]).pipe(
      map(([isAdmin, isEnrolled, username, course]) => {
        if (isAdmin) return false;
        return !isEnrolled && !!username && !!course;
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const numericId = id ? parseInt(id, 10) : null;

    if (numericId == null || isNaN(numericId)) {
      console.error('Invalid course ID:', id);
      this.snackBar.open('Invalid course ID', 'Close', { duration: 5000 });
      this.router.navigate(['/courses']);
      return;
    }

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.course = navigation.extras.state['course'] as Course;
      this.allowApply = navigation.extras.state['allowApply'] ?? false;
    }

    if (!this.course) {
      this.store.select(selectCourseById(numericId)).pipe(
        takeUntil(this.destroy$)
      ).subscribe(course => {
        if (course) {
          this.course = course;
          this.allowApply = true;
        } else {
          console.error(`Course with ID ${numericId} not found`);
          this.snackBar.open('Course not found', 'Close', { duration: 5000 });
          this.router.navigate(['/courses']);
        }
      });
    }

    this.isEnrolled$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isEnrolled => {
      if (isEnrolled) {
        this.allowApply = false;
      }
      this.cdr.detectChanges();
    });

    this.loadFeedbacks(numericId);
    this.loadAverageRating(numericId);
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
      this.sort.active = this.sortField;
      this.sort.direction = this.sortOrder;
      this.sort.sortChange.emit({ active: this.sortField, direction: this.sortOrder });
      this.cdr.detectChanges();
    } else {
      console.warn('MatSort is not initialized');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFeedbacks(courseId: number): void {
    this.feedbackService.getFeedbacksByCourseId(courseId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (feedbacks: Feedback[]) => {
        this.feedbacks = feedbacks.map(f => ({
          ...f,
          rating: Number(f.rating),
          id: f.id
        }));
        this.dataSource.data = [...this.feedbacks];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('CourseDetailsComponent: Failed to load feedbacks:', err);
        this.snackBar.open('Failed to load feedbacks', 'Close', { duration: 5000 });
      }
    });
  }

  loadAverageRating(courseId: number): void {
    this.feedbackService.getFeedbacksByCourseId(courseId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (feedbacks: Feedback[]) => {
        if (feedbacks.length > 0) {
          const sum = feedbacks.reduce((acc, feedback) => acc + Number(feedback.rating), 0);
          const avg = sum / feedbacks.length;
          this.averageRating = Math.round(avg * 2) / 2;
        } else {
          this.averageRating = 0;
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('CourseDetailsComponent: Failed to load feedbacks for average rating:', err);
        this.snackBar.open('Failed to load average rating', 'Close', { duration: 5000 });
        this.averageRating = 0;
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    this.cdr.detectChanges();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortFeedbacks();
  }

  sortFeedbacks(): void {
    this.sort.active = this.sortField;
    this.sort.direction = this.sortOrder;
    this.sort.sortChange.emit({ active: this.sortField, direction: this.sortOrder });
    this.dataSource.sort = this.sort;
    this.cdr.detectChanges();
  }

  applyForCourse(): void {
    this.isAdmin$.pipe(take(1)).subscribe(isAdmin => {
      if (isAdmin) {
        this.snackBar.open('Admins cannot apply for courses', 'Close', { duration: 3000 });
        return;
      }
      if (this.course) {
        const dialogRef = this.dialog.open(CourseApplyDialogComponent, {
          width: '500px',
          data: { course: this.course }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result?.message) {
            this.snackBar.open(`✅ ${result.message}`, 'Close', {
              duration: 5000,
              verticalPosition: 'bottom',
              horizontalPosition: 'center',
              panelClass: ['custom-snackbar']
            });
          }
        });
      }
    });
  }

  openFeedbackDialog(feedback?: Feedback): void {
    if (!this.course || !this.course.id) {
      this.snackBar.open('Error: Course ID is missing', 'Close', { duration: 5000 });
      return;
    }

    this.isAdmin$.pipe(take(1)).subscribe(isAdmin => {
      if (isAdmin && !feedback) {
        this.snackBar.open('Admins cannot submit feedback', 'Close', { duration: 3000 });
        return;
      }

      this.courseService.getEnrolledCourses().pipe(
        take(1)
      ).subscribe({
        next: (enrollments) => {
          const dialogRef = this.dialog.open(FeedbackDialogComponent, {
            width: '500px',
            data: {
              courseId: feedback?.courseId || this.course!.id,
              courseName: feedback?.courseName || this.course!.title,
              rating: feedback?.rating,
              comments: feedback?.comments,
              feedbackId: feedback?.id,
              enrolledCourses: enrollments.map(e => ({
                courseId: e.courseId,
                courseName: e.courseName
              }))
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            if (result?.message) {
              this.snackBar.open(`✅ ${result.message}`, 'Close', {
                duration: 5000,
                verticalPosition: 'bottom',
                horizontalPosition: 'center',
                panelClass: ['custom-snackbar']
              });
              this.loadFeedbacks(this.course!.id!);
              this.loadAverageRating(this.course!.id!);
            }
          });
        },
        error: (err) => {
          console.error('CourseDetailsComponent: Failed to load enrolled courses:', err);
          this.snackBar.open('Failed to load enrolled courses', 'Close', { duration: 5000 });
        }
      });
    });
  }

  deleteFeedback(feedbackId: number): void {
    this.feedbackService.deleteFeedback(feedbackId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.snackBar.open(`✅ Feedback Successfully Deleted`, 'Close', {
          duration: 5000,
          verticalPosition: 'bottom',
          horizontalPosition: 'center',
          panelClass: ['custom-snackbar']
        });
        this.loadFeedbacks(this.course!.id!);
        this.loadAverageRating(this.course!.id!);
      },
      error: (err) => {
        console.error('CourseDetailsComponent: Failed to delete feedback:', err);
        const errorMessage = err.error?.error || 'Failed to delete feedback';
        this.snackBar.open(`❌ ${errorMessage}`, 'Close', { duration: 5000 });
      }
    });
  }
  goBack(): void {
    this.router.navigate(['/courses']);
  }
}