import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Course } from 'src/app/shared/models/course.model';
import { CourseService } from 'src/app/shared/services/course.service';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component'; // ensure path is correct
import { MatPaginator } from '@angular/material/paginator'; 


@Component({
    selector: 'app-manage-courses',
    templateUrl: './manage-courses.component.html',
    styleUrls: ['./manage-courses.component.css']
})
export class ManageCoursesComponent implements OnInit {
    dataSource = new MatTableDataSource<Course>();
    displayedColumns: string[] = ['title', 'body', 'imageUrl', 'price', 'actions'];
  newCourse: Course = { title: '', body: '', imageUrl: '', price: 0, instructor: '', instructorId:0 };
    editedCourse: Course | null = null;
    error: string | null = null;

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild('addCourseDialog') addCourseDialog!: TemplateRef<any>;
    @ViewChild('editCourseDialog') editCourseDialog!: TemplateRef<any>;
    @ViewChild('deleteConfirmDialog') deleteConfirmDialog!: TemplateRef<any>;
@ViewChild(MatPaginator) paginator!: MatPaginator;

    constructor(
        private courseService: CourseService,
        public dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.loadCourses();
        this.dataSource.sort = this.sort;
    }
ngAfterViewInit(): void {
  this.dataSource.sort = this.sort;
  this.dataSource.paginator = this.paginator; 
  this.dataSource.sortData = (data: Course[], sort: MatSort): Course[] => {
    const active = sort.active;
    const direction = sort.direction;
    if (!active || direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = direction === 'asc';
      switch (active) {
        case 'title':
          return this.compare(a.title, b.title, isAsc);
        case 'body':
          return this.compare(a.body, b.body, isAsc);
        case 'price':
          return this.compare(a.price, b.price, isAsc);
        default:
          return 0;
      }
    });
  };
}


private compare(a: number | string, b: number | string, isAsc: boolean): number {
  if (typeof a === 'string' && typeof b === 'string') {
    return (a.localeCompare(b)) * (isAsc ? 1 : -1);
  }
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

    loadCourses(): void {
        this.courseService.getCourses().subscribe({
            next: (courses) => {
                this.dataSource.data = courses;
                this.error = null;
            },
            error: (err) => {
                this.error = err.message || 'Failed to load courses';
                console.error('Failed to load courses:', err);
            }
        });
    }

    openAddCourse(): void {
        this.newCourse = { title: '', body: '', imageUrl: '', price: 0, instructor:'',instructorId:0 };
        this.dialog.open(this.addCourseDialog);
    }

    addCourse(): void {
        if (this.isCourse(this.newCourse)) {
            const courseToAdd = { ...this.newCourse };
            delete courseToAdd.id;
            this.courseService.addCourse(courseToAdd).subscribe({
                next: (response) => {
                    this.snackBar.open(response.message, 'Close', { duration: 3000 });
                    this.loadCourses();
                    this.dialog.closeAll();
                    this.error = null;
                },
                error: (err) => {
                    this.error = err.message || 'Failed to add course';
                    console.error('Add course failed:', err);
                }
            });
        } else {
            this.snackBar.open('Invalid course data', 'Close', { duration: 3000 });
        }
    }

    openEditCourseDialog(course: Course): void {
        this.editedCourse = { ...course };
        this.dialog.open(this.editCourseDialog);
    }

    updateCourse(): void {
        if (this.editedCourse && this.editedCourse.id && this.isCourse(this.editedCourse)) {
            this.courseService.updateCourse(this.editedCourse).subscribe({
                next: (response) => {
                    this.snackBar.open(response.message, 'Close', { duration: 3000 });
                    this.loadCourses();
                    this.dialog.closeAll();
                    this.editedCourse = null;
                    this.error = null;
                },
                error: (err) => {
                    this.error = err.message || 'Failed to update course';
                    console.error('Update course failed:', err);
                }
            });
        } else {
            this.error = 'Please fill in all required fields';
            this.snackBar.open('Invalid course data', 'Close', { duration: 3000 });
        }
    }

openDeleteConfirmDialog(course: Course): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '350px',
    data: {
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete the course "${course.title}"?`
    }
  });

  dialogRef.afterClosed().subscribe((confirmed: boolean) => {
    if (confirmed) {
      this.courseService.deleteCourse(course.id!).subscribe({
        next: (response) => {
          this.snackBar.open(response.message, 'Close', { duration: 3000 });
          this.loadCourses();
          this.error = null;
        },
        error: (err) => {
          this.error = err.message || 'Failed to delete course';
          console.error('Delete course failed:', err);
          this.snackBar.open('Failed to delete course', 'Close', { duration: 3000 });
        }
      });
    }
  });
}
    cancelEdit(): void {
        this.editedCourse = null;
        this.dialog.closeAll();
    }

    private isCourse(course: Course): boolean {
        return !!course.title && !!course.body && course.price !== null && course.price >= 0;
    }
}