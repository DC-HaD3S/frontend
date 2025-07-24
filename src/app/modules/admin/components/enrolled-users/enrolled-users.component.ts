import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../services/admin.service';
import { UserDetailsDialogComponent } from '../user-details-dialog.component/user-details-dialog.component';

interface RawEnrollment {
  username: string;
  courseId: number;
  courseName: string;
}

interface EnrolledUser {
  name: string;
  email: string;
  username: string;
  enrolledCourses: { courseId: number; courseName: string }[];
}

@Component({
  selector: 'app-enrolled-users',
  templateUrl: './enrolled-users.component.html',
  styleUrls: ['./enrolled-users.component.css']
})
export class EnrolledUsersComponent implements OnInit {
  displayedColumns: string[] = ['username', 'email', 'courseCount', 'courses', 'actions'];
  dataSource = new MatTableDataSource<EnrolledUser>();
  tableDataSource = new MatTableDataSource<EnrolledUser>();
  
  enrolledUsers: EnrolledUser[] = [];
  filteredUsers: EnrolledUser[] = [];
  searchTerm: string = '';
  viewMode: 'cards' | 'table' = 'cards';
  loading: boolean = true;
  error: string | null = null;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadEnrolledUsers();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.tableDataSource.sort = this.sort;
  }

  loadEnrolledUsers(): void {
    this.loading = true;
    this.error = null;

    this.userService.getEnrolledUsers().subscribe({
      next: (data) => {
        this.enrolledUsers = this.groupEnrollmentsByUser(data);
        this.dataSource.data = this.enrolledUsers;
        this.filteredUsers = [...this.enrolledUsers];
        this.tableDataSource.data = this.enrolledUsers;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load enrolled users:', err);
        this.error = 'Failed to load enrolled users. Please try again.';
        this.loading = false;
      }
    });
  }

  groupEnrollmentsByUser(data: RawEnrollment[]): EnrolledUser[] {
    const userMap: { [username: string]: EnrolledUser } = {};

    data.forEach((enrollment) => {
      if (!userMap[enrollment.username]) {
        userMap[enrollment.username] = {
          name: enrollment.username,
          email: `${enrollment.username}@example.com`, 
          username: enrollment.username,
          enrolledCourses: []
        };
      }
      userMap[enrollment.username].enrolledCourses.push({
        courseId: enrollment.courseId,
        courseName: enrollment.courseName
      });
    });

    return Object.values(userMap);
  }

  applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.enrolledUsers];
    } else {
      const searchLower = this.searchTerm.toLowerCase().trim();
      this.filteredUsers = this.enrolledUsers.filter(user => {
        const usernameMatch = user.username.toLowerCase().includes(searchLower);
        const emailMatch = user.email.toLowerCase().includes(searchLower);
        const coursesMatch = user.enrolledCourses.some(course => 
          course.courseName.toLowerCase().includes(searchLower)
        );
        return usernameMatch || emailMatch || coursesMatch;
      });
    }
    this.tableDataSource.data = this.filteredUsers;
  }

  setViewMode(mode: 'cards' | 'table'): void {
    this.viewMode = mode;
  }

  getTotalCourses(): number {
    return this.enrolledUsers.reduce((total, user) => total + user.enrolledCourses.length, 0);
  }
  openUserDetails(user: EnrolledUser): void {
    const dialogRef = this.dialog.open(UserDetailsDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: user,
      panelClass: 'user-details-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog closed with result:', result);
      }
    });
  }
}
