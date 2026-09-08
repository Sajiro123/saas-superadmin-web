import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-20 transition-colors duration-300">
      <!-- Search Input -->
      <div class="relative w-48 sm:w-72 md:w-80">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        <input type="text" placeholder="Buscar negocio, subdominio..."
               class="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors">
      </div>

      <!-- Quick Actions and Theme Switcher -->
      <div class="flex items-center gap-3">
        <!-- API Online status -->
        <div class="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Master API (Online)</span>
        </div>

        <!-- BOTÓN TEMA SOL / LUNA (GRANDE Y VISIBLE) -->
        <button (click)="themeService.toggleTheme()"
                class="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all text-xs font-bold shadow-md cursor-pointer">
          <!-- Modo Claro -> Muestra icono para pasar a oscuro -->
          <ng-container *ngIf="themeService.theme() === 'light'">
            <i class="fa-solid fa-moon text-indigo-600 text-sm"></i>
            <span class="text-slate-800">Modo Oscuro</span>
          </ng-container>
          <!-- Modo Oscuro -> Muestra icono para pasar a claro -->
          <ng-container *ngIf="themeService.theme() === 'dark'">
            <i class="fa-solid fa-sun text-amber-400 text-sm"></i>
            <span class="text-white">Modo Claro</span>
          </ng-container>
        </button>
      </div>
    </header>
  `
})
export class HeaderComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
}
