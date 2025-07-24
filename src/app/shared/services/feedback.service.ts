import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Feedback } from '../models/feedback.model';
import { environment } from 'src/environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private baseUrl = `${environment.apiUrl}/feedback`;

  constructor(private http: HttpClient) {}

  getAllFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/all`);
  }

  submitFeedback(feedback: Feedback): Observable<string> {
    return this.http.post(`${this.baseUrl}/submit`, feedback, { responseType: 'text' });
  }

  updateFeedback(id: number, feedback: Feedback): Observable<string> {
    return this.http.put(`${this.baseUrl}/${id}`, feedback, { responseType: 'text' });
  }

  deleteFeedback(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }

  getFeedbacksByCourseId(courseId: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/course/${courseId}`);
  }

  getInstructorFeedbackCount(instructorId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/instructor/${instructorId}/feedback-count`);
  }
}