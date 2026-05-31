import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { ToastContainerComponent } from '../ui/toast-container.component';

@Component({
  selector: 'inv-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastContainerComponent],
  template: `
    <div class="shell">
      <inv-sidebar />
      <main class="main">
        <router-outlet />
      </main>
      <inv-toast-container />
    </div>
  `,
  styles: [`
    .shell { display: flex; min-height: 100vh; }
    .main { flex: 1; overflow-x: auto; }
  `],
})
export class ShellComponent {}
