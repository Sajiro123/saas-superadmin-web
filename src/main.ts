import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Set initial theme directly to avoid flash of dark mode
const savedTheme = localStorage.getItem('saas-theme') || 'light';
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
  document.body.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
  document.body.classList.remove('dark');
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
