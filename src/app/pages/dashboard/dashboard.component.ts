import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '../../core/services/tenant.service';
import { Tenant, CreateTenantRequest } from '../../core/models/tenant.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard General</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Supervisión en tiempo real de clientes, verticales y bases de datos Supabase</p>
        </div>
        <button (click)="openCreateModal()"
                class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start sm:self-auto">
          <i class="fa-solid fa-plus text-xs"></i>
          <span>Alta de Nuevo Negocio</span>
        </button>
      </div>

      <!-- KPI Metrics Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Negocios</span>
            <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <i class="fa-solid fa-building text-sm"></i>
            </div>
          </div>
          <div class="mt-4">
            <h3 class="text-3xl font-extrabold text-slate-900 dark:text-white">
              <span *ngIf="isLoading()">...</span>
              <span *ngIf="!isLoading()">{{ tenantService.tenantsSignal().length }}</span>
            </h3>
            <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <i class="fa-solid fa-arrow-trend-up"></i>
              <span>100% activos y conectados</span>
            </p>
          </div>
        </div>

        <div class="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ingresos (MRR)</span>
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <i class="fa-solid fa-sack-dollar text-sm"></i>
            </div>
          </div>
          <div class="mt-4">
            <h3 class="text-3xl font-extrabold text-slate-900 dark:text-white">S/. 469.00</h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Recurrencia mensual activa</p>
          </div>
        </div>

        <div class="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vertical Farmacia</span>
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <i class="fa-solid fa-prescription-bottle-medical text-sm"></i>
            </div>
          </div>
          <div class="mt-4">
            <h3 class="text-3xl font-extrabold text-slate-900 dark:text-white">2 Farmacias</h3>
            <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">FEFO & DIGEMID activados</p>
          </div>
        </div>

        <div class="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Supabase Tenants</span>
            <div class="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <i class="fa-solid fa-database text-sm"></i>
            </div>
          </div>
          <div class="mt-4">
            <h3 class="text-3xl font-extrabold text-slate-900 dark:text-white">
              <span *ngIf="isLoading()">...</span>
              <span *ngIf="!isLoading()">{{ tenantService.tenantsSignal().length }} Proyectos</span>
            </h3>
            <p class="text-[11px] text-violet-600 dark:text-violet-400 font-medium mt-1">Aislamiento por silo garantizado</p>
          </div>
        </div>
      </div>

      <!-- Tenants Directory Table Section -->
      <div class="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        <div class="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">Directorio de Inquilinos</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Listado centralizado de clientes y mapeo de bases de datos</p>
            </div>
            <span *ngIf="isLoading()" class="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-medium inline-flex items-center gap-1.5 animate-pulse">
              <i class="fa-solid fa-circle-notch fa-spin text-xs"></i>
              <span>Cargando...</span>
            </span>
          </div>

          <div class="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button (click)="filterVertical.set('ALL')"
                    [class]="filterVertical() === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap">
              Todos ({{ tenantService.tenantsSignal().length }})
            </button>
            <button (click)="filterVertical.set('FARMACIA')"
                    [class]="filterVertical() === 'FARMACIA' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <i class="fa-solid fa-prescription-bottle-medical text-[10px]"></i>
              <span>Farmacias</span>
            </button>
            <button (click)="filterVertical.set('RETAIL')"
                    [class]="filterVertical() === 'RETAIL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <i class="fa-solid fa-shirt text-[10px]"></i>
              <span>Retail</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto w-full">
          <table class="w-full text-left text-xs min-w-[700px]">
            <thead class="bg-slate-100/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th class="px-6 py-4">Negocio / Subdominio</th>
                <th class="px-6 py-4">Vertical</th>
                <th class="px-6 py-4">RUC / ID</th>
                <th class="px-6 py-4">Plan Actual</th>
                <th class="px-6 py-4">Host Supabase (BD)</th>
                <th class="px-6 py-4">Estado</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800/60">
              <ng-container *ngIf="isLoading()">
                <tr *ngFor="let i of [1, 2, 3]" class="animate-pulse">
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36 mb-2"></div><div class="h-3 bg-slate-200/60 dark:bg-slate-800/60 rounded w-24"></div></td>
                  <td class="px-6 py-4"><div class="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/60 dark:bg-slate-800/60 rounded w-28"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/60 dark:bg-slate-800/60 rounded w-28"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/40 dark:bg-slate-800/40 rounded w-44"></div></td>
                  <td class="px-6 py-4"><div class="h-5 bg-slate-200/70 dark:bg-slate-800/70 rounded-full w-16"></div></td>
                  <td class="px-6 py-4 text-right"><div class="h-7 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg w-16 ml-auto"></div></td>
                </tr>
              </ng-container>

              <tr *ngIf="!isLoading() && filteredTenants().length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-slate-500">
                  <i class="fa-solid fa-building text-3xl mb-2 text-slate-400 dark:text-slate-600 block"></i>
                  <span class="text-sm font-medium">No se encontraron negocios registrados</span>
                </td>
              </tr>

              <ng-container *ngIf="!isLoading()">
                <tr *ngFor="let t of filteredTenants()" class="hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td class="px-6 py-4">
                    <div class="font-bold text-slate-900 dark:text-white text-sm">{{ t.nombreComercial }}</div>
                    <div class="text-indigo-600 dark:text-indigo-400 text-xs font-mono mt-0.5">{{ t.subdominio }}.tusistema.com</div>
                  </td>

                  <td class="px-6 py-4">
                    <span *ngIf="t.verticalId === 'FARMACIA'"
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                      <i class="fa-solid fa-prescription-bottle-medical text-[10px]"></i>
                      <span>Farmacia</span>
                    </span>
                    <span *ngIf="t.verticalId === 'RETAIL'"
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-semibold text-[11px]">
                      <i class="fa-solid fa-shirt text-[10px]"></i>
                      <span>Retail</span>
                    </span>
                  </td>

                  <td class="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">{{ t.numeroIdentificacion }}</td>
                  <td class="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">{{ t.planNombre }}</td>

                  <td class="px-6 py-4 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                    <span class="flex items-center gap-1.5">
                      <i class="fa-solid fa-database text-violet-600 dark:text-violet-400 text-[10px]"></i>
                      <span>{{ t.dbHost || 'Pendiente' }}</span>
                    </span>
                  </td>

                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px]"
                          [class]="t.estado === 'ACTIVO' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400'">
                      <span class="w-1.5 h-1.5 rounded-full" [class]="t.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                      <span>{{ t.estado }}</span>
                    </span>
                  </td>

                  <td class="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                    <button (click)="openEditModal(t)" title="Editar Negocio"
                            class="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <i class="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                    <button (click)="openDeleteModal(t)" title="Eliminar Negocio"
                            class="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal: Nuevo Negocio -->
    <div *ngIf="isModalOpen()" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <i class="fa-solid fa-plus text-indigo-600 dark:text-indigo-400"></i>
            <span>Registrar Nuevo Inquilino</span>
          </h3>
          <button (click)="isModalOpen.set(false)" class="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form (ngSubmit)="saveTenant()" class="space-y-3.5 text-xs">
          <div>
            <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nombre Comercial</label>
            <input type="text" [(ngModel)]="newTenant.nombreComercial" name="nombreComercial" required
                   placeholder="Botica San Martín" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Subdominio</label>
              <input type="text" [(ngModel)]="newTenant.subdominio" name="subdominio" required
                     placeholder="botica-san-martin" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">RUC / Identificación</label>
              <input type="text" [(ngModel)]="newTenant.numeroIdentificacion" name="numeroIdentificacion" required
                     placeholder="20601299881" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Vertical</label>
              <select [(ngModel)]="newTenant.verticalId" name="verticalId" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
                <option value="FARMACIA">💊 Farmacia</option>
                <option value="RETAIL">👕 Retail / Ropa</option>
                <option value="RESTAURANTE">🍽️ Restaurante</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Plan</label>
              <select [(ngModel)]="newTenant.planId" name="planId" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
                <option value="PLAN_ELEMENTAL_FARMACIA">Plan Elemental Farmacia (S/. 120)</option>
                <option value="PLAN_PRO_FARMACIA">Plan Pro Farmacia (S/. 250)</option>
                <option value="PLAN_BASICO_RETAIL">Plan Básico Retail (S/. 99)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email del Propietario</label>
            <input type="email" [(ngModel)]="newTenant.emailContacto" name="emailContacto" required
                   placeholder="propietario@botica.pe" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
          </div>

          <div>
            <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Host de Base de Datos Supabase (Opcional)</label>
            <input type="text" [(ngModel)]="newTenant.dbHost" name="dbHost"
                   placeholder="db.xxxxxxxxxxxx.supabase.co" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
          </div>

          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button type="button" (click)="isModalOpen.set(false)" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Cancelar</button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30">Guardar Negocio</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Editar Negocio -->
    <div *ngIf="editingTenant()" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <i class="fa-solid fa-pen-to-square text-amber-500"></i>
            <span>Editar Inquilino: {{ editingTenant()?.nombreComercial }}</span>
          </h3>
          <button (click)="editingTenant.set(null)" class="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form (ngSubmit)="saveEditTenant()" class="space-y-3.5 text-xs">
          <div>
            <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nombre Comercial</label>
            <input type="text" [(ngModel)]="editForm.nombreComercial" name="nombreComercial" required
                   class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
          </div>

          <div>
            <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Razón Social</label>
            <input type="text" [(ngModel)]="editForm.razonSocial" name="razonSocial" required
                   class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">RUC / Identificación</label>
              <input type="text" [(ngModel)]="editForm.numeroIdentificacion" name="numeroIdentificacion" required
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Estado</label>
              <select [(ngModel)]="editForm.estado" name="estado" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
                <option value="ACTIVO">🟢 ACTIVO</option>
                <option value="SUSPENDIDO">🟡 SUSPENDIDO</option>
                <option value="INACTIVO">🔴 INACTIVO</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Vertical</label>
              <select [(ngModel)]="editForm.verticalId" name="verticalId" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
                <option value="FARMACIA">💊 Farmacia</option>
                <option value="RETAIL">👕 Retail / Ropa</option>
                <option value="RESTAURANTE">🍽️ Restaurante</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Plan</label>
              <select [(ngModel)]="editForm.planId" name="planId" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
                <option value="PLAN_ELEMENTAL_FARMACIA">Plan Elemental Farmacia (S/. 120)</option>
                <option value="PLAN_PRO_FARMACIA">Plan Pro Farmacia (S/. 250)</option>
                <option value="PLAN_BASICO_RETAIL">Plan Básico Retail (S/. 99)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email de Contacto</label>
            <input type="email" [(ngModel)]="editForm.emailContacto" name="emailContacto" required
                   class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
          </div>

          <div>
            <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Host de Base de Datos Supabase</label>
            <input type="text" [(ngModel)]="editForm.dbHost" name="dbHost"
                   placeholder="db.xxxxxxxxxxxx.supabase.co"
                   class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
          </div>

          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button type="button" (click)="editingTenant.set(null)" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Cancelar</button>
            <button type="submit" [disabled]="isSubmitting()"
                    class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-600/30 flex items-center gap-1.5 disabled:opacity-50">
              <i *ngIf="isSubmitting()" class="fa-solid fa-circle-notch fa-spin"></i>
              <span>{{ isSubmitting() ? 'Guardando...' : 'Guardar Cambios' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Confirmar Eliminación -->
    <div *ngIf="deletingTenant()" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-rose-500/40 shadow-2xl space-y-4">
        <div class="flex items-center gap-3 text-rose-500">
          <div class="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <i class="fa-solid fa-triangle-exclamation text-lg"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">¿Eliminar este negocio?</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Estás a punto de eliminar definitivamente a <strong class="text-slate-900 dark:text-white font-bold">{{ deletingTenant()?.nombreComercial }}</strong> (<code class="text-indigo-600 dark:text-indigo-400">{{ deletingTenant()?.subdominio }}</code>).
        </p>

        <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button (click)="deletingTenant.set(null)" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">Cancelar</button>
          <button (click)="confirmDelete()" [disabled]="isSubmitting()"
                  class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50">
            <i *ngIf="isSubmitting()" class="fa-solid fa-circle-notch fa-spin"></i>
            <span>{{ isSubmitting() ? 'Eliminando...' : 'Sí, Eliminar Negocio' }}</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  tenantService = inject(TenantService);

  isLoading = signal<boolean>(true);
  filterVertical = signal<string>('ALL');
  isModalOpen = signal<boolean>(false);

  editingTenant = signal<Tenant | null>(null);
  deletingTenant = signal<Tenant | null>(null);
  isSubmitting = signal<boolean>(false);

  newTenant: CreateTenantRequest = {
    subdominio: '',
    razonSocial: '',
    nombreComercial: '',
    numeroIdentificacion: '',
    verticalId: 'FARMACIA',
    planId: 'PLAN_ELEMENTAL_FARMACIA',
    emailContacto: '',
    dbHost: ''
  };

  editForm = {
    nombreComercial: '',
    razonSocial: '',
    numeroIdentificacion: '',
    verticalId: 'FARMACIA',
    planId: 'PLAN_ELEMENTAL_FARMACIA',
    emailContacto: '',
    telefonoContacto: '',
    estado: 'ACTIVO',
    dbHost: ''
  };

  ngOnInit(): void {
    this.isLoading.set(true);
    this.tenantService.loadTenants().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  filteredTenants(): Tenant[] {
    const list = this.tenantService.tenantsSignal();
    const filter = this.filterVertical();
    if (filter === 'ALL') return list;
    return list.filter(t => t.verticalId === filter);
  }

  openCreateModal(): void {
    this.newTenant = {
      subdominio: '',
      razonSocial: '',
      nombreComercial: '',
      numeroIdentificacion: '',
      verticalId: 'FARMACIA',
      planId: 'PLAN_ELEMENTAL_FARMACIA',
      emailContacto: '',
      dbHost: ''
    };
    this.isModalOpen.set(true);
  }

  saveTenant(): void {
    if (!this.newTenant.razonSocial) {
      this.newTenant.razonSocial = this.newTenant.nombreComercial || this.newTenant.subdominio;
    }

    this.tenantService.createTenant(this.newTenant).subscribe({
      next: () => {
        this.isModalOpen.set(false);
      }
    });
  }

  openEditModal(t: Tenant): void {
    this.editingTenant.set(t);
    this.editForm = {
      nombreComercial: t.nombreComercial,
      razonSocial: t.razonSocial,
      numeroIdentificacion: t.numeroIdentificacion,
      verticalId: t.verticalId,
      planId: t.planId,
      emailContacto: t.emailContacto,
      telefonoContacto: t.telefonoContacto || '',
      estado: t.estado,
      dbHost: t.dbHost || ''
    };
  }

  saveEditTenant(): void {
    const current = this.editingTenant();
    if (!current) return;

    this.isSubmitting.set(true);
    this.tenantService.updateTenant(current.id, this.editForm).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.editingTenant.set(null);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err.error?.message || 'Error al actualizar negocio');
      }
    });
  }

  openDeleteModal(t: Tenant): void {
    this.deletingTenant.set(t);
  }

  confirmDelete(): void {
    const current = this.deletingTenant();
    if (!current) return;

    this.isSubmitting.set(true);
    this.tenantService.deleteTenant(current.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.deletingTenant.set(null);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err.error?.message || 'Error al eliminar negocio');
      }
    });
  }
}
