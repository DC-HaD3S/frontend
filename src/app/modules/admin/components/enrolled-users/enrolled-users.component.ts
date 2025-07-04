import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { UserService } from '../../services/admin.service';


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
  displayedColumns: string[] = ['username', 'email', 'courses'];
  dataSource = new MatTableDataSource<EnrolledUser>();

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient,private userService: UserService) {}


  ngOnInit(): void {
    this.userService.getEnrolledUsers().subscribe({
      next: (data) => {
        this.dataSource.data = this.groupEnrollmentsByUser(data);
        this.dataSource.sort = this.sort;
      },
      error: () => {
        console.error('Failed to load enrolled users');
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
}
