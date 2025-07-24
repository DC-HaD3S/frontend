import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './shared/components/home/home.component';
import { LoginComponent } from './shared/components/login/login.component';
import { SignupComponent } from './shared/components/signup/signup.component';
import { CourseListComponent } from './shared/components/course-list/course-list.component';
import { CourseDetailsComponent } from './shared/components/course-details-dialog/course-details-dialog.component';
import { AboutUsComponent } from './shared/components/about-us/about-us.component';
import { InstructorPageComponent } from './shared/components/instructor-page/instructor-page.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'courses', component: CourseListComponent },
  { path: 'course-details/:id', component: CourseDetailsComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'instructor/:instructorId', component: InstructorPageComponent },
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule),
  },
  {
    path: 'user',
    loadChildren: () => import('./modules/user/user.module').then(m => m.UserModule),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }