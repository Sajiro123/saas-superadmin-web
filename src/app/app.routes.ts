import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TenantsPageComponent } from './pages/tenants/tenants-page.component';
import { SubscriptionsPageComponent } from './pages/subscriptions/subscriptions-page.component';
import { DatabasesPageComponent } from './pages/databases/databases-page.component';
import { AuditPageComponent } from './pages/audit/audit-page.component';
import { UsuariosEmpresasPageComponent } from './pages/usuarios-empresas/usuarios-empresas-page.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'tenants', component: TenantsPageComponent, canActivate: [authGuard] },
  { path: 'usuarios-empresas', component: UsuariosEmpresasPageComponent, canActivate: [authGuard] },
  { path: 'users', component: UsuariosEmpresasPageComponent, canActivate: [authGuard] },
  { path: 'subscriptions', component: SubscriptionsPageComponent, canActivate: [authGuard] },
  { path: 'databases', component: DatabasesPageComponent, canActivate: [authGuard] },
  { path: 'audit', component: AuditPageComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
