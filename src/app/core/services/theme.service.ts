import { Injectable, signal, effect } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Default is 'light' (white)
  theme = signal<AppTheme>((localStorage.getItem('saas-theme') as AppTheme) || 'light');

  constructor() {
    this.applyTheme(this.theme());

    effect(() => {
      const current = this.theme();
      this.applyTheme(current);
      localStorage.setItem('saas-theme', current);
    });
  }

  toggleTheme(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
  }

  setTheme(t: AppTheme): void {
    this.theme.set(t);
  }

  private applyTheme(t: AppTheme): void {
    const root = document.documentElement;
    const body = document.body;

    if (t === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }
}
