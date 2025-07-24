
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { InstructorDetails } from '../models/instructor-details.model';
import { Course } from '../models/course.model';
import { environment } from 'src/environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private apiUrl = `${environment.apiUrl}/instructor`;

  constructor(private http: HttpClient) {
    console.log('API URL:', this.apiUrl);
  }

  getInstructorDetails(instructorId: number): Observable<InstructorDetails> {
    const url = `${this.apiUrl}/${instructorId}`;
    console.log('Fetching instructor details from:', url);
    return this.http.get<InstructorDetails>(url).pipe(
      map(details => {
        console.log('Instructor details:', details);
        if (details.photoUrl && details.photoUrl.includes('drive.google.com')) {
          details.photoUrl = `${this.apiUrl}/proxy-image?url=${encodeURIComponent(details.photoUrl)}`;
          console.log('Proxied photoUrl:', details.photoUrl);
        }
        return details;
      }),
      catchError(this.handleError)
    );
  }
  getInstructorName(instructorId: number): Observable<string> {
    return this.http.get<{ name: string }>(`${this.apiUrl}/instructor/${instructorId}`).pipe(
      map(instructor => instructor.name),
      catchError(() => of('Unknown Instructor'))
    );
  }

  getCoursesByInstructorId(instructorId: number): Observable<Course[]> {
    const url = `${this.apiUrl}/${instructorId}/courses`;
    console.log('Fetching courses from:', url);
    return this.http.get<Course[]>(url).pipe(
      map(courses => {
        console.log('Courses received:', courses);
        return courses.map(course => {
          if (course.imageUrl && course.imageUrl.includes('drive.google.com')) {
            course.imageUrl = `${this.apiUrl}/proxy-image?url=${encodeURIComponent(course.imageUrl)}`;
            console.log('Proxied course imageUrl:', course.imageUrl);
          }
          return course;
        });
      }),
      catchError(this.handleError)
    );
  }

  getInstructorAverageRating(instructorId: number): Observable<number | null> {
    const url = `${this.apiUrl}/average-rating?instructorId=${instructorId}`;
    console.log('Fetching average rating from:', url);
    return this.http.get<{ instructorId: number, averageRating: number | null, message: string }>(url).pipe(
      map(response => {
        console.log('Average rating response:', response);
        return response.averageRating;
      }),
      catchError(err => {
        if (err.status === 400 && 
            (err.error?.message?.includes('No ratings found') || 
             err.error?.message?.includes('User is not an instructor'))) {
          console.log('No ratings or invalid instructor:', instructorId);
          return of(null);
        }
        return this.handleError(err);
      })
    );
  }

  getEnrollmentCount(instructorId: number): Observable<number> {
    const url = `${this.apiUrl}/${instructorId}/enrollment-count`;
    console.log('Fetching enrollment count from:', url);
    return this.http.get<number>(url).pipe(
      catchError(err => {
        if (err.status === 400 && 
            err.error?.message?.includes('User is not an instructor')) {
          console.log('No enrollments or invalid instructor:', instructorId);
          return of(0);
        }
        return this.handleError(err);
      })
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      errorMessage = `Server-side error: ${error.status} - ${error.error?.message || error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}