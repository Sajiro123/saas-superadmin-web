import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      <!-- Sidebar (Visible only when authenticated) -->
      <app-sidebar *ngIf="authService.isAuthenticated()"></app-sidebar>

      <!-- Main Content Area -->
      <div [class]="authService.isAuthenticated() ? 'flex-1 md:ml-64 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950' : 'flex-1 min-h-screen bg-slate-50 dark:bg-slate-950'">
        <app-header *ngIf="authService.isAuthenticated()"></app-header>
        <main [class]="authService.isAuthenticated() ? 'p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto bg-slate-50 dark:bg-slate-950' : 'bg-slate-50 dark:bg-slate-950'">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AppComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
}
