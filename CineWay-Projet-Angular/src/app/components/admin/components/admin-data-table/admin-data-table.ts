import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  format?: ((value: any) => string) | 'date' | 'status' | 'role';
}

export interface TableAction {
  type: string;
  label: string;
}

@Component({
  selector: 'app-admin-data-table',
  imports: [CommonModule],
  templateUrl: './admin-data-table.html',
  styleUrls: ['./admin-data-table.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDataTableComponent {
  // Inputs
  data = input.required<any[]>();
  columns = input.required<TableColumn[]>();
  actions = input<TableAction[]>([
    { type: 'edit', label: 'Edit' },
    { type: 'delete', label: 'Delete' },
  ]);
  loading = input<boolean>(false);

  // Outputs
  actionClicked = output<{ action: string; row: any }>();

  // Computed
  displayHeaders = computed(() => {
    const cols = this.columns();
    return [...cols, { label: 'Actions', key: 'actions', align: 'right' as const }];
  });

  onAction(action: string, row: any) {
    this.actionClicked.emit({ action, row });
  }

  getColumnValue(row: any, column: TableColumn): string {
    const value = this.getNestedValue(row, column.key);

    if (typeof column.format === 'function') {
      return column.format(value);
    }

    if (column.format === 'date') {
      const d = value ? new Date(value) : null;
      return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : 'N/A';
    }

    if (column.format === 'status') {
      return value ? 'Active' : 'Inactive';
    }

    if (column.format === 'role') {
      return value ? 'Admin' : 'User';
    }

    return String(value ?? 'N/A');
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }
}
