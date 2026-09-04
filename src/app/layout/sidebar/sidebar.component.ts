import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 shadow-sm transition-colors duration-300">
      <!-- Logo SaaS Header -->
      <div class="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <i class="fa-solid fa-layer-group text-white text-base"></i>
        </div>
        <div>
          <h1 class="text-sm font-bold text-slate-900 dark:text-white tracking-wide">SaaS Master</h1>
          <p class="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">Control Plane</p>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <a routerLink="/dashboard" routerLinkActive="bg-indigo-600 text-white shadow-lg shadow-indigo-600/25" [routerLinkActiveOptions]="{exact: true}"
           class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-sm font-medium group">
          <i class="fa-solid fa-chart-pie w-5 text-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"></i>
          <span>Dashboard</span>
        </a>

        <a routerLink="/tenants" routerLinkActive="bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
           class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-sm font-medium group">
          <i class="fa-solid fa-building w-5 text-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"></i>
          <span>Negocios (Tenants)</span>
        </a>

        <a routerLink="/usuarios-empresas" routerLinkActive="bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
           class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-sm font-medium group">
          <i class="fa-solid fa-users-gear w-5 text-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"></i>
          <span>Usuarios por Empresa</span>
        </a>

        <a routerLink="/subscriptions" routerLinkActive="bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
           class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-sm font-medium group">
          <i class="fa-solid fa-credit-card w-5 text-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"></i>
          <span>Suscripciones & Planes</span>
        </a>

        <a routerLink="/databases" routerLinkActive="bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
           class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-sm font-medium group">
          <i class="fa-solid fa-database w-5 text-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"></i>
          <span>Bases de Datos Supabase</span>
        </a>

        <a routerLink="/audit" routerLinkActive="bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
           class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-sm font-medium group">
          <i class="fa-solid fa-shield-halved w-5 text-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"></i>
          <span>Auditoría de Eventos</span>
        </a>
      </nav>

      <!-- THEME SWITCHER CARD (SUPER PROMINENTE EN EL SIDEBAR) -->
      <div class="px-4 py-2">
        <button (click)="themeService.toggleTheme()"
                class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 transition-all text-xs font-semibold shadow-sm group">
          <span class="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
            <span class="w-6 h-6 rounded-lg flex items-center justify-center"
                  [class]="themeService.theme() === 'light' ? 'bg-amber-500/20 text-amber-600' : 'bg-indigo-500/20 text-indigo-400'">
              <i *ngIf="themeService.theme() === 'light'" class="fa-solid fa-sun text-xs"></i>
              <i *ngIf="themeService.theme() === 'dark'" class="fa-solid fa-moon text-xs"></i>
            </span>
            <span>{{ themeService.theme() === 'light' ? 'Modo Claro (Blanco)' : 'Modo Oscuro' }}</span>
          </span>
          <span class="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
            Cambiar
          </span>
        </button>
      </div>

      <!-- User Profile & Logout -->
      <div class="p-4 border-t border-slate-200 dark:border-slate-800">
        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              SA
            </div>
            <div class="truncate">
              <p class="text-xs font-semibold text-slate-900 dark:text-white truncate">{{ authService.currentUser()?.email || 'Superadmin' }}</p>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Superadmin</p>
            </div>
          </div>
          <button (click)="logout()" title="Cerrar sesión"
                  class="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors">
            <i class="fa-solid fa-arrow-right-from-bracket text-sm"></i>
          </button>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  logout(): void {
    this.authService.logout();
  }
}
