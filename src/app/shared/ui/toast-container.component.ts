import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'inv-toast-container',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class.success]="t.kind === 'success'" [class.error]="t.kind === 'error'" [class.info]="t.kind === 'info'">
          {{ t.message }}
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toasts = inject(ToastService);
}
