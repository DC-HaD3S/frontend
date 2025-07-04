import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FeedbackService } from 'src/app/shared/services/feedback.service';
import { AuthService } from 'src/app/auth/auth.services';
import { Feedback } from 'src/app/shared/models/feedback.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-feedback-dialog',
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.css']
})
export class FeedbackDialogComponent implements OnInit, OnDestroy {
  feedbackForm: FormGroup;
  enrolledCourses: { courseId: number; courseName: string }[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FeedbackDialogComponent>,
    private snackBar: MatSnackBar,
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: {
      courseId?: number;
      courseName?: string;
      rating?: number;
      comments?: string;
      feedbackId?: number;
      enrolledCourses: { courseId: number; courseName: string }[];
    }
  ) {
    this.feedbackForm = this.fb.group({
      courseId: [data.courseId || '', Validators.required],
      rating: [data.rating || '', [Validators.required, Validators.min(0.5), Validators.max(5)]],
      comments: [data.comments || '', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
    this.enrolledCourses = data.enrolledCourses || [];
  }

  ngOnInit(): void {
    if (this.enrolledCourses.length === 0) {
      this.snackBar.open('No enrolled courses available', 'Close', { duration: 5000 });
      this.dialogRef.close();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setRating(rating: number): void {
    this.feedbackForm.get('rating')?.setValue(rating);
    this.feedbackForm.get('rating')?.markAsTouched();
  }

  onSubmit(): void {
    if (this.feedbackForm.valid) {
      const username = this.authService.getUsername();
      if (!username) {
        this.snackBar.open('Please log in to submit feedback', 'Close', { duration: 3000 });
        this.dialogRef.close();
        this.authService.logout();
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        return;
      }

      const courseId = this.feedbackForm.value.courseId;
      const selectedCourse = this.enrolledCourses.find(
        course => course.courseId === courseId
      );

      if (!selectedCourse) {
        this.snackBar.open('Selected course not found', 'Close', { duration: 5000 });
        this.dialogRef.close();
        return;
      }

      const payload: Feedback = {
        id: this.data.feedbackId,
        username,
        courseId: courseId,
        courseName: selectedCourse.courseName || this.data.courseName || '',
        rating: this.feedbackForm.value.rating,
        comments: this.feedbackForm.value.comments
      };

      const action = this.data.feedbackId
        ? this.feedbackService.updateFeedback(this.data.feedbackId, payload)
        : this.feedbackService.submitFeedback(payload);

      action.pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.dialogRef.close({ message: this.data.feedbackId ? 'Feedback updated successfully' : 'Feedback submitted successfully' });
        },
        error: (err) => {
          console.error('FeedbackDialogComponent: Feedback submission error:', err);
          const errorMessage = err.error?.error || (this.data.feedbackId ? 'Failed to update feedback' : 'Failed to submit feedback');
          this.snackBar.open(`❌ ${errorMessage}`, 'Close', { duration: 5000 });
          this.dialogRef.close();
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}