import { Component } from '@angular/core';
import { ShellComponent } from './shared/layout/shell.component';

@Component({
  selector: 'inv-root',
  standalone: true,
  imports: [ShellComponent],
  template: `<inv-shell />`,
})
export class AppComponent {}
