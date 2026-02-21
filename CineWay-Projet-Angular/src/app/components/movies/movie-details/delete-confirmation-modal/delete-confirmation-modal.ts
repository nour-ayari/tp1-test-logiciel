import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-delete-confirmation-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div class="fixed inset-0 z-999 bg-black/70 backdrop-blur-sm" (click)="onCancel()"></div>

      <!-- Modal -->
      <div class="fixed inset-0 z-1000 flex items-center justify-center">
        <div
          class="w-full max-w-md rounded-2xl bg-gray-950 border border-white/10 shadow-2xl overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 pt-6 pb-1 border-b border-white/10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
              </div>
              <div>
                <h3 class="text-white text-lg font-semibold">Delete Review</h3>
                <p class="text-sm text-gray-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="px-6 pb-2 pt-4">
            <p class="text-gray-300 leading-relaxed">
              Are you sure you want to delete this review? This action cannot be undone and the
              review will be permanently removed.
            </p>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 px-6 pb-4">
            <button
              type="button"
              class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 rounded-xl transition"
              (click)="onCancel()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl transition"
              (click)="onConfirm()"
            >
              Delete Review
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [],
})
export class DeleteConfirmationModal {
  open = input.required<boolean>();

  confirm = output<void>();
  cancel = output<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
