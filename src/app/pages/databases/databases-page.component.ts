import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DatabaseMonitor } from '../../core/models/extra.model';
import { ApiResponse } from '../../core/models/tenant.model';
import { environment } from '../../../environments/environment';

interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  dbVersion?: string;
  message: string;
}

@Component({
  selector: 'app-databases-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <i class="fa-solid fa-database text-violet-600 dark:text-violet-400"></i>
            <span>Bases de Datos Supabase (Data Plane)</span>
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Supervisión en tiempo real de hosts, latencias, pools HikariCP y gestión de contraseñas</p>
        </div>
      </div>

      <!-- Live Test Result Banner -->
      <div *ngIf="testAlert()" class="p-4 rounded-2xl border transition-all flex items-center justify-between"
           [class]="testAlert()?.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'">
        <div class="flex items-center gap-3">
          <i class="fa-solid" [class]="testAlert()?.success ? 'fa-circle-check text-emerald-600 dark:text-emerald-400 text-lg' : 'fa-circle-xmark text-rose-600 dark:text-rose-400 text-lg'"></i>
          <div>
            <p class="font-bold text-xs">{{ testAlert()?.message }}</p>
            <p *ngIf="testAlert()?.dbVersion" class="text-[11px] opacity-80 font-mono mt-0.5">Motor: {{ testAlert()?.dbVersion }}</p>
          </div>
        </div>
        <button (click)="testAlert.set(null)" class="text-xs hover:opacity-70">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Architecture Summary Banner -->
      <div class="glass-panel p-6 rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-gradient-to-r from-violet-50/50 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2">
          <span class="px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-400 font-bold text-[10px] uppercase tracking-wider">
            Silo Isolation Architecture
          </span>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">Database-per-Tenant con Enrutamiento Dinámico</h2>
          <p class="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Cada cliente opera sobre su propia base de datos física en Supabase PostgreSQL (Data Plane). El <strong class="text-slate-900 dark:text-white">Master Control Plane</strong> custodia las credenciales cifradas y las APIs operativas de cada vertical (Farmacias, Retail, Restaurantes) resuelven y abren pools de conexión dinámicos bajo demanda, garantizando aislamiento total entre negocios.
          </p>
        </div>
        <div class="flex items-center gap-4 flex-shrink-0">
          <div class="text-center p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">100%</div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Uptime Pools</div>
          </div>
          <div class="text-center p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="text-2xl font-extrabold text-violet-600 dark:text-violet-400">{{ averageLatency() }} ms</div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Latencia Promedio</div>
          </div>
        </div>
      </div>

      <!-- Databases Grid Table -->
      <div class="glass-panel rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
        <div class="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Proyectos Supabase Asignados</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mapeo de credenciales dinámicas en la Base Central</p>
          </div>
          <span *ngIf="isLoading()" class="px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[11px] font-medium inline-flex items-center gap-1.5 animate-pulse">
            <i class="fa-solid fa-circle-notch fa-spin text-xs"></i>
            <span>Consultando Supabase...</span>
          </span>
        </div>

        <div class="overflow-x-auto w-full">
          <table class="w-full text-left text-xs min-w-[700px]">
            <thead class="bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th class="px-6 py-4">Negocio</th>
                <th class="px-6 py-4">Host Supabase</th>
                <th class="px-6 py-4">Puerto</th>
                <th class="px-6 py-4">Pool Conexiones</th>
                <th class="px-6 py-4">Latencia Ping</th>
                <th class="px-6 py-4">Estado</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800/60">
              <!-- SKELETON LOADING -->
              <ng-container *ngIf="isLoading()">
                <tr *ngFor="let i of [1, 2, 3]" class="animate-pulse">
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36 mb-2"></div><div class="h-3 bg-slate-200/60 dark:bg-slate-800/60 rounded w-20"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/70 dark:bg-slate-800/70 rounded w-48"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/60 dark:bg-slate-800/60 rounded w-12"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/60 dark:bg-slate-800/60 rounded w-28"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-slate-200/80 dark:bg-slate-800/80 rounded w-16"></div></td>
                  <td class="px-6 py-4"><div class="h-5 bg-slate-200/70 dark:bg-slate-800/70 rounded-full w-16"></div></td>
                  <td class="px-6 py-4 text-right"><div class="h-7 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg w-28 ml-auto"></div></td>
                </tr>
              </ng-container>

              <!-- EMPTY STATE -->
              <tr *ngIf="!isLoading() && databases().length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-slate-500">
                  <i class="fa-solid fa-database text-3xl mb-2 text-slate-400 dark:text-slate-600 block"></i>
                  <span class="text-sm font-medium">No se encontraron bases de datos configuradas</span>
                </td>
              </tr>

              <!-- REAL ROWS -->
              <ng-container *ngIf="!isLoading()">
                <tr *ngFor="let db of databases()" class="hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td class="px-6 py-4">
                    <div class="font-bold text-slate-900 dark:text-white">{{ db.tenantNombre }}</div>
                    <div class="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">{{ db.subdominio }}</div>
                  </td>
                  <td class="px-6 py-4 font-mono text-violet-700 dark:text-violet-400 text-[11px]">
                    <span class="flex items-center gap-1.5">
                      <i class="fa-solid fa-server text-slate-400"></i>
                      <span>{{ db.hostBd }}</span>
                    </span>
                  </td>
                  <td class="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">{{ db.puertoBd }}</td>
                  <td class="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    Min: {{ db.poolMin || 2 }} / Max: {{ db.poolMax || 10 }}
                  </td>
                  <td class="px-6 py-4 font-mono" [class]="db.latencyMs > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'">
                    {{ db.latencyMs > 0 ? db.latencyMs + ' ms' : 'Pendiente' }}
                  </td>
                  <td class="px-6 py-4">
                    <span *ngIf="db.status === 'ONLINE'" class="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>ONLINE</span>
                    </span>
                    <span *ngIf="db.status !== 'ONLINE'" class="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-[10px]">
                      STANDBY
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button (click)="openEditModal(db)" title="Configurar Host y Contraseña"
                            class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs transition-all">
                      <i class="fa-solid fa-key text-[10px] mr-1 text-indigo-600 dark:text-indigo-400"></i>
                      <span>Credenciales</span>
                    </button>

                    <button (click)="testConnection(db)" [disabled]="testingId() === db.tenantId"
                            class="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white border border-indigo-200 dark:border-indigo-500/30 font-semibold text-xs transition-all disabled:opacity-50 inline-flex items-center gap-1.5">
                      <i *ngIf="testingId() === db.tenantId" class="fa-solid fa-circle-notch fa-spin text-xs"></i>
                      <i *ngIf="testingId() !== db.tenantId" class="fa-solid fa-bolt text-[10px]"></i>
                      <span>{{ testingId() === db.tenantId ? 'Probando...' : 'Test Conexión' }}</span>
                    </button>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal: Configurar Credenciales -->
    <div *ngIf="editingDb()" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <i class="fa-solid fa-database text-violet-600 dark:text-violet-400"></i>
            <span>Credenciales Supabase: {{ editingDb()?.tenantNombre }}</span>
          </h3>
          <button (click)="editingDb.set(null)" class="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form (ngSubmit)="saveCredentials()" class="space-y-3.5 text-xs">
          <div>
            <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Host Supabase (PostgreSQL)</label>
            <input type="text" [(ngModel)]="credForm.hostBd" name="hostBd" required
                   placeholder="db.xxxxxxxxxxxx.supabase.co"
                   class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Puerto</label>
              <input type="number" [(ngModel)]="credForm.puertoBd" name="puertoBd" required
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Usuario BD</label>
              <input type="text" [(ngModel)]="credForm.usuarioBd" name="usuarioBd" required
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
            </div>
          </div>

          <div>
            <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contraseña de Supabase</label>
            <div class="relative">
              <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="credForm.passwordBd" name="passwordBd"
                     placeholder="Ingresa la nueva contraseña..."
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-3 pr-10 py-2 text-slate-900 dark:text-white font-mono">
              <button type="button" (click)="showPassword.set(!showPassword())"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i class="fa-solid" [class]="showPassword() ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
            <p class="text-[10px] text-slate-500 mt-1">La contraseña se almacena de forma segura en la base de datos central cifrada con AES-256-GCM.</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Pool Mínimo</label>
              <input type="number" [(ngModel)]="credForm.poolMin" name="poolMin"
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
            </div>
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Pool Máximo</label>
              <input type="number" [(ngModel)]="credForm.poolMax" name="poolMax"
                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono">
            </div>
          </div>

          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button type="button" (click)="editingDb.set(null)" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Cancelar</button>
            <button type="submit" [disabled]="isSaving()"
                    class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50">
              <i *ngIf="isSaving()" class="fa-solid fa-circle-notch fa-spin"></i>
              <span>{{ isSaving() ? 'Guardando...' : 'Guardar y Probar' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class DatabasesPageComponent implements OnInit {
  http = inject(HttpClient);
  isLoading = signal<boolean>(true);
  databases = signal<DatabaseMonitor[]>([]);
  testingId = signal<string | null>(null);
  testAlert = signal<ConnectionTestResult | null>(null);

  editingDb = signal<DatabaseMonitor | null>(null);
  showPassword = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  credForm = {
    hostBd: '',
    puertoBd: 5432,
    nombreBd: 'postgres',
    usuarioBd: 'postgres',
    passwordBd: '',
    modoSsl: 'require',
    poolMin: 2,
    poolMax: 10
  };

  ngOnInit(): void {
    this.loadDatabases();
  }

  loadDatabases(): void {
    this.isLoading.set(true);
    this.http.get<ApiResponse<DatabaseMonitor[]>>(`${environment.masterApiUrl}/databases`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.databases.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  averageLatency(): number {
    const list = this.databases().filter(d => d.latencyMs > 0);
    if (list.length === 0) return 42;
    const sum = list.reduce((acc, curr) => acc + curr.latencyMs, 0);
    return Math.round(sum / list.length);
  }

  testConnection(db: DatabaseMonitor): void {
    this.testingId.set(db.tenantId);
    this.testAlert.set(null);

    this.http.post<ApiResponse<ConnectionTestResult>>(`${environment.masterApiUrl}/databases/${db.tenantId}/test-connection`, {}).subscribe({
      next: (res) => {
        this.testingId.set(null);
        if (res.success && res.data) {
          this.testAlert.set(res.data);
          this.databases.update(list => list.map(item => {
            if (item.tenantId === db.tenantId) {
              return {
                ...item,
                status: res.data.success ? 'ONLINE' : 'STANDBY',
                latencyMs: res.data.latencyMs
              };
            }
            return item;
          }));
        }
      },
      error: (err) => {
        this.testingId.set(null);
        this.testAlert.set({
          success: false,
          latencyMs: 0,
          message: err.error?.message || 'Error al conectar con la base de datos'
        });
      }
    });
  }

  openEditModal(db: DatabaseMonitor): void {
    this.editingDb.set(db);
    this.showPassword.set(false);
    this.credForm = {
      hostBd: db.hostBd !== 'No asignado' ? db.hostBd : '',
      puertoBd: db.puertoBd || 5432,
      nombreBd: 'postgres',
      usuarioBd: db.usuarioBd || 'postgres',
      passwordBd: '',
      modoSsl: 'require',
      poolMin: db.poolMin || 2,
      poolMax: db.poolMax || 10
    };
  }

  saveCredentials(): void {
    const current = this.editingDb();
    if (!current) return;

    this.isSaving.set(true);
    this.http.put<ApiResponse<string>>(`${environment.masterApiUrl}/databases/${current.tenantId}/credentials`, this.credForm).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.editingDb.set(null);
        this.loadDatabases();
        setTimeout(() => this.testConnection(current), 500);
      },
      error: (err) => {
        this.isSaving.set(false);
        alert(err.error?.message || 'Error al guardar credenciales');
      }
    });
  }
}
