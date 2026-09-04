import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuditLog } from '../../core/models/extra.model';
import { ApiResponse } from '../../core/models/tenant.model';

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <i class="fa-solid fa-shield-halved text-indigo-600 dark:text-indigo-400"></i>
            <span>Auditoría de Eventos Globales</span>
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Registro cronológico inmutable de aprovisionamiento, logins y modificaciones de clientes</p>
        </div>
      </div>

      <!-- Audit Timeline Table -->
      <div class="glass-panel rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
        <div class="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Eventos Registrados</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Trazabilidad completa de acciones en el SaaS</p>
          </div>
          <span *ngIf="isLoading()" class="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-medium inline-flex items-center gap-1.5 animate-pulse">
            <i class="fa-solid fa-circle-notch fa-spin text-xs"></i>
            <span>Cargando auditoría...</span>
          </span>
        </div>

        <div class="overflow-x-auto w-full">
          <table class="w-full text-left text-xs min-w-[700px]">
            <thead class="bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th class="px-6 py-4">Tipo de Evento</th>
                <th class="px-6 py-4">Negocio Afectado</th>
                <th class="px-6 py-4">Descripción</th>
                <th class="px-6 py-4">IP Origen</th>
                <th class="px-6 py-4">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800/60">
              <!-- SKELETON LOADING -->
              <ng-container *ngIf="isLoading()">
                <tr *ngFor="let i of [1, 2, 3, 4]" class="animate-pulse">
                  <td class="px-6 py-4"><div class="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-36"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/80 dark:bg-slate-800/80 rounded w-28"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/60 dark:bg-slate-800/60 rounded w-64"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/50 dark:bg-slate-800/50 rounded w-20"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/70 dark:bg-slate-800/70 rounded w-32"></div></td>
                </tr>
              </ng-container>

              <!-- EMPTY STATE -->
              <tr *ngIf="!isLoading() && auditLogs().length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                  <i class="fa-solid fa-shield-halved text-3xl mb-2 text-slate-400 dark:text-slate-600 block"></i>
                  <span class="text-sm font-medium">No se registran eventos de auditoría</span>
                </td>
              </tr>

              <!-- REAL ROWS -->
              <ng-container *ngIf="!isLoading()">
                <tr *ngFor="let a of auditLogs()" class="hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[10px]">
                      {{ a.tipoEvento }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-semibold text-slate-900 dark:text-white">{{ a.tenantNombre }}</td>
                  <td class="px-6 py-4 text-slate-700 dark:text-slate-300 max-w-md">{{ a.descripcion }}</td>
                  <td class="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{{ a.direccionIp || '127.0.0.1' }}</td>
                  <td class="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{{ a.creadoEn | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AuditPageComponent implements OnInit {
  http = inject(HttpClient);
  isLoading = signal<boolean>(true);
  auditLogs = signal<AuditLog[]>([]);

  ngOnInit(): void {
    this.isLoading.set(true);
    this.http.get<ApiResponse<AuditLog[]>>('http://localhost:8081/api/v1/audit').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.auditLogs.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
