import { Component, OnInit } from '@angular/core';
import { FeedbackService } from 'src/app/shared/services/feedback.service';
import { Feedback } from 'src/app/shared/models/feedback.model';

@Component({
  selector: 'app-feedback-list',
  templateUrl: './feedback-list.component.html',
  styleUrls: ['./feedback-list.component.css']
})
export class FeedbackListComponent implements OnInit {
  feedbacks: Feedback[] = [];
  sortField: string = 'courseName';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.loadFeedbacks();
  }

  loadFeedbacks(): void {
    this.feedbackService.getAllFeedbacks().subscribe({
      next: (data) => {
        this.feedbacks = data;
        this.sortFeedbacks(); 
      },
      error: (err) => {
        console.error('Failed to fetch feedbacks:', err);
      }
    });
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortFeedbacks();
  }

  sortFeedbacks(): void {
    this.feedbacks.sort((a, b) => {
      let fieldA = (a as any)[this.sortField];
      let fieldB = (b as any)[this.sortField];

      fieldA = fieldA ?? '';
      fieldB = fieldB ?? '';

      if (this.sortField === 'rating') {
        fieldA = Number(fieldA);
        fieldB = Number(fieldB);
        return this.sortOrder === 'asc' ? fieldA - fieldB : fieldB - fieldA;
      } else {
        fieldA = fieldA.toString().toLowerCase();
        fieldB = fieldB.toString().toLowerCase();
        if (fieldA < fieldB) return this.sortOrder === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return this.sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
    });
  }
}