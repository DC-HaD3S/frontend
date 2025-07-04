import { NgModule } from '@angular/core';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommonModule } from '@angular/common';

import { FeedbackListComponent } from './components/feedback-list/feedback-list.component';
import { RegisteredUsersComponent } from './components/registered-users/registered-users.component';
import { EnrolledUsersComponent } from './components/enrolled-users/enrolled-users.component';
import { ManageCoursesComponent } from './components/manage-courses/manage-courses.component';

@NgModule({
  declarations: [
    FeedbackListComponent,
    RegisteredUsersComponent,
    EnrolledUsersComponent,
    ManageCoursesComponent,
  ],
  imports: [
    SharedModule,
    CommonModule,
    AdminRoutingModule,
  ],
})
export class AdminModule {}