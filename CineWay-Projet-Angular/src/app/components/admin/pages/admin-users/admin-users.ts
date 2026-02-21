import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserModel } from '../../../../models/user.model';
import { UserApi } from '../../../../services/user-api';
import { PaginationComponent } from '../../components/pagination/pagination';
import { PrimaryButtonComponent } from '../../components/primary-button/primary-button';
import { SearchInputComponent } from '../../components/search-input/search-input';
import {
  AdminDataTableComponent,
  TableColumn,
  TableAction,
} from '../../components/admin-data-table/admin-data-table';

@Component({
  selector: 'app-admin-users',
  imports: [
    CommonModule,
    PaginationComponent,
    PrimaryButtonComponent,
    SearchInputComponent,
    AdminDataTableComponent,
  ],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.css'],
})
export class AdminUsersComponent implements OnInit {
  private router = inject(Router);
  private usersApi = inject(UserApi);
  private destroyRef = inject(DestroyRef);

  readonly tableColumns: TableColumn[] = [
    { key: 'full_name', label: 'User Name', width: '25%' },
    { key: 'email', label: 'Email', width: '30%' },
    { key: 'created_at', label: 'Joined', width: '20%', format: 'date' },
    { key: 'is_admin', label: 'Role', width: '15%', format: 'role' },
  ];

  readonly tableActions: TableAction[] = [
    { type: 'edit', label: 'Edit' },
    { type: 'delete', label: 'Delete' },
  ];

  readonly users = signal<UserModel[]>([]);
  readonly searchQuery = signal<string>('');
  readonly roleFilter = signal<string>('all');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly page = signal(1);
  private readonly itemsPerPage = 10;

  readonly roleOptions = [
    { label: 'All Roles', value: 'all' },
    { label: 'User', value: 'user' },
    { label: 'Admin', value: 'admin' },
  ];

  readonly filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const role = this.roleFilter();

    return this.users().filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);

      const matchesRole =
        role === 'all' ||
        (role === 'admin' && user.is_admin) ||
        (role === 'user' && !user.is_admin);

      return matchesSearch && matchesRole;
    });
  });

  readonly totalPages = computed(() => Math.ceil(this.filteredUsers().length / this.itemsPerPage));

  readonly paginatedUsers = computed(() => {
    const start = (this.page() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredUsers().slice(start, end);
  });

  readonly startIndex = computed(() => (this.page() - 1) * this.itemsPerPage + 1);
  readonly endIndex = computed(() =>
    Math.min(this.page() * this.itemsPerPage, this.filteredUsers().length),
  );

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.usersApi
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load users');
          this.loading.set(false);
        },
      });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.page.set(1);
  }

  onRoleChange(role: string): void {
    this.roleFilter.set(role);
    this.page.set(1);
  }

  onAddUser(): void {
    this.router.navigate(['/admin/users/add']);
  }

  onTableAction(event: { action: string; row: UserModel }): void {
    if (event.action === 'edit') {
      this.router.navigate(['/admin/users/edit', event.row.id]);
    } else if (event.action === 'delete') {
      this.onDeleteUser(event.row);
    }
  }

  private onDeleteUser(user: UserModel): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${user.full_name}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    this.usersApi
      .deleteUser(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.users.update((users) => users.filter((u) => u.id !== user.id));
        },
        error: (err) => {
          this.error.set('Failed to delete user');
        },
      });
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
    }
  }
}
