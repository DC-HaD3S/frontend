import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseApplyDialogComponent } from './course-apply-dialog.component';

describe('CourseApplyDialogComponent', () => {
  let component: CourseApplyDialogComponent;
  let fixture: ComponentFixture<CourseApplyDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CourseApplyDialogComponent]
    });
    fixture = TestBed.createComponent(CourseApplyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
