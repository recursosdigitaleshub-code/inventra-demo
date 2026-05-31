import { Component, input } from '@angular/core';

@Component({
  selector: 'inv-stat-card',
  standalone: true,
  template: `
    <div class="stat-card" [class.alert]="tone() === 'alert'" [class.warn]="tone() === 'warn'" [class.ok]="tone() === 'ok'">
      <div class="stat-label">{{ label() }}</div>
      <div class="stat-value">{{ value() }}</div>
      @if (hint()) { <div class="stat-hint">{{ hint() }}</div> }
    </div>
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>('');
  readonly tone = input<'default' | 'ok' | 'warn' | 'alert'>('default');
}
