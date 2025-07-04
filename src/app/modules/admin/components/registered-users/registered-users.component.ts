import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/admin.service';
import { AuthService } from 'src/app/auth/auth.services';
import { User } from 'src/app/modules/user/models/user.model';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-registered-users',
  templateUrl: './registered-users.component.html',
  styleUrls: ['./registered-users.component.css']
})
export class RegisteredUsersComponent implements OnInit {
  users: User[] = [];
  sortedUsers: User[] = [];
  error: string | null = null;
  sortField: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
filteredUsers: User[] = [];
pagedUsers: User[] = [];
pageSize: number = 10;
currentPage: number = 0;


  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog

  ) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.error = 'Please log in as an admin to view users.';
      this.snackBar.open(this.error, 'Close', { duration: 5000 });
      this.router.navigate(['/login']);
      return;
    }
    this.loadUsers();
  }
loadUsers(): void {
  this.userService.getAllUsers().subscribe({
    next: (users) => {
      this.users = users;
      this.filteredUsers = [...users];
      this.sortUsers();
      this.applyPagination();
      this.error = null;
    },
    error: (err) => {
      this.error = err.message;
      if (err.message.includes('Unauthorized')) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    }
  });
}

applyPagination(): void {
  const start = this.currentPage * this.pageSize;
  const end = start + this.pageSize;
  this.pagedUsers = this.filteredUsers.slice(start, end);
}


  deleteUser(user: User): void {
    if (!user.email) {
      this.snackBar.open('User email is missing. Cannot delete.', 'Close', { duration: 4000 });
      return;
    }


    this.userService.deleteUserByEmail(user.email).subscribe({
      next: (res) => {
        this.snackBar.open(res.message, 'Close', { duration: 4000 });
        this.users = this.users.filter(u => u.email !== user.email);
        this.sortUsers();
      },
      error: (err) => {
        const msg = err.message || 'Failed to delete user.';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }
  openDeleteDialog(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete ${user.username}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteUser(user);
      }
    });
  }

sortUsers(): void {
  this.filteredUsers.sort((a, b) => {
    let valueA: string | undefined;
    let valueB: string | undefined;

    switch (this.sortField) {
      case 'name':
        valueA = a.name || a.username || '';
        valueB = b.name || b.username || '';
        break;
      case 'username':
        valueA = a.username || '';
        valueB = b.username || '';
        break;
      case 'email':
        valueA = a.email || '';
        valueB = b.email || '';
        break;
      default:
        return 0;
    }

    const isAsc = this.sortOrder === 'asc';
    return valueA.localeCompare(valueB) * (isAsc ? 1 : -1);
  });

  this.applyPagination();
}
  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortUsers();
  }
  get totalPages(): number {
  return Math.ceil(this.filteredUsers.length / this.pageSize);
}

nextPage(): void {
  if (this.currentPage < this.totalPages - 1) {
    this.currentPage++;
    this.applyPagination();
  }
}

prevPage(): void {
  if (this.currentPage > 0) {
    this.currentPage--;
    this.applyPagination();
  }
}

}