import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TenantService } from '../../core/services/tenant.service';
import { Tenant, CreateTenantRequest, ApiResponse } from '../../core/models/tenant.model';

export interface PlanSimple {
  id: string;
  nombre: string;
  verticalId?: string;
  precioMensual: number;
  maxSucursales: number;
  maxUsuarios: number;
  estaActivo: boolean;
}

@Component({
  selector: 'app-tenants-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <i class="fa-solid fa-building text-indigo-600 dark:text-indigo-400"></i>
            <span>Gestión de Inquilinos (Tenants)</span>
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Directorio completo con operaciones de edición, asignación de planes y baja definitiva</p>
        </div>
        <button (click)="openCreateModal()"
                class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer">
          <i class="fa-solid fa-plus text-xs"></i>
          <span>Nuevo Negocio</span>
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md w-full">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Buscar por nombre, subdominio o RUC..."
                 class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500">
        </div>

        <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button (click)="filterVertical.set('ALL')"
                  [class]="filterVertical() === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                  class="px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors whitespace-nowrap cursor-pointer">
            Todos ({{ tenantService.tenantsSignal().length }})
          </button>
          <button (click)="filterVertical.set('FARMACIA')"
                  [class]="filterVertical() === 'FARMACIA' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                  class="px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
            <i class="fa-solid fa-prescription-bottle-medical text-[10px]"></i>
            <span>Farmacias</span>
          </button>
          <button (click)="filterVertical.set('RETAIL')"
                  [class]="filterVertical() === 'RETAIL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                  class="px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
            <i class="fa-solid fa-shirt text-[10px]"></i>
            <span>Retail</span>
          </button>
          <button (click)="filterVertical.set('RESTAURANTE')"
                  [class]="filterVertical() === 'RESTAURANTE' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                  class="px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
            <i class="fa-solid fa-utensils text-[10px]"></i>
            <span>Restaurante</span>
          </button>
        </div>
      </div>

      <!-- Tenants Table -->
      <div class="glass-panel rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
        <div class="overflow-x-auto w-full">
          <table class="w-full text-left text-xs min-w-[700px]">
            <thead class="bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th class="px-6 py-4">Negocio</th>
                <th class="px-6 py-4">Vertical</th>
                <th class="px-6 py-4">Plan Actual</th>
                <th class="px-6 py-4">Subdominio</th>
                <th class="px-6 py-4">Estado</th>
                <th class="px-6 py-4">Base de Datos</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800/60">
              <ng-container *ngIf="isLoading()">
                <tr *ngFor="let i of [1, 2, 3]" class="animate-pulse">
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32 mb-1.5"></div><div class="h-3 bg-slate-200/60 dark:bg-slate-800/60 rounded w-20"></div></td>
                  <td class="px-6 py-4"><div class="h-5 bg-slate-200/70 dark:bg-slate-800/70 rounded-full w-20"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/60 dark:bg-slate-800/60 rounded w-24"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/50 dark:bg-slate-800/50 rounded w-28"></div></td>
                  <td class="px-6 py-4"><div class="h-5 bg-slate-200/70 dark:bg-slate-800/70 rounded-full w-16"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/40 dark:bg-slate-800/40 rounded w-36"></div></td>
                  <td class="px-6 py-4 text-right"><div class="h-8 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl w-20 ml-auto"></div></td>
                </tr>
              </ng-container>

              <tr *ngIf="!isLoading() && filteredTenants().length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-slate-500">
                  <i class="fa-solid fa-building-circle-exclamation text-3xl mb-2 text-slate-400 dark:text-slate-600 block"></i>
                  <span class="text-sm font-medium">No se encontraron negocios con los filtros actuales</span>
                </td>
              </tr>

              <ng-container *ngIf="!isLoading()">
                <tr *ngFor="let t of filteredTenants()" class="hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td class="px-6 py-4">
                    <div class="font-bold text-slate-900 dark:text-white">{{ t.nombreComercial }}</div>
                    <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ t.razonSocial }} • RUC: {{ t.numeroIdentificacion }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <span [ngClass]="{
                      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20': t.verticalId === 'FARMACIA',
                      'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20': t.verticalId === 'RETAIL',
                      'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20': t.verticalId === 'RESTAURANTE'
                    }" class="px-2.5 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5">
                      <i class="fa-solid" [ngClass]="{
                        'fa-prescription-bottle-medical': t.verticalId === 'FARMACIA',
                        'fa-shirt': t.verticalId === 'RETAIL',
                        'fa-utensils': t.verticalId === 'RESTAURANTE'
                      }"></i>
                      <span>{{ t.verticalNombre }}</span>
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                      {{ t.planNombre || t.planId }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-mono text-indigo-600 dark:text-indigo-400">
                    {{ t.subdominio }}.tusistema.com
                  </td>
                  <td class="px-6 py-4">
                    <span [ngClass]="{
                      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20': t.estado === 'ACTIVO',
                      'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20': t.estado === 'SUSPENDIDO',
                      'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20': t.estado === 'INACTIVO'
                    }" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase inline-flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
                        'bg-emerald-500': t.estado === 'ACTIVO',
                        'bg-amber-500': t.estado === 'SUSPENDIDO',
                        'bg-rose-500': t.estado === 'INACTIVO'
                      }"></span>
                      <span>{{ t.estado }}</span>
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      <i class="fa-solid fa-database text-violet-600 dark:text-violet-400 text-xs"></i>
                      <span>{{ t.dbHost || 'Pendiente' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                    <button (click)="viewTenantDetail(t)" title="Ver Detalle"
                            class="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                      <i class="fa-solid fa-eye text-xs"></i>
                    </button>
                    <button (click)="openEditModal(t)" title="Editar Plan & Datos"
                            class="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                      <i class="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                    <button (click)="openDeleteModal(t)" title="Eliminar Negocio"
                            class="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                      <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal: Detalle Tenant -->
      <div *ngIf="selectedTenant()" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-building text-indigo-600 dark:text-indigo-400"></i>
              <span>{{ selectedTenant()?.nombreComercial }}</span>
            </h3>
            <button (click)="selectedTenant.set(null)" class="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
              <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Razón Social:</span> <span class="text-slate-900 dark:text-white font-medium">{{ selectedTenant()?.razonSocial }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Subdominio:</span> <span class="text-indigo-600 dark:text-indigo-400 font-mono">{{ selectedTenant()?.subdominio }}.tusistema.com</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">RUC:</span> <span class="text-slate-800 dark:text-slate-200 font-mono">{{ selectedTenant()?.numeroIdentificacion }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Vertical:</span> <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{{ selectedTenant()?.verticalNombre }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Plan Actual:</span> <span class="text-indigo-600 dark:text-indigo-400 font-bold">{{ selectedTenant()?.planNombre || selectedTenant()?.planId }}</span></div>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
              <div class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><i class="fa-solid fa-database text-violet-600 dark:text-violet-400"></i> Conexión Supabase (Data Plane)</div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Host:</span> <span class="text-violet-600 dark:text-violet-400 font-mono">{{ selectedTenant()?.dbHost || 'No configurado' }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Puerto:</span> <span class="text-slate-800 dark:text-slate-200 font-mono">5432</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Base de Datos:</span> <span class="text-slate-800 dark:text-slate-200 font-mono">postgres</span></div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button (click)="selectedTenant.set(null)" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer">Cerrar</button>
          </div>
        </div>
      </div>

      <!-- Modal: Editar Inquilino / Asignar Plan -->
      <div *ngIf="editingTenant()" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-pen-to-square text-amber-500"></i>
                <span>Editar Inquilino: {{ editingTenant()?.nombreComercial }}</span>
              </h3>
              <p class="text-[11px] text-slate-400">Actualiza los datos del tenant y selecciona el plan desde la base de datos</p>
            </div>
            <button (click)="editingTenant.set(null)" class="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form (ngSubmit)="saveEditTenant()" class="space-y-3.5 text-xs">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nombre Comercial *</label>
              <input type="text" [(ngModel)]="editForm.nombreComercial" name="nombreComercial" required
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold">
            </div>

            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Razón Social *</label>
              <input type="text" [(ngModel)]="editForm.razonSocial" name="razonSocial" required
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">RUC / Identificación *</label>
                <input type="text" [(ngModel)]="editForm.numeroIdentificacion" name="numeroIdentificacion" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
              </div>
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Estado</label>
                <select [(ngModel)]="editForm.estado" name="estado" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold">
                  <option value="ACTIVO">🟢 ACTIVO</option>
                  <option value="SUSPENDIDO">🟡 SUSPENDIDO</option>
                  <option value="INACTIVO">🔴 INACTIVO</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Vertical de Negocio *</label>
                <select [(ngModel)]="editForm.verticalId" name="verticalId" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
                  <option value="FARMACIA">💊 Farmacia</option>
                  <option value="RETAIL">👕 Retail / Ropa</option>
                  <option value="RESTAURANTE">🍽️ Restaurante</option>
                </select>
              </div>

              <!-- SELECT DE PLANES DESDE LA TABLA planes_suscripcion -->
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Plan SaaS (desde Base de Datos Master) *
                </label>
                <select [(ngModel)]="editForm.planId" name="planId" required
                        class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold">
                  <option *ngFor="let p of availablePlans()" [value]="p.id">
                    {{ p.nombre }} (S/. {{ p.precioMensual | number:'1.2-2' }})
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email de Contacto</label>
              <input type="email" [(ngModel)]="editForm.emailContacto" name="emailContacto" required
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
            </div>

            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Host de Base de Datos Supabase (Data Plane)</label>
              <input type="text" [(ngModel)]="editForm.dbHost" name="dbHost"
                     placeholder="db.xxxxxxxxxxxx.supabase.co"
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
            </div>

            <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button type="button" (click)="editingTenant.set(null)" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer">Cancelar</button>
              <button type="submit" [disabled]="isSubmitting()"
                      class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-600/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                <i *ngIf="isSubmitting()" class="fa-solid fa-circle-notch fa-spin"></i>
                <span>{{ isSubmitting() ? 'Guardando...' : 'Guardar Cambios' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Crear Nuevo Negocio -->
      <div *ngIf="showCreateModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-plus text-indigo-600"></i>
                <span>Registrar Nuevo Inquilino (Tenant)</span>
              </h3>
              <p class="text-[11px] text-slate-400">Crea una nueva farmacia o empresa con su subdominio y plan</p>
            </div>
            <button (click)="showCreateModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form (ngSubmit)="saveCreateTenant()" class="space-y-3.5 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nombre Comercial *</label>
                <input type="text" [(ngModel)]="newTenantForm.nombreComercial" (input)="autoGenerarSubdominio()" name="nombreComercial" placeholder="Botica San Juan" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Subdominio Único *</label>
                <input type="text" [(ngModel)]="newTenantForm.subdominio" name="subdominio" placeholder="botica-sanjuan" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Razón Social *</label>
                <input type="text" [(ngModel)]="newTenantForm.razonSocial" name="razonSocial" placeholder="San Juan Farmaceutica S.A.C." required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">RUC (11 Dígitos) *</label>
                <input type="text" [(ngModel)]="newTenantForm.numeroIdentificacion" name="numeroIdentificacion" maxlength="11" placeholder="20123456789" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Vertical *</label>
                <select [(ngModel)]="newTenantForm.verticalId" name="verticalId" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
                  <option value="FARMACIA">💊 Farmacia</option>
                  <option value="RETAIL">👕 Retail / Ropa</option>
                  <option value="RESTAURANTE">🍽️ Restaurante</option>
                </select>
              </div>

              <!-- SELECT DE PLANES DESDE LA TABLA planes_suscripcion -->
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Plan Inicial (desde BD Master) *
                </label>
                <select [(ngModel)]="newTenantForm.planId" name="planId" required
                        class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold">
                  <option *ngFor="let p of availablePlans()" [value]="p.id">
                    {{ p.nombre }} (S/. {{ p.precioMensual | number:'1.2-2' }})
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email Administrador *</label>
                <input type="email" [(ngModel)]="newTenantForm.emailContacto" name="emailContacto" placeholder="admin@farmacia.com" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Teléfono</label>
                <input type="text" [(ngModel)]="newTenantForm.telefonoContacto" name="telefonoContacto" placeholder="987654321"
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
              </div>
            </div>

            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Host de Base de Datos Supabase</label>
              <input type="text" [(ngModel)]="newTenantForm.dbHost" name="dbHost" placeholder="db.xxxxxxxxxxxx.supabase.co"
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
            </div>

            <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button type="button" (click)="showCreateModal = false" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer">Cancelar</button>
              <button type="submit" [disabled]="isSubmitting()"
                      class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                <i *ngIf="isSubmitting()" class="fa-solid fa-circle-notch fa-spin"></i>
                <span>{{ isSubmitting() ? 'Registrando...' : 'Registrar Negocio' }}</span>
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
            Se purgarán sus credenciales y suscripciones de la base central.
          </p>

          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button (click)="deletingTenant.set(null)" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer">Cancelar</button>
            <button (click)="confirmDelete()" [disabled]="isSubmitting()"
                    class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
              <i *ngIf="isSubmitting()" class="fa-solid fa-circle-notch fa-spin"></i>
              <span>{{ isSubmitting() ? 'Eliminando...' : 'Sí, Eliminar Negocio' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TenantsPageComponent implements OnInit {
  tenantService = inject(TenantService);
  private http = inject(HttpClient);

  isLoading = signal<boolean>(true);
  searchTerm = '';
  filterVertical = signal<string>('ALL');
  selectedTenant = signal<Tenant | null>(null);

  editingTenant = signal<Tenant | null>(null);
  deletingTenant = signal<Tenant | null>(null);
  isSubmitting = signal<boolean>(false);
  showCreateModal = false;

  availablePlans = signal<PlanSimple[]>([]);

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

  newTenantForm = {
    nombreComercial: '',
    razonSocial: '',
    subdominio: '',
    numeroIdentificacion: '',
    verticalId: 'FARMACIA',
    planId: 'PLAN_ELEMENTAL_FARMACIA',
    emailContacto: '',
    telefonoContacto: '',
    dbHost: ''
  };

  ngOnInit(): void {
    this.isLoading.set(true);
    this.cargarPlanes();
    this.tenantService.loadTenants().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  cargarPlanes(): void {
    this.http.get<ApiResponse<PlanSimple[]>>('http://localhost:8081/api/v1/subscriptions/plans').subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.availablePlans.set(res.data);
          if (!this.editForm.planId) {
            this.editForm.planId = res.data[0].id;
          }
        }
      }
    });
  }

  filteredTenants(): Tenant[] {
    return this.tenantService.tenantsSignal().filter(t => {
      const matchVertical = this.filterVertical() === 'ALL' || t.verticalId === this.filterVertical();
      const matchSearch = !this.searchTerm ||
        t.nombreComercial.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.subdominio.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.numeroIdentificacion.includes(this.searchTerm);
      return matchVertical && matchSearch;
    });
  }

  viewTenantDetail(t: Tenant): void {
    this.selectedTenant.set(t);
  }

  openEditModal(t: Tenant): void {
    this.editingTenant.set(t);
    this.editForm = {
      nombreComercial: t.nombreComercial,
      razonSocial: t.razonSocial,
      numeroIdentificacion: t.numeroIdentificacion,
      verticalId: t.verticalId,
      planId: t.planId || (this.availablePlans()[0]?.id || 'PLAN_ELEMENTAL_FARMACIA'),
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

  openCreateModal(): void {
    this.newTenantForm = {
      nombreComercial: '',
      razonSocial: '',
      subdominio: '',
      numeroIdentificacion: '',
      verticalId: 'FARMACIA',
      planId: this.availablePlans()[0]?.id || 'PLAN_ELEMENTAL_FARMACIA',
      emailContacto: '',
      telefonoContacto: '',
      dbHost: ''
    };
    this.showCreateModal = true;
  }

  autoGenerarSubdominio(): void {
    this.newTenantForm.subdominio = this.newTenantForm.nombreComercial
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
  }

  saveCreateTenant(): void {
    if (!this.newTenantForm.subdominio || !this.newTenantForm.numeroIdentificacion) {
      alert('Por favor completa los campos obligatorios');
      return;
    }
    this.isSubmitting.set(true);
    this.tenantService.createTenant(this.newTenantForm as any).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showCreateModal = false;
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err.error?.message || 'Error al crear negocio');
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
