import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../core/models/tenant.model';

export interface SubscriptionDTO {
  id?: string;
  tenantId?: string;
  tenantNombreComercial?: string;
  tenantSubdominio?: string;
  verticalId?: string;
  planId: string;
  planNombre?: string;
  montoPago: number;
  metodoPago: string;
  codigoTransaccion?: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string; // ACTIVA, SUSPENDIDA, VENCIDA, CANCELADA
}

export interface PlanDTO {
  id: string;
  nombre: string;
  verticalId?: string;
  maxSucursales: number;
  maxUsuarios: number;
  precioMensual: number;
  caracteristicas?: string;
  estaActivo: boolean;
}

export interface TenantSimpleDTO {
  id: string;
  nombreComercial: string;
  subdominio: string;
  verticalId: string;
}

@Component({
  selector: 'app-subscriptions-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Toast Alert -->
      <div *ngIf="mensajeToast" 
           [ngClass]="{
             'bg-emerald-600 text-white': mensajeToast.tipo === 'success',
             'bg-rose-600 text-white': mensajeToast.tipo === 'error',
             'bg-indigo-600 text-white': mensajeToast.tipo === 'info'
           }"
           class="fixed top-20 right-8 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce">
        <i class="fa-solid" [ngClass]="mensajeToast.tipo === 'success' ? 'fa-circle-check' : mensajeToast.tipo === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'"></i>
        <span>{{ mensajeToast.texto }}</span>
      </div>

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <i class="fa-solid fa-credit-card text-emerald-600 dark:text-emerald-400"></i>
            <span>Suscripciones & Planes por Negocio</span>
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Control independiente de membresías, renovación de pagos y catálogo de planes SaaS
          </p>
        </div>

        <div class="flex items-center gap-2 self-start sm:self-auto">
          <button (click)="cargarDatos()" title="Recargar Lista"
                  class="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer shadow-sm">
            <i class="fa-solid fa-rotate-right" [ngClass]="{'fa-spin': cargando}"></i>
          </button>

          <button (click)="abrirModalNuevaSuscripcion()"
                  class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-plus text-xs"></i>
            <span>Asignar Suscripción</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span class="text-[11px] font-bold uppercase text-slate-400">Total Suscripciones</span>
          <p class="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{{ subscriptions.length }}</p>
        </div>

        <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span class="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">🟢 Activas / Al Día</span>
          <p class="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{{ totalActivas }}</p>
        </div>

        <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span class="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400">💰 MRR Recurrente</span>
          <p class="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">S/. {{ totalMRR | number:'1.2-2' }}</p>
        </div>

        <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span class="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400">📦 Planes Disponibles</span>
          <p class="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">{{ plans.length }}</p>
        </div>
      </div>

      <!-- Navigation Tabs: Suscripciones vs Planes -->
      <div class="flex p-1 bg-slate-200 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 text-xs font-bold w-fit">
        <button (click)="activeTab = 'suscripciones'"
                [ngClass]="activeTab === 'suscripciones' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'"
                class="px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2">
          <i class="fa-solid fa-file-invoice-dollar"></i>
          <span>1. Suscripciones por Empresa ({{ subscriptions.length }})</span>
        </button>
        <button (click)="activeTab = 'planes'"
                [ngClass]="activeTab === 'planes' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'"
                class="px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2">
          <i class="fa-solid fa-boxes-stacked"></i>
          <span>2. Catálogo de Planes SaaS ({{ plans.length }})</span>
        </button>
      </div>

      <!-- TAB 1: SUSCRIPCIONES POR EMPRESA -->
      <div *ngIf="activeTab === 'suscripciones'" class="space-y-4">
        
        <!-- Filter Toolbar -->
        <div class="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-2 w-full md:w-auto">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1.5">
              <i class="fa-solid fa-building text-emerald-500"></i> Filtrar por Negocio:
            </label>
            <select [(ngModel)]="filtroTenantId" (change)="filtrarSuscripciones()"
                    class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500">
              <option value="TODOS">🌟 Todos los Negocios</option>
              <option *ngFor="let t of tenants" [value]="t.id">{{ t.nombreComercial }} ({{ t.subdominio }})</option>
            </select>
          </div>

          <div class="flex items-center gap-2 w-full md:w-auto">
            <div class="relative flex-1 md:w-64">
              <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input type="text" [(ngModel)]="busquedaSub" placeholder="Buscar por negocio, plan o TXN..."
                     class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500">
            </div>

            <select [(ngModel)]="filtroEstado"
                    class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500">
              <option value="TODOS">Todos los Estados</option>
              <option value="ACTIVA">🟢 ACTIVA</option>
              <option value="SUSPENDIDA">🟡 SUSPENDIDA</option>
              <option value="VENCIDA">🔴 VENCIDA</option>
            </select>
          </div>
        </div>

        <!-- Subscriptions Table -->
        <div class="glass-panel rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left text-xs min-w-[760px]">
              <thead class="bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th class="px-6 py-4">Negocio / Inquilino</th>
                  <th class="px-6 py-4">Plan Contratado</th>
                  <th class="px-6 py-4">Monto Mensual</th>
                  <th class="px-6 py-4">Método de Pago</th>
                  <th class="px-6 py-4">Código Operación</th>
                  <th class="px-6 py-4">Vigencia (Inicio ➔ Fin)</th>
                  <th class="px-6 py-4 text-center">Estado</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-800/60">
                <tr *ngIf="suscripcionesFiltradas.length === 0" class="text-center text-slate-500">
                  <td colspan="8" class="px-6 py-12">
                    <i class="fa-solid fa-receipt text-3xl mb-2 text-slate-400 dark:text-slate-600 block"></i>
                    <span class="text-sm font-medium">No se encontraron suscripciones para el filtro seleccionado.</span>
                  </td>
                </tr>

                <tr *ngFor="let s of suscripcionesFiltradas" class="hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-colors">
                  <!-- Negocio -->
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <span class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
                        <i class="fa-solid fa-store"></i>
                      </span>
                      <div>
                        <p class="font-bold text-slate-900 dark:text-white leading-tight">{{ s.tenantNombreComercial }}</p>
                        <span class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">{{ s.tenantSubdominio }}.tusistema.com</span>
                      </div>
                    </div>
                  </td>

                  <!-- Plan -->
                  <td class="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                    <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px]">
                      {{ s.planNombre || s.planId }}
                    </span>
                  </td>

                  <!-- Monto -->
                  <td class="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    S/. {{ s.montoPago | number:'1.2-2' }}
                  </td>

                  <!-- Método de Pago -->
                  <td class="px-6 py-4 text-slate-700 dark:text-slate-300">
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px]">
                      {{ s.metodoPago }}
                    </span>
                  </td>

                  <!-- Código Operación -->
                  <td class="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {{ s.codigoTransaccion || 'N/A' }}
                  </td>

                  <!-- Vigencia -->
                  <td class="px-6 py-4 text-slate-700 dark:text-slate-300 text-[11px]">
                    <span class="font-mono">{{ s.fechaInicio }}</span> ➔ <span class="font-mono font-bold">{{ s.fechaFin }}</span>
                  </td>

                  <!-- Estado -->
                  <td class="px-6 py-4 text-center">
                    <span [ngClass]="{
                            'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400': s.estado === 'ACTIVA',
                            'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400': s.estado === 'SUSPENDIDA',
                            'bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400': s.estado === 'VENCIDA' || s.estado === 'CANCELADA'
                          }"
                          class="px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="s.estado === 'ACTIVA' ? 'bg-emerald-500' : s.estado === 'SUSPENDIDA' ? 'bg-amber-500' : 'bg-rose-500'"></span>
                      <span>{{ s.estado }}</span>
                    </span>
                  </td>

                  <!-- Acciones -->
                  <td class="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                    <button (click)="abrirModalEditarSuscripcion(s)" title="Editar Suscripción"
                            class="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <i class="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                    <button (click)="confirmarEliminarSuscripcion(s)" title="Eliminar Suscripción"
                            class="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- TAB 2: CATÁLOGO DE PLANES SAAS -->
      <div *ngIf="activeTab === 'planes'" class="space-y-5">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Catálogo de Planes Configurables</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">Planes base que determinan cupos de usuarios y sucursales</p>
          </div>
          <button (click)="abrirModalNuevoPlan()"
                  class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
            <i class="fa-solid fa-plus text-xs"></i>
            <span>Nuevo Plan</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div *ngFor="let p of plans" class="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 relative flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {{ p.id }}
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" [ngClass]="p.estaActivo ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'">
                  {{ p.estaActivo ? 'ACTIVO' : 'INACTIVO' }}
                </span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mt-2">{{ p.nombre }}</h3>
              <p class="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
                S/. {{ p.precioMensual | number:'1.2-2' }} <span class="text-xs text-slate-500 dark:text-slate-400 font-normal">/mes</span>
              </p>
              
              <div class="mt-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div class="flex justify-between">
                  <span>Sucursales permitidas:</span>
                  <span class="font-bold text-slate-900 dark:text-white">{{ p.maxSucursales }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Usuarios máximos:</span>
                  <span class="font-bold text-slate-900 dark:text-white">{{ p.maxUsuarios }}</span>
                </div>
              </div>
            </div>

            <div class="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button (click)="abrirModalEditarPlan(p)" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1">
                <i class="fa-solid fa-pen-to-square text-xs"></i> Editar
              </button>
              <button (click)="confirmarEliminarPlan(p)" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1">
                <i class="fa-solid fa-trash-can text-xs"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL CREAR / EDITAR SUSCRIPCIÓN -->
      <div *ngIf="showSubModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid" [ngClass]="modoEdicionSub ? 'fa-pen-to-square text-amber-500' : 'fa-plus text-emerald-600'"></i>
                <span>{{ modoEdicionSub ? 'Editar Suscripción de Negocio' : 'Asignar Nueva Suscripción a Negocio' }}</span>
              </h3>
              <p class="text-[11px] text-slate-400">Configuración independiente de fechas y montos por tenant</p>
            </div>
            <button (click)="showSubModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form (ngSubmit)="guardarSuscripcion()" class="space-y-3.5 text-xs">
            <!-- Negocio -->
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">🏢 Negocio / Inquilino *</label>
              <select [(ngModel)]="subEnEdicion.tenantId" name="tenantId" [disabled]="modoEdicionSub"
                      class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white">
                <option *ngFor="let t of tenants" [value]="t.id">{{ t.nombreComercial }} ({{ t.subdominio }})</option>
              </select>
            </div>

            <!-- Plan y Monto -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Plan SaaS *</label>
                <select [(ngModel)]="subEnEdicion.planId" (change)="alCambiarPlan()" name="planId"
                        class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white">
                  <option *ngFor="let p of plans" [value]="p.id">{{ p.nombre }} (S/. {{ p.precioMensual }})</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Monto de Pago (S/.) *</label>
                <input type="number" [(ngModel)]="subEnEdicion.montoPago" name="montoPago" step="0.01" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
              </div>
            </div>

            <!-- Fechas Inicio y Fin -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Fecha Inicio</label>
                <input type="date" [(ngModel)]="subEnEdicion.fechaInicio" name="fechaInicio" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white">
              </div>

              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Fecha Fin (Vencimiento)</label>
                <input type="date" [(ngModel)]="subEnEdicion.fechaFin" name="fechaFin" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white">
              </div>
            </div>

            <!-- Método de Pago y Código TXN -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Método de Pago</label>
                <select [(ngModel)]="subEnEdicion.metodoPago" name="metodoPago"
                        class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
                  <option value="TRANSFERENCIA">Transferencia BCP/BBVA</option>
                  <option value="YAPE_PLIN">Yape / Plin</option>
                  <option value="TARJETA_CREDITO">Tarjeta de Crédito / Débito</option>
                  <option value="EFECTIVO">Efectivo / Depósito</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Código Transacción / Operación</label>
                <input type="text" [(ngModel)]="subEnEdicion.codigoTransaccion" name="codigoTransaccion" placeholder="TXN-00123"
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white">
              </div>
            </div>

            <!-- Estado -->
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Estado de la Suscripción</label>
              <select [(ngModel)]="subEnEdicion.estado" name="estado"
                      class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white">
                <option value="ACTIVA">🟢 ACTIVA (Acceso Completo)</option>
                <option value="SUSPENDIDA">🟡 SUSPENDIDA (Bloqueo Temporal)</option>
                <option value="VENCIDA">🔴 VENCIDA (Requiere Renovación)</option>
              </select>
            </div>

            <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button type="button" (click)="showSubModal = false" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                Cancelar
              </button>
              <button type="submit" [disabled]="guardando"
                      class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50">
                <i *ngIf="guardando" class="fa-solid fa-spinner fa-spin"></i>
                <span>{{ modoEdicionSub ? 'Actualizar Suscripción' : 'Guardar en Master DB' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL CREAR / EDITAR PLAN -->
      <div *ngIf="showPlanModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid" [ngClass]="modoEdicionPlan ? 'fa-pen-to-square text-indigo-600' : 'fa-plus text-indigo-600'"></i>
                <span>{{ modoEdicionPlan ? 'Editar Plan SaaS' : 'Nuevo Plan SaaS' }}</span>
              </h3>
            </div>
            <button (click)="showPlanModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form (ngSubmit)="guardarPlan()" class="space-y-3.5 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ID Código del Plan *</label>
                <input type="text" [(ngModel)]="planEnEdicion.id" name="id" [disabled]="modoEdicionPlan" placeholder="PLAN_PRO" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nombre Comercial *</label>
                <input type="text" [(ngModel)]="planEnEdicion.nombre" name="nombre" placeholder="Plan Pro Multisede" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Precio / Mes (S/.) *</label>
                <input type="number" [(ngModel)]="planEnEdicion.precioMensual" name="precioMensual" step="0.01" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Max Sucursales</label>
                <input type="number" [(ngModel)]="planEnEdicion.maxSucursales" name="maxSucursales" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Max Usuarios</label>
                <input type="number" [(ngModel)]="planEnEdicion.maxUsuarios" name="maxUsuarios" required
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
              </div>
            </div>

            <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button type="button" (click)="showPlanModal = false" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                Cancelar
              </button>
              <button type="submit" [disabled]="guardando"
                      class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50">
                <i *ngIf="guardando" class="fa-solid fa-spinner fa-spin"></i>
                <span>{{ modoEdicionPlan ? 'Actualizar Plan' : 'Guardar Plan' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL CONFIRMAR ELIMINACIÓN PLAN -->
      <div *ngIf="showDeletePlanModal && planAEliminar" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-rose-500/40 shadow-2xl space-y-4 text-center">
          <div class="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-xl">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">¿Eliminar Plan SaaS?</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              ¿Estás seguro de eliminar el plan <strong class="text-slate-900 dark:text-white">{{ planAEliminar.nombre }}</strong> (<code class="font-mono text-indigo-600 dark:text-indigo-400">{{ planAEliminar.id }}</code>)?
            </p>
          </div>
          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button (click)="showDeletePlanModal = false" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              Cancelar
            </button>
            <button (click)="ejecutarEliminarPlan()" [disabled]="eliminandoPlan"
                    class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50">
              <i *ngIf="eliminandoPlan" class="fa-solid fa-spinner fa-spin"></i>
              <span>Sí, Eliminar Plan</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL CONFIRMAR ELIMINACIÓN SUSCRIPCIÓN -->
      <div *ngIf="showDeleteSubModal && subAEliminar" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-rose-500/40 shadow-2xl space-y-4 text-center">
          <div class="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-xl">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">¿Eliminar Suscripción de Negocio?</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Esta acción eliminará el registro de suscripción del negocio <strong>{{ subAEliminar.tenantNombreComercial }}</strong> (Monto: S/. {{ subAEliminar.montoPago }}) de la base de datos Master.
            </p>
          </div>
          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button (click)="showDeleteSubModal = false" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              Cancelar
            </button>
            <button (click)="ejecutarEliminarSuscripcion()" [disabled]="eliminando"
                    class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50">
              <i *ngIf="eliminando" class="fa-solid fa-spinner fa-spin"></i>
              <span>Sí, Eliminar</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class SubscriptionsPageComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = 'http://localhost:8081/api/v1';

  activeTab: 'suscripciones' | 'planes' = 'suscripciones';
  cargando = false;
  guardando = false;
  eliminando = false;

  tenants: TenantSimpleDTO[] = [];
  subscriptions: SubscriptionDTO[] = [];
  plans: PlanDTO[] = [];

  filtroTenantId = 'TODOS';
  filtroEstado = 'TODOS';
  busquedaSub = '';

  mensajeToast: { tipo: 'success' | 'error' | 'info'; texto: string } | null = null;

  // Modal Suscripción
  showSubModal = false;
  modoEdicionSub = false;
  subEnEdicion: SubscriptionDTO = this.getSubVacia();
  showDeleteSubModal = false;
  subAEliminar: SubscriptionDTO | null = null;

  // Modal Plan
  showPlanModal = false;
  modoEdicionPlan = false;
  planEnEdicion: PlanDTO = { id: '', nombre: '', maxSucursales: 1, maxUsuarios: 3, precioMensual: 120, estaActivo: true };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.cdr.markForCheck();

    // 1. Cargar Tenants
    this.http.get<ApiResponse<TenantSimpleDTO[]>>(`${this.apiUrl}/tenants`).subscribe({
      next: (res) => {
        if (res.data) this.tenants = res.data;
        this.cdr.markForCheck();
      }
    });

    // 2. Cargar Planes
    this.http.get<ApiResponse<PlanDTO[]>>(`${this.apiUrl}/subscriptions/plans`).subscribe({
      next: (res) => {
        if (res.data) this.plans = res.data;
        this.cdr.markForCheck();
      }
    });

    // 3. Cargar Suscripciones
    const url = (this.filtroTenantId !== 'TODOS')
      ? `${this.apiUrl}/subscriptions?negocioId=${this.filtroTenantId}`
      : `${this.apiUrl}/subscriptions`;

    this.http.get<ApiResponse<SubscriptionDTO[]>>(url).subscribe({
      next: (res) => {
        if (res.data) this.subscriptions = res.data;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  filtrarSuscripciones(): void {
    this.cargarDatos();
  }

  mostrarAlerta(tipo: 'success' | 'error' | 'info', texto: string) {
    this.mensajeToast = { tipo, texto };
    this.cdr.markForCheck();
    setTimeout(() => {
      if (this.mensajeToast?.texto === texto) {
        this.mensajeToast = null;
        this.cdr.markForCheck();
      }
    }, 3500);
  }

  get suscripcionesFiltradas(): SubscriptionDTO[] {
    return this.subscriptions.filter(s => {
      const matchTenant = this.filtroTenantId === 'TODOS' || s.tenantId === this.filtroTenantId;
      const matchEstado = this.filtroEstado === 'TODOS' || s.estado === this.filtroEstado;
      const q = this.busquedaSub.toLowerCase().trim();
      const matchTexto = !q || 
        (s.tenantNombreComercial && s.tenantNombreComercial.toLowerCase().includes(q)) ||
        (s.planNombre && s.planNombre.toLowerCase().includes(q)) ||
        (s.codigoTransaccion && s.codigoTransaccion.toLowerCase().includes(q)) ||
        (s.metodoPago && s.metodoPago.toLowerCase().includes(q));
      return matchTenant && matchEstado && matchTexto;
    });
  }

  get totalActivas(): number {
    return this.subscriptions.filter(s => s.estado === 'ACTIVA').length;
  }

  get totalMRR(): number {
    return this.subscriptions
      .filter(s => s.estado === 'ACTIVA')
      .reduce((sum, s) => sum + (Number(s.montoPago) || 0), 0);
  }

  getSubVacia(): SubscriptionDTO {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return {
      tenantId: this.tenants[0]?.id || '',
      planId: this.plans[0]?.id || 'PLAN_ELEMENTAL_FARMACIA',
      montoPago: 120,
      metodoPago: 'TRANSFERENCIA',
      codigoTransaccion: 'TXN-' + Date.now().toString().slice(-6),
      fechaInicio: today,
      fechaFin: nextMonth,
      estado: 'ACTIVA'
    };
  }

  abrirModalNuevaSuscripcion(): void {
    this.modoEdicionSub = false;
    this.subEnEdicion = this.getSubVacia();
    this.showSubModal = true;
    this.cdr.markForCheck();
  }

  abrirModalEditarSuscripcion(s: SubscriptionDTO): void {
    this.modoEdicionSub = true;
    this.subEnEdicion = { ...s };
    this.showSubModal = true;
    this.cdr.markForCheck();
  }

  alCambiarPlan(): void {
    const p = this.plans.find(x => x.id === this.subEnEdicion.planId);
    if (p) {
      this.subEnEdicion.montoPago = p.precioMensual;
    }
  }

  guardarSuscripcion(): void {
    if (!this.subEnEdicion.tenantId || !this.subEnEdicion.planId) {
      this.mostrarAlerta('error', 'Selecciona el Negocio y el Plan');
      return;
    }

    this.guardando = true;
    this.cdr.markForCheck();

    if (this.modoEdicionSub && this.subEnEdicion.id) {
      this.http.put<ApiResponse<SubscriptionDTO>>(`${this.apiUrl}/subscriptions/${this.subEnEdicion.id}`, this.subEnEdicion).subscribe({
        next: () => {
          this.guardando = false;
          this.showSubModal = false;
          this.mostrarAlerta('success', 'Suscripción de negocio actualizada exitosamente.');
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando = false;
          this.mostrarAlerta('error', err.error?.message || 'Error al actualizar suscripción');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.http.post<ApiResponse<SubscriptionDTO>>(`${this.apiUrl}/subscriptions`, this.subEnEdicion).subscribe({
        next: () => {
          this.guardando = false;
          this.showSubModal = false;
          this.mostrarAlerta('success', 'Nueva suscripción asignada al negocio exitosamente.');
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando = false;
          this.mostrarAlerta('error', err.error?.message || 'Error al asignar suscripción');
          this.cdr.markForCheck();
        }
      });
    }
  }

  confirmarEliminarSuscripcion(s: SubscriptionDTO): void {
    this.subAEliminar = s;
    this.showDeleteSubModal = true;
    this.cdr.markForCheck();
  }

  ejecutarEliminarSuscripcion(): void {
    if (!this.subAEliminar || !this.subAEliminar.id) return;
    this.eliminando = true;
    this.cdr.markForCheck();

    this.http.delete<ApiResponse<string>>(`${this.apiUrl}/subscriptions/${this.subAEliminar.id}`).subscribe({
      next: () => {
        this.eliminando = false;
        this.showDeleteSubModal = false;
        this.mostrarAlerta('success', 'Suscripción eliminada de la base de datos Master.');
        this.subAEliminar = null;
        this.cargarDatos();
      },
      error: () => {
        this.eliminando = false;
        this.showDeleteSubModal = false;
        this.mostrarAlerta('error', 'No se pudo eliminar la suscripción');
        this.cdr.markForCheck();
      }
    });
  }

  // Métodos de Planes
  abrirModalNuevoPlan(): void {
    this.modoEdicionPlan = false;
    this.planEnEdicion = { id: '', nombre: '', maxSucursales: 1, maxUsuarios: 3, precioMensual: 120, estaActivo: true };
    this.showPlanModal = true;
    this.cdr.markForCheck();
  }

  abrirModalEditarPlan(p: PlanDTO): void {
    this.modoEdicionPlan = true;
    this.planEnEdicion = { ...p };
    this.showPlanModal = true;
    this.cdr.markForCheck();
  }

  guardarPlan(): void {
    if (!this.planEnEdicion.id || !this.planEnEdicion.nombre) {
      this.mostrarAlerta('error', 'Ingresa el ID y Nombre del Plan');
      return;
    }
    this.guardando = true;
    this.cdr.markForCheck();

    if (this.modoEdicionPlan) {
      this.http.put<ApiResponse<PlanDTO>>(`${this.apiUrl}/subscriptions/plans/${this.planEnEdicion.id}`, this.planEnEdicion).subscribe({
        next: () => {
          this.guardando = false;
          this.showPlanModal = false;
          this.mostrarAlerta('success', 'Plan actualizado exitosamente.');
          this.cargarDatos();
        },
        error: () => {
          this.guardando = false;
          this.mostrarAlerta('error', 'Error al actualizar plan');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.http.post<ApiResponse<PlanDTO>>(`${this.apiUrl}/subscriptions/plans`, this.planEnEdicion).subscribe({
        next: () => {
          this.guardando = false;
          this.showPlanModal = false;
          this.mostrarAlerta('success', 'Plan creado exitosamente.');
          this.cargarDatos();
        },
        error: () => {
          this.guardando = false;
          this.mostrarAlerta('error', 'Error al crear plan');
          this.cdr.markForCheck();
        }
      });
    }
  }

  showDeletePlanModal = false;
  planAEliminar: PlanDTO | null = null;
  eliminandoPlan = false;

  confirmarEliminarPlan(p: PlanDTO): void {
    this.planAEliminar = p;
    this.showDeletePlanModal = true;
    this.cdr.markForCheck();
  }

  ejecutarEliminarPlan(): void {
    if (!this.planAEliminar || !this.planAEliminar.id) return;
    this.eliminandoPlan = true;
    this.cdr.markForCheck();

    this.http.delete<ApiResponse<string>>(`${this.apiUrl}/subscriptions/plans/${this.planAEliminar.id}`).subscribe({
      next: () => {
        this.eliminandoPlan = false;
        this.showDeletePlanModal = false;
        this.mostrarAlerta('success', `Plan ${this.planAEliminar?.nombre} eliminado exitosamente.`);
        this.planAEliminar = null;
        this.cargarDatos();
      },
      error: () => {
        this.eliminandoPlan = false;
        this.showDeletePlanModal = false;
        this.mostrarAlerta('error', 'No se puede eliminar el plan porque tiene suscripciones o negocios asociados.');
        this.cdr.markForCheck();
      }
    });
  }
}
