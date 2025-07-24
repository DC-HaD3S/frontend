import { Pipe, PipeTransform } from '@angular/core';
import { Observable, of,catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeedbackService } from 'src/app/shared/services/feedback.service';

@Pipe({
  name: 'asyncFeedbackCount'
})
export class AsyncFeedbackCountPipe implements PipeTransform {
  constructor(private feedbackService: FeedbackService) {}

  transform(courseId: number): Observable<number> {
    if (!courseId) {
      return of(0);
    }
    return this.feedbackService.getFeedbacksByCourseId(courseId).pipe(
      map(feedbacks => feedbacks.length),
      catchError(err => {
        console.error('Failed to fetch feedback count:', err);
        return of(0);
      })
    );
  }
}