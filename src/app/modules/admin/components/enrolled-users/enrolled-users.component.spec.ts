import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrolledUsersComponent } from './enrolled-users.component';

describe('EnrolledUsersComponent', () => {
  let component: EnrolledUsersComponent;
  let fixture: ComponentFixture<EnrolledUsersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EnrolledUsersComponent]
    });
    fixture = TestBed.createComponent(EnrolledUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
