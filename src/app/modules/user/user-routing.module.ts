import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnrolledCoursesComponent } from './components/enrolled-courses/enrolled-courses.component';

import { FeedbackDialogComponent } from './components/feedback/feedback-dialog.component';
import { AuthGuard } from 'src/app/auth/auth.guards';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    data: { role: 'user' },
    children: [
      { path: '', redirectTo: 'enrolled', pathMatch: 'full' }, 
      { path: 'enrolled', component: EnrolledCoursesComponent },
      { path: 'feedback', component: FeedbackDialogComponent }, 
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}