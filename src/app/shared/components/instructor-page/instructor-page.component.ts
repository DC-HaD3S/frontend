import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { InstructorService } from '../../services/instructor.service';
import { FeedbackService } from 'src/app/shared/services/feedback.service';
import { AuthService } from 'src/app/auth/auth.services';
import { InstructorDetails, CourseDTO } from '../../models/instructor-details.model';
import { Feedback } from 'src/app/shared/models/feedback.model';
import { AppState } from 'src/app/store/app.state';
import { UserRole } from 'src/app/enums/user-role.enum';
import { faStar as solidStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import { faStar as emptyStar } from '@fortawesome/free-regular-svg-icons';
import { faTwitter, faGithub } from '@fortawesome/free-brands-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-instructor-page',
  templateUrl: './instructor-page.component.html',
  styleUrls: ['./instructor-page.component.css']
})
export class InstructorPageComponent implements OnInit, OnDestroy {
  instructorDetails: InstructorDetails | null = null;
  courses: CourseDTO[] = [];
  averageRating: number | null = null;
  enrollmentCount: number | null = null;
  totalReviews: number | null = null;
  error: string | null = null;
  isLoading = true;
  pageSize = 9;
  currentPage = 0;
  isImageLoaded = false; // New flag to track image loading

  solidStar = solidStar;
  faStarHalfAlt = faStarHalfAlt;
  emptyStar = emptyStar;
  faTwitter: IconProp = faTwitter as IconProp;
  faGithub: IconProp = faGithub as IconProp;
  faEnvelope: IconProp = faEnvelope;

  private destroy$ = new Subject<void>();
  private averageRatingCache = new Map<number, Observable<number>>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private instructorService: InstructorService,
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private store: Store<AppState>,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const rawInstructorId = params.get('instructorId');
        console.log('Raw instructorId from route:', rawInstructorId);
        const instructorId = Number(rawInstructorId);
        console.log('Parsed instructorId:', instructorId);
        if (rawInstructorId && !isNaN(instructorId) && instructorId > 0) {
          return this.loadInstructorData(instructorId);
        } else {
          this.error = `Invalid instructor ID: '${rawInstructorId || 'not provided'}'. Expected a positive number.`;
          console.error(this.error);
          this.snackBar.open('Invalid instructor ID', 'Close', { duration: 5000 });
          this.router.navigate(['/courses']);
          this.isLoading = false;
          this.cdr.detectChanges();
          return of(null);
        }
      })
    ).subscribe();
  }

  private loadInstructorData(instructorId: number): Observable<void> {
    return combineLatest([
      this.instructorService.getInstructorDetails(instructorId),
      this.instructorService.getCoursesByInstructorId(instructorId),
      this.instructorService.getInstructorAverageRating(instructorId),
      this.instructorService.getEnrollmentCount(instructorId),
      this.feedbackService.getInstructorFeedbackCount(instructorId)
    ]).pipe(
      takeUntil(this.destroy$),
      switchMap(([details, courses, rating, count, totalReviews]) => {
        console.log('Instructor details received:', details);
        console.log('Courses received:', courses);
        console.log('Average rating received:', rating);
        console.log('Enrollment count received:', count);
        console.log('Total reviews received:', totalReviews);

        this.instructorDetails = details;
        this.courses = courses.filter((course): course is CourseDTO => course.id !== undefined);
        this.averageRating = rating;
        this.enrollmentCount = count;
        this.totalReviews = totalReviews;

        // Preload instructor photo
        if (details.photoUrl) {
          return this.preloadImage(details.photoUrl).pipe(
            tap(() => {
              console.log('Instructor image preloaded successfully');
              this.isImageLoaded = true;
              this.preloadCourseImages(); // Preload course images after instructor image
              this.isLoading = false;
              this.cdr.detectChanges();
            }),
            catchError(err => {
              console.error('Instructor image preload failed:', err);
              this.isImageLoaded = true; // Proceed even if image fails
              this.instructorDetails!.photoUrl = 'assets/default-instructor.jpg'; // Fallback
              this.preloadCourseImages();
              this.isLoading = false;
              this.cdr.detectChanges();
              return of(null);
            }),
            map(() => void 0)
          );
        } else {
          this.isImageLoaded = true;
          this.instructorDetails!.photoUrl = 'assets/default-instructor.jpg';
          this.preloadCourseImages();
          this.isLoading = false;
          this.cdr.detectChanges();
          return of(void 0);
        }
      }),
      catchError(err => {
        console.error('Failed to load instructor data:', err);
        this.error = `Failed to load instructor data: ${err.message}`;
        this.snackBar.open(this.error, 'Close', { duration: 5000 });
        this.isLoading = false;
        this.cdr.detectChanges();
        return of(null);
      }),
      map(() => void 0)
    );
  }

  private preloadImage(url: string): Observable<void> {
    return new Observable(observer => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        console.log('Image loaded successfully:', url);
        observer.next();
        observer.complete();
      };
      img.onerror = () => {
        console.error('Image failed to load:', url);
        observer.error(new Error('Image load failed'));
      };
    });
  }

  private preloadCourseImages(): void {
    this.courses.forEach(course => {
      if (course.imageUrl) {
        this.preloadImage(course.imageUrl).pipe(
          takeUntil(this.destroy$),
          tap(() => console.log('Course image preloaded:', course.imageUrl)),
          catchError(err => {
            console.error('Course image preload failed:', course.imageUrl, err);
            course.imageUrl = 'assets/default-instructor.jpg';
            return of(null);
          })
        ).subscribe();
      }
    });
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

  handleImageError(event: any): void {
    console.error('Image load failed in UI:', event.target.src);
    console.log('Falling back to default image: assets/default-instructor.jpg');
    event.target.src = 'assets/default-instructor.jpg';
  }

  navigateToCourseDetails(courseId: number): void {
    if (courseId == null) {
      this.snackBar.open('Error: Course ID is missing', 'Close', { duration: 5000 });
      return;
    }
    this.router.navigate(['/course-details', courseId.toString()]);
  }

  navigateToInstructor(instructorId: number): void {
    if (instructorId && !isNaN(instructorId) && instructorId > 0) {
      console.log('Navigating to instructor ID:', instructorId);
      this.router.navigate(['/instructor', instructorId]);
    } else {
      console.error('Cannot navigate: Invalid instructor ID', instructorId);
      this.snackBar.open('Instructor information is not available', 'Close', { duration: 5000 });
    }
  }

  trackByCourseId(index: number, course: CourseDTO): number {
    return course.id;
  }

  get pagedCourses(): CourseDTO[] {
    const start = this.currentPage * this.pageSize;
    return this.courses.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.courses.length / this.pageSize);
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

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}