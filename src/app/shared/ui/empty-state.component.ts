import { Component, input } from '@angular/core';

@Component({
  selector: 'inv-empty-state',
  standalone: true,
  template: `
    <div class="empty">
      <div class="empty-icon">{{ icon() }}</div>
      <div><strong>{{ title() }}</strong></div>
      @if (description()) { <div style="margin-top:4px">{{ description() }}</div> }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input('📦');
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
