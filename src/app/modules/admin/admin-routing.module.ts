import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeedbackListComponent } from './components/feedback-list/feedback-list.component';
import { EnrolledUsersComponent } from './components/enrolled-users/enrolled-users.component';
import { ManageCoursesComponent } from './components/manage-courses/manage-courses.component';
import { RegisteredUsersComponent } from './components/registered-users/registered-users.component';
import { AuthGuard } from 'src/app/auth/auth.guards';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    data: { role: 'admin' },
    children: [
      { path: '', redirectTo: 'feedbacks', pathMatch: 'full' }, 
      { path: 'feedbacks', component: FeedbackListComponent },
      { path: 'manage-courses', component: ManageCoursesComponent },
      { path: 'enrolled', component: EnrolledUsersComponent },
      { path: 'registered-users', component: RegisteredUsersComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}