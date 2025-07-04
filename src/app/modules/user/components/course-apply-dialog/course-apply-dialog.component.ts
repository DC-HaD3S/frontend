import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import { AuthService } from 'src/app/auth/auth.services';
import { Course } from 'src/app/shared/models/course.model';
import { Enrollment } from 'src/app/shared/models/enrollment.model';
import { selectCourseMessage, selectCourseError, selectEnrollments } from 'src/app/store/course/course.selectors';
import { Subject, takeUntil, debounceTime, take } from 'rxjs';
import { clearCourseError, enrollUser } from 'src/app/store/course/course.actions';

@Component({
  selector: 'app-course-apply-dialog',
  templateUrl: './course-apply-dialog.component.html',
  styleUrls: ['./course-apply-dialog.component.css']
})
export class CourseApplyDialogComponent implements OnInit, OnDestroy {
  applyForm: FormGroup;
  username: string | null;
  private destroy$ = new Subject<void>();
  private submitSubject = new Subject<void>();
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<CourseApplyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { course: Course },
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private store: Store<AppState>,
    private snackBar: MatSnackBar
  ) {
    this.username = authService.getUsername();
    this.applyForm = this.formBuilder.group({
      confirmation: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    if (!this.username) {
      this.snackBar.open('Please log in to enroll.', 'Close', { duration: 5000 });
      this.dialogRef.close();
      return;
    }

    this.submitSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => this.handleSubmit());

    this.store.select(selectCourseMessage).pipe(
      takeUntil(this.destroy$)
    ).subscribe(message => {
      if (message && this.isSubmitting) {
        this.snackBar.open(`✅ ${message}`, 'Close', { duration: 5000 });
        this.isSubmitting = false;
        this.dialogRef.close(true);
      }
    });

    this.store.select(selectCourseError).pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      if (error && this.isSubmitting) {
        this.snackBar.open(`Enrollment failed: ${error}`, 'Close', { duration: 5000 });
        this.store.dispatch(clearCourseError());
        this.isSubmitting = false;
        this.dialogRef.close();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.isSubmitting) return;
    this.submitSubject.next();
  }

  private handleSubmit(): void {
    if (!this.applyForm.valid || !this.data.course.id || !this.username) {
      this.snackBar.open('Please confirm enrollment or log in.', 'Close', { duration: 3000 });
      this.dialogRef.close();
      return;
    }

    this.store.select(selectEnrollments).pipe(
      take(1)
    ).subscribe((enrollments: Enrollment[]) => {
      const isEnrolled = enrollments.some((e: Enrollment) => e.courseId === this.data.course.id && e.username === this.username);
 if (isEnrolled) {
  this.snackBar.open('You are already enrolled in this course.', 'Close', { duration: 5000 });
  this.isSubmitting = false;
  this.dialogRef.close();
  return; 
}

      else {
        this.isSubmitting = true;
        this.store.dispatch(enrollUser({
          courseId: this.data.course.id!,
          courseName: this.data.course.title || 'Untitled Course'
        }));
      }
    });
  }

  onCancel(): void {
    this.snackBar.open('Enrollment cancelled.', 'Close', { duration: 3000 });
    this.dialogRef.close();
  }
}