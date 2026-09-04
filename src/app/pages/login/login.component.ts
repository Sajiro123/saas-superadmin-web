import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      <!-- Ambient Glow -->
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- BOTÓN SOL/LUNA EN LA ESQUINA SUPERIOR DERECHA -->
      <div class="absolute top-6 right-6 z-20">
        <button (click)="themeService.toggleTheme()"
                class="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all text-xs font-bold shadow-md text-slate-800 dark:text-white cursor-pointer">
          <i *ngIf="themeService.theme() === 'light'" class="fa-solid fa-moon text-indigo-600 text-sm"></i>
          <i *ngIf="themeService.theme() === 'dark'" class="fa-solid fa-sun text-amber-400 text-sm"></i>
          <span>{{ themeService.theme() === 'light' ? 'Modo Oscuro' : 'Modo Claro' }}</span>
        </button>
      </div>

      <div class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto">
            <i class="fa-solid fa-layer-group text-white text-xl"></i>
          </div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">SaaS Superadmin</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Panel Central de Control Multi-Tenant</p>
        </div>

        <div *ngIf="errorMessage()" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2.5">
          <i class="fa-solid fa-circle-exclamation text-sm"></i>
          <span>{{ errorMessage() }}</span>
        </div>

        <form (ngSubmit)="login()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Correo Electrónico</label>
            <div class="relative">
              <i class="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input type="email" [(ngModel)]="email" name="email" required
                     placeholder="admin@tusistema.com"
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Contraseña</label>
            <div class="relative">
              <i class="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" required
                     placeholder="••••••••••••"
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono">
              <button type="button" (click)="showPassword.set(!showPassword())"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i class="fa-solid" [class]="showPassword() ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
          </div>

          <button type="submit" [disabled]="isLoading()"
                  class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
            <i *ngIf="isLoading()" class="fa-solid fa-circle-notch fa-spin text-xs"></i>
            <span>{{ isLoading() ? 'Iniciando sesión...' : 'Ingresar al Panel' }}</span>
          </button>
        </form>

        <div class="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Credencial Superadmin Master:</p>
          <button (click)="fillDemo()" type="button"
                  class="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 text-[11px] font-mono border border-indigo-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 font-bold cursor-pointer">
            <i class="fa-solid fa-key text-xs"></i>
            <span>fintosadark&#64;gmail.com / 5834067Alex$</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  router = inject(Router);

  email = 'fintosadark@gmail.com';
  password = '5834067Alex$';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  login(): void {
    if (!this.email || !this.password) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Credenciales incorrectas o error en el servidor');
      }
    });
  }

  fillDemo(): void {
    this.email = 'fintosadark@gmail.com';
    this.password = '5834067Alex$';
  }
}
