import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TenantService } from '../../core/services/tenant.service';
import { Tenant, CreateTenantRequest, ApiResponse } from '../../core/models/tenant.model';
import { environment } from '../../../environments/environment';

export interface PlanSimple {
  id: string;
  nombre: string;
  verticalId?: string;
  precioMensual: number;
  maxSucursales: number;
  maxUsuarios: number;
  estaActivo: boolean;
}

export interface SedeEmpresa {
  id: string;
  nombre: string;
  direccion: string;
  telefono?: string;
  encargado?: string;
  activa: boolean;
  negocioId?: string;
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
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs cursor-pointer"
                           (click)="t.logoUrl ? openLogoPreviewModal(t.logoUrl, t.nombreComercial) : null"
                           [title]="t.logoUrl ? 'Clic para previsualizar logo' : ''">
                        <img *ngIf="t.logoUrl" [src]="t.logoUrl" [alt]="t.nombreComercial" class="w-full h-full object-contain p-1" />
                        <i *ngIf="!t.logoUrl" class="fa-solid fa-building text-slate-400 text-sm"></i>
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{{ t.nombreComercial }}</span>
                          <span *ngIf="t.logoUrl" class="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded font-semibold">
                            Logo
                          </span>
                        </div>
                        <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ t.razonSocial }} • RUC: {{ t.numeroIdentificacion }}</div>
                      </div>
                    </div>
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
                    <button (click)="openSedesModal(t)" title="Gestionar Sedes / Sucursales"
                            class="p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                      <i class="fa-solid fa-store text-xs"></i>
                    </button>
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
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs cursor-pointer"
                   (click)="selectedTenant()?.logoUrl ? openLogoPreviewModal(selectedTenant()?.logoUrl, selectedTenant()?.nombreComercial) : null">
                <img *ngIf="selectedTenant()?.logoUrl" [src]="selectedTenant()?.logoUrl" [alt]="selectedTenant()?.nombreComercial" class="w-full h-full object-contain p-1" />
                <i *ngIf="!selectedTenant()?.logoUrl" class="fa-solid fa-building text-indigo-600 dark:text-indigo-400 text-lg"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{{ selectedTenant()?.nombreComercial }}</span>
                </h3>
                <p class="text-[11px] text-slate-400 font-mono">{{ selectedTenant()?.subdominio }}.tusistema.com</p>
              </div>
            </div>
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
            <!-- SECCIÓN: LOGO DEL NEGOCIO (SUBIR, PREVISUALIZAR Y EDITAR) -->
            <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-3">
              <div class="flex items-center justify-between">
                <label class="block text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5">
                  <i class="fa-solid fa-image text-amber-500"></i>
                  <span>Logo de la Empresa / Negocio</span>
                </label>
                <span *ngIf="editForm.logoUrl" class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <i class="fa-solid fa-circle-check"></i> Logo asignado
                </span>
              </div>

              <!-- Vista previa si existe logo -->
              <div *ngIf="editForm.logoUrl" class="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div class="relative group cursor-pointer shrink-0" (click)="openLogoPreviewModal(editForm.logoUrl, editForm.nombreComercial)">
                  <img [src]="editForm.logoUrl" alt="Logo Negocio" 
                       class="w-16 h-16 object-contain rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white transition-transform group-hover:scale-105" />
                  <div class="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fa-solid fa-magnifying-glass-plus text-white text-xs"></i>
                  </div>
                </div>

                <div class="flex-1 space-y-1.5 min-w-0">
                  <div class="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {{ editForm.nombreComercial || 'Logo del negocio' }}
                  </div>
                  <div class="flex flex-wrap items-center gap-1.5">
                    <button type="button" (click)="editLogoFileInput.click()" 
                            class="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer">
                      <i class="fa-solid fa-arrow-up-from-bracket text-[9px]"></i> Cambiar
                    </button>
                    <button type="button" (click)="openLogoPreviewModal(editForm.logoUrl, editForm.nombreComercial)" 
                            class="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer">
                      <i class="fa-solid fa-eye text-[9px]"></i> Previsualizar
                    </button>
                    <button type="button" (click)="removeEditLogo()" 
                            class="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer">
                      <i class="fa-solid fa-trash text-[9px]"></i> Quitar
                    </button>
                  </div>
                </div>
              </div>

              <!-- Dropzone si NO hay logo -->
              <div *ngIf="!editForm.logoUrl" 
                   (click)="editLogoFileInput.click()"
                   class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-white/60 dark:bg-slate-900/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 group">
                <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2 transition-transform group-hover:scale-110 shadow-xs">
                  <i class="fa-solid fa-cloud-arrow-up text-lg"></i>
                </div>
                <p class="text-xs font-bold text-slate-800 dark:text-white">Subir Logo del Negocio</p>
                <p class="text-[10px] text-slate-400 mt-0.5">Haz clic para seleccionar (PNG, JPG, SVG o WebP)</p>
              </div>

              <input type="file" #editLogoFileInput (change)="onLogoFileSelected($event, 'edit')" accept="image/*" class="hidden" />
            </div>

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
            <!-- SECCIÓN: LOGO DEL NEGOCIO (CREAR) -->
            <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5">
                  <i class="fa-solid fa-image text-indigo-500"></i>
                  <span>Logo de la Empresa (Opcional)</span>
                </label>
                <span *ngIf="newTenantForm.logoUrl" class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <i class="fa-solid fa-circle-check"></i> Logo cargado
                </span>
              </div>

              <!-- Vista previa si existe logo -->
              <div *ngIf="newTenantForm.logoUrl" class="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <img [src]="newTenantForm.logoUrl" alt="Logo" class="w-12 h-12 object-contain rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white" />
                <div class="flex items-center gap-2">
                  <button type="button" (click)="newLogoFileInput.click()" class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-bold cursor-pointer">
                    Cambiar
                  </button>
                  <button type="button" (click)="removeCreateLogo()" class="px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 text-[10px] font-bold cursor-pointer">
                    Quitar
                  </button>
                </div>
              </div>

              <!-- Dropzone si NO hay logo -->
              <div *ngIf="!newTenantForm.logoUrl" 
                   (click)="newLogoFileInput.click()"
                   class="border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-3 text-center cursor-pointer transition-colors bg-white/60 dark:bg-slate-900/40 hover:bg-indigo-50/30">
                <p class="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <i class="fa-solid fa-cloud-arrow-up mr-1 text-indigo-500"></i> Subir logo de la empresa
                </p>
                <p class="text-[9px] text-slate-400">PNG, JPG, SVG o WebP</p>
              </div>

              <input type="file" #newLogoFileInput (change)="onLogoFileSelected($event, 'create')" accept="image/*" class="hidden" />
            </div>

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

      <!-- Modal: Gestión de Sedes & Sucursales por Empresa (Master Control Plane) -->
      <div *ngIf="selectedTenantForSedes()" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
                <i class="fa-solid fa-store"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Sedes & Sucursales: {{ selectedTenantForSedes()?.nombreComercial }}</span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ selectedTenantForSedes()?.razonSocial }} • RUC {{ selectedTenantForSedes()?.numeroIdentificacion }}
                </p>
              </div>
            </div>
            <button (click)="closeSedesModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <!-- Info y Cuota del Plan -->
          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-600 dark:text-slate-400">Plan Suscrito:</span>
                <span class="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  {{ selectedTenantForSedes()?.planNombre || selectedTenantForSedes()?.planId }}
                </span>
                <span class="text-slate-400">• Vertical {{ selectedTenantForSedes()?.verticalNombre }}</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                <i class="fa-solid fa-circle-nodes text-indigo-500 mr-1"></i>
                División de información: cada venta POS, arqueo de caja y turno queda registrado con el nombre de su sede.
              </p>
            </div>

            <div class="text-left sm:text-right shrink-0">
              <span class="text-[10px] uppercase font-bold text-slate-400">Cupo de Sedes</span>
              <div class="flex items-center gap-1.5 font-bold mt-0.5"
                   [ngClass]="sedesList().length >= getMaxSucursales(selectedTenantForSedes()) ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'">
                <i class="fa-solid fa-building-circle-check"></i>
                <span class="text-sm">{{ sedesList().length }}</span>
                <span class="text-slate-400">/ {{ getMaxSucursales(selectedTenantForSedes()) }} sedes permitidas</span>
              </div>
            </div>
          </div>

          <!-- Alerta de feedback -->
          <div *ngIf="sedeFeedback()" class="p-3 rounded-xl text-xs font-semibold flex items-center justify-between"
               [ngClass]="sedeFeedback()?.tipo === 'success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'">
            <span>{{ sedeFeedback()?.texto }}</span>
            <button (click)="sedeFeedback.set(null)" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <!-- Lista de Sedes -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Sedes Registradas ({{ sedesList().length }})
              </h4>
              <button *ngIf="!showNuevaSedeForm && !editingSede()" (click)="abrirFormNuevaSede()"
                      [disabled]="sedesList().length >= getMaxSucursales(selectedTenantForSedes())"
                      class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
                <i class="fa-solid fa-plus text-[10px]"></i>
                <span>Nueva Sede</span>
              </button>
            </div>

            <!-- Formulario para Nueva Sede / Editar Sede -->
            <div *ngIf="showNuevaSedeForm || editingSede()"
                 class="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 space-y-3 text-xs animate-slide-up">
              <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid" [ngClass]="editingSede() ? 'fa-pen-to-square text-amber-500' : 'fa-plus text-emerald-500'"></i>
                <span>{{ editingSede() ? 'Editar Sede: ' + editingSede()?.nombre : 'Registrar Nueva Sede' }}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Nombre de la Sede *</label>
                  <input type="text" [(ngModel)]="sedeFormData.nombre" placeholder="Ej: Sucursal Miraflores"
                         class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500">
                </div>
                <div>
                  <label class="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Dirección Completa *</label>
                  <input type="text" [(ngModel)]="sedeFormData.direccion" placeholder="Ej: Av. Larco 820, Miraflores"
                         class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Teléfono / Anexo</label>
                  <input type="text" [(ngModel)]="sedeFormData.telefono" placeholder="Ej: 01-4458920"
                         class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500">
                </div>
                <div>
                  <label class="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Responsable / Regente</label>
                  <input type="text" [(ngModel)]="sedeFormData.encargado" placeholder="Ej: Lic. Q.F. Rosa Morales"
                         class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500">
                </div>
                <div>
                  <label class="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Estado Operativo</label>
                  <select [(ngModel)]="sedeFormData.activa"
                          class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500">
                    <option [ngValue]="true">🟢 Operativa / Activa</option>
                    <option [ngValue]="false">🟡 En Mantenimiento / Inactiva</option>
                  </select>
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <button type="button" (click)="cancelarFormSede()"
                        class="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  Cancelar
                </button>
                <button type="button" (click)="guardarSedeForm()"
                        class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm cursor-pointer">
                  {{ editingSede() ? 'Guardar Cambios' : 'Registrar Sede' }}
                </button>
              </div>
            </div>

            <!-- Tarjetas de Sedes -->
            <div *ngIf="sedesList().length === 0" class="p-8 text-center text-slate-400 dark:text-slate-600 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
              <i class="fa-solid fa-store-slash text-2xl mb-1"></i>
              <p>No hay sedes registradas para esta empresa.</p>
            </div>

            <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
              <div *ngFor="let sede of sedesList(); let idx = index"
                   class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                       [ngClass]="sede.activa ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-500'">
                    <i class="fa-solid fa-store"></i>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-900 dark:text-white text-xs">{{ sede.nombre }}</span>
                      <span *ngIf="idx === 0" class="text-[9px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 font-bold px-1.5 py-0.5 rounded">
                        Principal
                      </span>
                      <span [ngClass]="sede.activa ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'"
                            class="text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {{ sede.activa ? 'Activa' : 'Inactiva' }}
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <i class="fa-solid fa-location-dot text-[10px] text-slate-400"></i>
                      <span>{{ sede.direccion }}</span>
                    </p>
                    <div class="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      <span *ngIf="sede.telefono"><i class="fa-solid fa-phone text-[9px]"></i> {{ sede.telefono }}</span>
                      <span *ngIf="sede.encargado"><i class="fa-solid fa-user-check text-[9px]"></i> {{ sede.encargado }}</span>
                    </div>
                  </div>
                </div>

                <!-- Acciones de Sede -->
                <div class="flex items-center gap-1 self-end sm:self-center shrink-0">
                  <button (click)="iniciarEdicionSede(sede)" title="Editar datos de sede"
                          class="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                  </button>
                  <button (click)="toggleActivaSede(sede)" [title]="sede.activa ? 'Desactivar Sede' : 'Activar Sede'"
                          class="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                    <i class="fa-solid" [ngClass]="sede.activa ? 'fa-toggle-on text-emerald-500 text-sm' : 'fa-toggle-off text-slate-400 text-sm'"></i>
                  </button>
                  <button (click)="eliminarSede(sede)" title="Eliminar Sede"
                          [disabled]="sedesList().length <= 1"
                          class="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 cursor-pointer">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span class="text-[11px] text-slate-400">
              <i class="fa-solid fa-shield-halved text-indigo-500 mr-1"></i> Control Plane Centralizado
            </span>
            <button (click)="closeSedesModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer">
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <!-- Modal: Previsualización de Logo en Alta Resolución -->
      <div *ngIf="previewingLogo()" class="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-60 animate-fade-in">
        <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 class="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-eye text-indigo-500"></i>
              <span>Previsualización: {{ previewingLogo()?.businessName }}</span>
            </h3>
            <button (click)="previewingLogo.set(null)" class="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <div class="space-y-3">
            <!-- Modo Fondo Claro -->
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fondo Claro</span>
              <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center min-h-[120px]">
                <img [src]="previewingLogo()?.url" alt="Logo Preview Light" class="max-h-28 max-w-full object-contain drop-shadow-xs" />
              </div>
            </div>

            <!-- Modo Fondo Oscuro -->
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fondo Oscuro</span>
              <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[120px]">
                <img [src]="previewingLogo()?.url" alt="Logo Preview Dark" class="max-h-28 max-w-full object-contain drop-shadow-xs" />
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button (click)="previewingLogo.set(null)" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer">
              Cerrar
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

  // Sedes Management State
  selectedTenantForSedes = signal<Tenant | null>(null);
  sedesList = signal<SedeEmpresa[]>([]);
  editingSede = signal<SedeEmpresa | null>(null);
  showNuevaSedeForm = false;
  sedeFormData: SedeEmpresa = {
    id: '',
    nombre: '',
    direccion: '',
    telefono: '',
    encargado: '',
    activa: true
  };
  sedeFeedback = signal<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  editingTenant = signal<Tenant | null>(null);
  deletingTenant = signal<Tenant | null>(null);
  isSubmitting = signal<boolean>(false);
  showCreateModal = false;
  previewingLogo = signal<{ url: string; businessName: string } | null>(null);

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
    dbHost: '',
    logoUrl: ''
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
    dbHost: '',
    logoUrl: ''
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
    this.http.get<ApiResponse<PlanSimple[]>>(`${environment.masterApiUrl}/subscriptions/plans`).subscribe({
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
      dbHost: t.dbHost || '',
      logoUrl: t.logoUrl || ''
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
      dbHost: '',
      logoUrl: ''
    };
    this.showCreateModal = true;
  }

  onLogoFileSelected(event: Event, target: 'edit' | 'create'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG o WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar automáticamente con canvas para optimizar almacenamiento (máx 512px)
        const canvas = document.createElement('canvas');
        const maxDim = 512;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png', 0.9);
          if (target === 'edit') {
            this.editForm.logoUrl = compressed;
          } else {
            this.newTenantForm.logoUrl = compressed;
          }
        } else {
          if (target === 'edit') {
            this.editForm.logoUrl = e.target.result;
          } else {
            this.newTenantForm.logoUrl = e.target.result;
          }
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeEditLogo(): void {
    this.editForm.logoUrl = '';
  }

  removeCreateLogo(): void {
    this.newTenantForm.logoUrl = '';
  }

  openLogoPreviewModal(url?: string, businessName?: string): void {
    if (!url) return;
    this.previewingLogo.set({
      url,
      businessName: businessName || 'Negocio'
    });
  }

  closeLogoPreviewModal(): void {
    this.previewingLogo.set(null);
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

  // --- MÉTODOS DE GESTIÓN DE SEDES POR EMPRESA (MASTER CONTROL PLANE) ---

  openSedesModal(t: Tenant): void {
    this.selectedTenantForSedes.set(t);
    this.showNuevaSedeForm = false;
    this.editingSede.set(null);
    this.sedeFeedback.set(null);
    this.cargarSedesDeTenant(t);
  }

  closeSedesModal(): void {
    this.selectedTenantForSedes.set(null);
    this.editingSede.set(null);
    this.showNuevaSedeForm = false;
    this.sedeFeedback.set(null);
  }

  getMaxSucursales(t: Tenant | null | undefined): number {
    if (!t) return 1;
    const plan = this.availablePlans().find(p => p.id === t.planId);
    return plan?.maxSucursales || 3;
  }

  cargarSedesDeTenant(t: Tenant): void {
    // 1. Cargar desde la API Master central
    this.http.get<ApiResponse<SedeEmpresa[]>>(`${environment.masterApiUrl}/tenants/${t.id}/sedes`).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.sedesList.set(res.data);
          localStorage.setItem('medicare_sedes_tenant_' + t.id, JSON.stringify(res.data));
          return;
        }
        this.fallbackCargarSedesLocal(t);
      },
      error: () => this.fallbackCargarSedesLocal(t)
    });
  }

  private fallbackCargarSedesLocal(t: Tenant): void {
    const key = 'medicare_sedes_tenant_' + t.id;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          this.sedesList.set(list);
          return;
        }
      } catch (e) {}
    }

    if (t.verticalId === 'FARMACIA') {
      const savedFarmacia = localStorage.getItem('medicare_sedes_sucursales');
      if (savedFarmacia) {
        try {
          const list = JSON.parse(savedFarmacia);
          if (Array.isArray(list) && list.length > 0) {
            this.sedesList.set(list);
            return;
          }
        } catch (e) {}
      }
    }

    const iniciales: SedeEmpresa[] = [];
    if (t.id === 'a0000000-0000-0000-0000-000000000004' || (t.subdominio && t.subdominio.includes('willy'))) {
      iniciales.push({
        id: '44444444-4444-4444-4444-444444444444',
        nombre: 'Sucursal Manchay - Pachacámac',
        direccion: 'Av. Víctor Malásquez s/n, Manchay, Pachacámac',
        telefono: t.telefonoContacto || '974372084',
        encargado: 'Willy Alexander Espinoza Díaz',
        activa: true,
        negocioId: t.id
      });
    } else if (t.id === 'a0000000-0000-0000-0000-000000000001' || t.verticalId === 'FARMACIA') {
      iniciales.push({
        id: '11111111-1111-1111-1111-111111111111',
        nombre: 'Sede Cajamarca Central',
        direccion: 'Av. Central 123, Cajamarca',
        telefono: t.telefonoContacto || '987654321',
        encargado: 'Lic. Carlos Alberto Mendoza Ramos (Q.F. Regente)',
        activa: true,
        negocioId: t.id
      });
    } else {
      iniciales.push({
        id: crypto.randomUUID(),
        nombre: `Sede Principal - ${t.nombreComercial || t.razonSocial}`,
        direccion: 'Sede Principal',
        telefono: t.telefonoContacto || '999999999',
        encargado: 'Administrador General',
        activa: true,
        negocioId: t.id
      });
    }

    this.sedesList.set(iniciales);
    this.persistirSedes(t, iniciales);
  }

  persistirSedes(t: Tenant, list: SedeEmpresa[]): void {
    localStorage.setItem('medicare_sedes_tenant_' + t.id, JSON.stringify(list));
    if (t.verticalId === 'FARMACIA') {
      localStorage.setItem('medicare_sedes_sucursales', JSON.stringify(list));
    }
    // Sincronizar en caliente con Master API (disponible para todos los puertos y módulos)
    this.http.put(`${environment.masterApiUrl}/tenants/${t.id}/sedes`, list).subscribe({
      error: (err) => console.warn('Aviso sincronizando sedes con Master API:', err)
    });
  }

  abrirFormNuevaSede(): void {
    const t = this.selectedTenantForSedes();
    if (!t) return;
    const max = this.getMaxSucursales(t);
    if (this.sedesList().length >= max) {
      this.sedeFeedback.set({
        tipo: 'error',
        texto: `Límite alcanzado: el plan actual (${t.planNombre || t.planId}) permite un máximo de ${max} sedes.`
      });
      return;
    }
    this.editingSede.set(null);
    this.sedeFormData = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ('sede-' + Date.now()),
      nombre: '',
      direccion: '',
      telefono: '',
      encargado: '',
      activa: true,
      negocioId: t.id
    };
    this.showNuevaSedeForm = true;
  }

  iniciarEdicionSede(s: SedeEmpresa): void {
    this.showNuevaSedeForm = false;
    this.editingSede.set(s);
    this.sedeFormData = { ...s };
  }

  cancelarFormSede(): void {
    this.showNuevaSedeForm = false;
    this.editingSede.set(null);
  }

  guardarSedeForm(): void {
    const t = this.selectedTenantForSedes();
    if (!t) return;

    if (!this.sedeFormData.nombre.trim() || !this.sedeFormData.direccion.trim()) {
      alert('El nombre y la dirección de la sede son obligatorios.');
      return;
    }

    const currentList = [...this.sedesList()];

    if (this.editingSede()) {
      const idx = currentList.findIndex(s => s.id === this.sedeFormData.id);
      if (idx !== -1) {
        currentList[idx] = { ...this.sedeFormData };
      }
      this.sedeFeedback.set({
        tipo: 'success',
        texto: `Sede "${this.sedeFormData.nombre}" actualizada con éxito.`
      });
    } else {
      currentList.push({ ...this.sedeFormData });
      this.sedeFeedback.set({
        tipo: 'success',
        texto: `Sede "${this.sedeFormData.nombre}" creada y asignada a ${t.nombreComercial}.`
      });
    }

    this.sedesList.set(currentList);
    this.persistirSedes(t, currentList);
    this.cancelarFormSede();
  }

  toggleActivaSede(sede: SedeEmpresa): void {
    const t = this.selectedTenantForSedes();
    if (!t) return;
    const currentList = this.sedesList().map(s => {
      if (s.id === sede.id) {
        return { ...s, activa: !s.activa };
      }
      return s;
    });
    this.sedesList.set(currentList);
    this.persistirSedes(t, currentList);
  }

  eliminarSede(sede: SedeEmpresa): void {
    const t = this.selectedTenantForSedes();
    if (!t) return;
    if (this.sedesList().length <= 1) {
      alert('La empresa debe mantener al menos una sede principal registrada.');
      return;
    }
    if (!confirm(`¿Eliminar definitivamente la sede "${sede.nombre}"?`)) {
      return;
    }
    const currentList = this.sedesList().filter(s => s.id !== sede.id);
    this.sedesList.set(currentList);
    this.persistirSedes(t, currentList);
    this.sedeFeedback.set({
      tipo: 'success',
      texto: `Sede "${sede.nombre}" eliminada correctamente.`
    });
  }
}
