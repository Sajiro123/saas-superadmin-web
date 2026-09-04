import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RbacMasterService, UsuarioMasterDTO, TenantSimpleDTO, PerfilDTO, AccionDTO } from '../../core/services/rbac-master.service';

@Component({
  selector: 'app-usuarios-empresas-page',
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
            <i class="fa-solid fa-users-gear text-indigo-600 dark:text-indigo-400"></i>
            <span>Usuarios por Empresa (RBAC Master)</span>
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Administración centralizada de usuarios, personas, roles sanitarios DIGEMID y PIN por cada farmacia / empresa
          </p>
        </div>

        <div class="flex items-center gap-2 self-start sm:self-auto">
          <button (click)="cargarDatos()" title="Recargar Lista"
                  class="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer shadow-sm">
            <i class="fa-solid fa-rotate-right" [ngClass]="{'fa-spin': cargando}"></i>
          </button>

          <button (click)="abrirModalNuevo()"
                  class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-plus text-xs"></i>
            <span>Nuevo Usuario en Empresa</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span class="text-[11px] font-bold uppercase text-slate-400">Total Usuarios</span>
          <p class="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{{ usuarios.length }}</p>
        </div>

        <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span class="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">👑 Admins Empresa</span>
          <p class="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{{ totalAdmins }}</p>
        </div>

        <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span class="text-[11px] font-bold uppercase text-purple-600 dark:text-purple-400">💊 Químicos Q.F.</span>
          <p class="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">{{ totalQuimicos }}</p>
        </div>

        <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span class="text-[11px] font-bold uppercase text-blue-600 dark:text-blue-400">🛒 Cajeros / POS</span>
          <p class="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">{{ totalCajeros }}</p>
        </div>

        <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span class="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400">🏢 Empresas Activas</span>
          <p class="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">{{ tenants.length }}</p>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Empresa Selector -->
        <div class="flex items-center gap-2 w-full md:w-auto">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1.5">
            <i class="fa-solid fa-building text-indigo-500"></i> Filtrar Empresa:
          </label>
          <select [(ngModel)]="filtroTenantId" (change)="cambiarFiltroEmpresa()"
                  class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500">
            <option value="TODOS">🌟 Todas las Empresas (Global)</option>
            <option *ngFor="let t of tenants" [value]="t.id">{{ t.nombreComercial }} ({{ t.subdominio }})</option>
          </select>
        </div>

        <!-- Search Bar & Role Filter -->
        <div class="flex items-center gap-2 w-full md:w-auto">
          <div class="relative flex-1 md:w-64">
            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input type="text" [(ngModel)]="busqueda" placeholder="Buscar usuario, DNI, email..."
                   class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500">
          </div>

          <div class="flex items-center gap-1.5 overflow-x-auto">
            <button (click)="filtroRol = 'TODOS'"
                    [class]="filtroRol === 'TODOS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                    class="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors whitespace-nowrap">
              Todos
            </button>
            <button (click)="filtroRol = 'ADMIN_NEGOCIO'"
                    [class]="filtroRol === 'ADMIN_NEGOCIO' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                    class="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors whitespace-nowrap">
              👑 Admins
            </button>
            <button (click)="filtroRol = 'QUIMICO_FARMACEUTICO'"
                    [class]="filtroRol === 'QUIMICO_FARMACEUTICO' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                    class="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors whitespace-nowrap">
              💊 Químicos
            </button>
            <button (click)="filtroRol = 'CAJERO_VENDEDOR'"
                    [class]="filtroRol === 'CAJERO_VENDEDOR' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                    class="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors whitespace-nowrap">
              🛒 Cajeros
            </button>
          </div>
        </div>
      </div>

      <!-- Responsive Users Table -->
      <div class="glass-panel rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
        <div class="overflow-x-auto w-full">
          <table class="w-full text-left text-xs min-w-[760px]">
            <thead class="bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th class="px-6 py-4">Empresa / Negocio</th>
                <th class="px-6 py-4">Personal & Nombres</th>
                <th class="px-6 py-4">Documento / DNI</th>
                <th class="px-6 py-4">Email de Acceso</th>
                <th class="px-6 py-4">Perfil / Rol</th>
                <th class="px-6 py-4">Colegiatura / PIN</th>
                <th class="px-6 py-4 text-center">Estado</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800/60">
              <tr *ngIf="usuariosFiltrados.length === 0" class="text-center text-slate-500">
                <td colspan="8" class="px-6 py-12">
                  <i class="fa-solid fa-folder-open text-3xl mb-2 text-slate-400 dark:text-slate-600 block"></i>
                  <span class="text-sm font-medium">No se encontraron usuarios para la empresa o filtro seleccionado.</span>
                </td>
              </tr>

              <tr *ngFor="let u of usuariosFiltrados" class="hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-colors">
                <!-- Empresa -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
                      <i class="fa-solid fa-store"></i>
                    </span>
                    <div>
                      <p class="font-bold text-slate-900 dark:text-white leading-tight">{{ u.negocioNombre || 'Salud Total 24 Horas' }}</p>
                      <span class="text-[10px] font-mono text-slate-400">FARMACIA</span>
                    </div>
                  </div>
                </td>

                <!-- Personal & Nombres -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2.5">
                    <div [ngClass]="{
                           'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20': u.perfilCodigo === 'ADMIN_NEGOCIO',
                           'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20': u.perfilCodigo === 'QUIMICO_FARMACEUTICO',
                           'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20': u.perfilCodigo === 'CAJERO_VENDEDOR'
                         }"
                         class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      <i class="fa-solid" [ngClass]="u.perfilCodigo === 'ADMIN_NEGOCIO' ? 'fa-crown' : u.perfilCodigo === 'QUIMICO_FARMACEUTICO' ? 'fa-shield-halved' : 'fa-cash-register'"></i>
                    </div>
                    <div>
                      <p class="font-bold text-slate-900 dark:text-white leading-tight">{{ u.nombreCompleto || u.email }}</p>
                      <p class="text-[10px] text-slate-400">{{ u.telefono || 'Sin teléfono' }}</p>
                    </div>
                  </div>
                </td>

                <!-- Documento -->
                <td class="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                  <span class="text-[10px] font-semibold text-slate-400 block">{{ u.tipoDocumento || 'DNI' }}</span>
                  <span>{{ u.numeroDocumento || 'No registrado' }}</span>
                </td>

                <!-- Email -->
                <td class="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                  {{ u.email }}
                </td>

                <!-- Rol -->
                <td class="px-6 py-4">
                  <span *ngIf="u.perfilCodigo === 'ADMIN_NEGOCIO'" class="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-crown text-[9px]"></i>
                    <span>ADMIN EMPRESA</span>
                  </span>
                  <span *ngIf="u.perfilCodigo === 'QUIMICO_FARMACEUTICO'" class="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 font-bold text-[10px] inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-shield-halved text-[9px]"></i>
                    <span>QUÍMICO Q.F.</span>
                  </span>
                  <span *ngIf="u.perfilCodigo === 'CAJERO_VENDEDOR'" class="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 font-bold text-[10px] inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-cash-register text-[9px]"></i>
                    <span>CAJERO / POS</span>
                  </span>
                </td>

                <!-- Colegiatura & PIN -->
                <td class="px-6 py-4 text-[11px] font-mono">
                  <span *ngIf="u.nroColegiatura" class="font-bold text-purple-700 dark:text-purple-300 block mb-0.5">{{ u.nroColegiatura }}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] text-slate-400">PIN:</span>
                    <span class="font-mono font-bold">{{ mostrarPins[u.id || ''] ? (u.pinSeguridad || '1234') : '••••' }}</span>
                    <button (click)="toggleMostrarPin(u.id)" class="text-slate-400 hover:text-slate-700 dark:hover:text-white text-[10px] cursor-pointer">
                      <i class="fa-solid" [ngClass]="mostrarPins[u.id || ''] ? 'fa-eye-slash' : 'fa-eye'"></i>
                    </button>
                  </div>
                </td>

                <!-- Estado -->
                <td class="px-6 py-4 text-center">
                  <button (click)="toggleEstadoUsuario(u)"
                          [ngClass]="u.estaActivo ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400'"
                          class="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all inline-flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full" [ngClass]="u.estaActivo ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                    <span>{{ u.estaActivo ? 'ACTIVO' : 'INACTIVO' }}</span>
                  </button>
                </td>

                <!-- Acciones -->
                <td class="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                  <button (click)="abrirModalEditar(u)" title="Editar Usuario"
                          class="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                  </button>
                  <button (click)="verPermisos(u)" title="Ver Permisos RBAC"
                          class="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <i class="fa-solid fa-key text-xs"></i>
                  </button>
                  <button (click)="confirmarEliminar(u)" title="Eliminar Usuario"
                          class="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL CREAR / EDITAR USUARIO -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid" [ngClass]="modoEdicion ? 'fa-pen-to-square text-amber-500' : 'fa-user-plus text-indigo-600'"></i>
                <span>{{ modoEdicion ? 'Editar Usuario en Empresa' : 'Nuevo Usuario en Empresa' }}</span>
              </h3>
              <p class="text-[11px] text-slate-400">Asignación de cuenta a tenant y persona en Master DB</p>
            </div>
            <button (click)="showModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Empresa Selector -->
          <div>
            <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">🏢 Empresa / Farmacia Destino *</label>
            <select [(ngModel)]="usuarioEnEdicion.negocioId" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
              <option *ngFor="let t of tenants" [value]="t.id">{{ t.nombreComercial }} ({{ t.subdominio }})</option>
            </select>
          </div>

          <!-- Navigation Tabs -->
          <div class="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button (click)="tabModal = 'persona'"
                    [ngClass]="tabModal === 'persona' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'"
                    class="flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-id-card text-xs"></i> 1. Datos Personales
            </button>
            <button (click)="tabModal = 'cuenta'"
                    [ngClass]="tabModal === 'cuenta' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'"
                    class="flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-lock text-xs"></i> 2. Cuenta & Perfil
            </button>
          </div>

          <!-- TAB 1: PERSONA -->
          <div *ngIf="tabModal === 'persona'" class="space-y-3 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tipo Doc:</label>
                <select [(ngModel)]="usuarioEnEdicion.tipoDocumento" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200">
                  <option value="DNI">DNI (Perú)</option>
                  <option value="CE">Carnet Extranjería</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>

              <div class="sm:col-span-2">
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">N° Documento:</label>
                <div class="flex gap-1.5">
                  <input [(ngModel)]="usuarioEnEdicion.numeroDocumento" placeholder="8 dígitos..."
                         class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 dark:text-slate-200" />
                  <button (click)="consultarReniec()" [disabled]="consultandoDni"
                          class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer">
                    <i class="fa-solid" [ngClass]="consultandoDni ? 'fa-spinner fa-spin' : 'fa-magnifying-glass'"></i>
                    <span>RENIEC</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nombres *</label>
                <input [(ngModel)]="usuarioEnEdicion.nombres" placeholder="Nombres" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Apellidos *</label>
                <input [(ngModel)]="usuarioEnEdicion.apellidos" placeholder="Apellidos" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Teléfono:</label>
                <input [(ngModel)]="usuarioEnEdicion.telefono" placeholder="987654321" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">N° Colegiatura (CQFP):</label>
                <input [(ngModel)]="usuarioEnEdicion.nroColegiatura" placeholder="Ej: CQFP 14820" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-purple-700 dark:text-purple-300" />
              </div>
            </div>

            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Dirección:</label>
              <input [(ngModel)]="usuarioEnEdicion.direccion" placeholder="Av. / Calle / Distrito" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200" />
            </div>
          </div>

          <!-- TAB 2: CUENTA -->
          <div *ngIf="tabModal === 'cuenta'" class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email de Acceso *</label>
              <input [(ngModel)]="usuarioEnEdicion.email" type="email" placeholder="usuario@medicare.com" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200" />
            </div>

            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Contraseña:
                <span *ngIf="modoEdicion" class="text-slate-400 font-normal">(Dejar en blanco para no cambiarla)</span>
              </label>
              <input [(ngModel)]="passwordInput" type="password" placeholder="••••••••" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-800 dark:text-slate-200" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Perfil / Rol Asignado:</label>
                <select [(ngModel)]="usuarioEnEdicion.perfilCodigo" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200">
                  <option value="ADMIN_NEGOCIO">👑 Administrador de Farmacia</option>
                  <option value="QUIMICO_FARMACEUTICO">💊 Químico Farmacéutico (Q.F.)</option>
                  <option value="CAJERO_VENDEDOR">🛒 Cajero / Dispensador</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">PIN Supervisor (4 dígitos):</label>
                <input [(ngModel)]="usuarioEnEdicion.pinSeguridad" type="password" maxlength="6" placeholder="1234" class="w-full text-center bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 dark:text-slate-200" />
              </div>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-800">
              <div>
                <p class="font-bold text-slate-800 dark:text-white">Estado de la Cuenta</p>
                <p class="text-[10px] text-slate-400">Si está inactivo, no podrá ingresar al sistema</p>
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="usuarioEnEdicion.estaActivo" class="w-4 h-4 rounded text-indigo-600" />
                <span class="font-bold text-xs" [ngClass]="usuarioEnEdicion.estaActivo ? 'text-emerald-600' : 'text-rose-600'">
                  {{ usuarioEnEdicion.estaActivo ? 'Activo' : 'Inactivo' }}
                </span>
              </label>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button (click)="showModal = false" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              Cancelar
            </button>
            <button (click)="guardarUsuario()" [disabled]="guardando"
                    class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50">
              <i *ngIf="guardando" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ modoEdicion ? 'Actualizar Usuario' : 'Guardar en Master DB' }}</span>
            </button>
          </div>

        </div>
      </div>

      <!-- MODAL CONFIRMAR ELIMINACIÓN -->
      <div *ngIf="showDeleteModal && usuarioAEliminar" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-rose-500/40 shadow-2xl space-y-4 text-center">
          <div class="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-xl">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">¿Eliminar Usuario de Empresa?</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Esta acción eliminará a <strong>{{ usuarioAEliminar.nombreCompleto || usuarioAEliminar.email }}</strong> ({{ usuarioAEliminar.email }}) de la base de datos Master.
            </p>
          </div>
          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button (click)="showDeleteModal = false" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              Cancelar
            </button>
            <button (click)="ejecutarEliminacion()" [disabled]="eliminando"
                    class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50">
              <i *ngIf="eliminando" class="fa-solid fa-spinner fa-spin"></i>
              <span>Sí, Eliminar</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL PERMISOS RBAC -->
      <div *ngIf="showPermisosModal && usuarioSeleccionadoPermisos" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-key text-indigo-600"></i> Matriz de Permisos RBAC
              </h3>
              <p class="text-[11px] text-slate-400">Usuario: <strong>{{ usuarioSeleccionadoPermisos.nombreCompleto }}</strong> ({{ usuarioSeleccionadoPermisos.perfilNombre }})</p>
            </div>
            <button (click)="showPermisosModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="space-y-3 text-xs">
            <!-- POS -->
            <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <p class="font-black text-emerald-700 dark:text-emerald-400 uppercase text-[10px]">Módulo: Punto de Venta (POS)</p>
              <div class="space-y-1">
                <label class="flex items-center gap-2">
                  <input type="checkbox" [checked]="tienePermiso('POS_VENTA_CREAR')" disabled class="rounded text-indigo-600" />
                  <span>Emitir Ventas y Cobros Fraccionados</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" [checked]="tienePermiso('POS_TICKET_ANULAR')" disabled class="rounded text-indigo-600" />
                  <span>Anular Tickets & Autorizar Devolución (Con PIN)</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" [checked]="tienePermiso('POS_ARQUEO_CERRAR')" disabled class="rounded text-indigo-600" />
                  <span>Cierre de Caja & Arqueo Ciego (Reporte Z)</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" [checked]="tienePermiso('POS_RECETA_VALIDAR')" disabled class="rounded text-indigo-600" />
                  <span>Validar Recetas Médicas / Psicotrópicos DIGEMID</span>
                </label>
              </div>
            </div>

            <!-- INVENTARIO & COMPRAS -->
            <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <p class="font-black text-purple-700 dark:text-purple-400 uppercase text-[10px]">Módulo: Inventario & Compras</p>
              <div class="space-y-1">
                <label class="flex items-center gap-2">
                  <input type="checkbox" [checked]="tienePermiso('INVENTARIO_FEFO_VER')" disabled class="rounded text-indigo-600" />
                  <span>Consultar Lotes & Semáforo FEFO</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" [checked]="tienePermiso('INVENTARIO_BAJAS_EMITIR')" disabled class="rounded text-indigo-600" />
                  <span>Emitir Actas Oficiales de Baja y Destrucción DIGEMID</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" [checked]="tienePermiso('COMPRAS_FACTURA_REGISTRAR')" disabled class="rounded text-indigo-600" />
                  <span>Recepcionar Facturas de Droguerías por Cajas</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" [checked]="tienePermiso('COMPRAS_REORDEN_PPR')" disabled class="rounded text-indigo-600" />
                  <span>Punto de Reorden (PPR) & Órdenes de Compra</span>
                </label>
              </div>
            </div>

            <!-- FINANZAS & SEGURIDAD -->
            <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <p class="font-black text-blue-700 dark:text-blue-400 uppercase text-[10px]">Módulo: Finanzas & Seguridad</p>
              <div class="space-y-1">
                <label class="flex items-center gap-2">
                  <input type="checkbox" [checked]="tienePermiso('DASHBOARD_KPI_FINANZAS')" disabled class="rounded text-indigo-600" />
                  <span>Ver Utilidades Netas, Costos y Rentabilidad</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" [checked]="tienePermiso('USUARIOS_ADMINISTRAR')" disabled class="rounded text-indigo-600" />
                  <span>Crear y Editar Usuarios en Base de Datos Master</span>
                </label>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button (click)="showPermisosModal = false" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              Cerrar
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class UsuariosEmpresasPageComponent implements OnInit {
  private rbacService = inject(RbacMasterService);
  private cdr = inject(ChangeDetectorRef);

  tenants: TenantSimpleDTO[] = [];
  usuarios: UsuarioMasterDTO[] = [];
  perfiles: PerfilDTO[] = [];
  acciones: AccionDTO[] = [];

  filtroTenantId = 'TODOS';
  filtroRol = 'TODOS';
  busqueda = '';
  cargando = false;
  guardando = false;

  mensajeToast: { tipo: 'success' | 'error' | 'info'; texto: string } | null = null;

  showModal = false;
  modoEdicion = false;
  tabModal: 'persona' | 'cuenta' = 'persona';
  usuarioEnEdicion: UsuarioMasterDTO = this.getUsuarioVacio();
  passwordInput = '';
  consultandoDni = false;
  mostrarPins: { [key: string]: boolean } = {};

  showDeleteModal = false;
  usuarioAEliminar: UsuarioMasterDTO | null = null;
  eliminando = false;

  showPermisosModal = false;
  usuarioSeleccionadoPermisos: UsuarioMasterDTO | null = null;

  ngOnInit() {
    this.tenants = [...this.rbacService.mockTenants];
    this.usuarios = [...this.rbacService.mockUsuarios];
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    this.cdr.markForCheck();

    // 1. Cargar Tenants
    this.rbacService.listarTenants().subscribe({
      next: (tList) => {
        if (tList && tList.length > 0) this.tenants = [...tList];
        this.cdr.markForCheck();
      }
    });

    // 2. Cargar Usuarios
    const idParam = this.filtroTenantId !== 'TODOS' ? this.filtroTenantId : undefined;
    this.rbacService.listarUsuarios(idParam).subscribe({
      next: (uList) => {
        if (uList && uList.length > 0) this.usuarios = [...uList];
        this.cargando = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });

    // 3. Perfiles & Acciones
    this.rbacService.listarPerfiles().subscribe({ next: p => this.perfiles = p });
    this.rbacService.listarAcciones().subscribe({ next: a => this.acciones = a });
  }

  cambiarFiltroEmpresa() {
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

  get usuariosFiltrados(): UsuarioMasterDTO[] {
    return this.usuarios.filter(u => {
      const matchTenant = this.filtroTenantId === 'TODOS' || u.negocioId === this.filtroTenantId;
      const matchRol = this.filtroRol === 'TODOS' || u.perfilCodigo === this.filtroRol;
      const q = this.busqueda.toLowerCase().trim();
      const matchTexto = !q || 
        (u.nombreCompleto && u.nombreCompleto.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q) ||
        (u.numeroDocumento && u.numeroDocumento.includes(q)) ||
        (u.negocioNombre && u.negocioNombre.toLowerCase().includes(q)) ||
        (u.nroColegiatura && u.nroColegiatura.toLowerCase().includes(q));
      return matchTenant && matchRol && matchTexto;
    });
  }

  get totalAdmins(): number {
    return this.usuarios.filter(u => u.perfilCodigo === 'ADMIN_NEGOCIO').length;
  }

  get totalQuimicos(): number {
    return this.usuarios.filter(u => u.perfilCodigo === 'QUIMICO_FARMACEUTICO').length;
  }

  get totalCajeros(): number {
    return this.usuarios.filter(u => u.perfilCodigo === 'CAJERO_VENDEDOR').length;
  }

  getUsuarioVacio(): UsuarioMasterDTO {
    return {
      negocioId: this.tenants[0]?.id || 'a0000000-0000-0000-0000-000000000002',
      email: '',
      password: '',
      pinSeguridad: '1234',
      estaActivo: true,
      perfilCodigo: 'CAJERO_VENDEDOR',
      tipoDocumento: 'DNI',
      numeroDocumento: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      direccion: '',
      nroColegiatura: ''
    };
  }

  abrirModalNuevo() {
    this.modoEdicion = false;
    this.usuarioEnEdicion = this.getUsuarioVacio();
    this.passwordInput = '123456';
    this.tabModal = 'persona';
    this.showModal = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(u: UsuarioMasterDTO) {
    this.modoEdicion = true;
    this.usuarioEnEdicion = { 
      ...u,
      tipoDocumento: u.tipoDocumento || 'DNI',
      pinSeguridad: u.pinSeguridad || '1234'
    };
    this.passwordInput = '';
    this.tabModal = 'persona';
    this.showModal = true;
    this.cdr.markForCheck();
  }

  toggleMostrarPin(id?: string) {
    if (!id) return;
    this.mostrarPins[id] = !this.mostrarPins[id];
    this.cdr.markForCheck();
  }

  consultarReniec() {
    const doc = this.usuarioEnEdicion.numeroDocumento?.trim();
    if (!doc || doc.length !== 8) {
      this.mostrarAlerta('error', 'Ingresa un DNI válido de 8 dígitos.');
      return;
    }

    this.consultandoDni = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.consultandoDni = false;
      if (doc === '45892018') {
        this.usuarioEnEdicion.nombres = 'Carlos Alberto';
        this.usuarioEnEdicion.apellidos = 'Mendoza Ramos';
        this.usuarioEnEdicion.telefono = '987654321';
      } else if (doc === '41908234') {
        this.usuarioEnEdicion.nombres = 'Elena';
        this.usuarioEnEdicion.apellidos = 'Ramos Salazar';
        this.usuarioEnEdicion.nroColegiatura = 'CQFP 14820';
        this.usuarioEnEdicion.telefono = '976543210';
      } else {
        this.usuarioEnEdicion.nombres = 'ROBERTO CARLOS';
        this.usuarioEnEdicion.apellidos = 'GUTIERREZ PAREDES';
        this.usuarioEnEdicion.telefono = '984567123';
      }
      this.mostrarAlerta('success', 'Datos RENIEC autocompletados correctamente.');
      this.cdr.markForCheck();
    }, 300);
  }

  guardarUsuario() {
    if (!this.usuarioEnEdicion.email || !this.usuarioEnEdicion.nombres || !this.usuarioEnEdicion.apellidos) {
      this.mostrarAlerta('error', 'Por favor complete los campos obligatorios: Nombres, Apellidos y Correo.');
      return;
    }

    this.guardando = true;
    this.cdr.markForCheck();

    if (this.passwordInput) {
      this.usuarioEnEdicion.password = this.passwordInput;
    }

    if (this.modoEdicion && this.usuarioEnEdicion.id) {
      this.rbacService.actualizarUsuario(this.usuarioEnEdicion.id, this.usuarioEnEdicion).subscribe({
        next: () => {
          this.guardando = false;
          this.showModal = false;
          this.mostrarAlerta('success', 'Usuario actualizado exitosamente en Master DB.');
          this.cargarDatos();
        },
        error: () => {
          this.guardando = false;
          this.mostrarAlerta('error', 'Error al actualizar usuario en Master DB.');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.rbacService.crearUsuario(this.usuarioEnEdicion).subscribe({
        next: () => {
          this.guardando = false;
          this.showModal = false;
          this.mostrarAlerta('success', 'Usuario creado y asignado a empresa exitosamente.');
          this.cargarDatos();
        },
        error: () => {
          this.guardando = false;
          this.mostrarAlerta('error', 'Error al crear usuario en Master DB.');
          this.cdr.markForCheck();
        }
      });
    }
  }

  confirmarEliminar(u: UsuarioMasterDTO) {
    this.usuarioAEliminar = u;
    this.showDeleteModal = true;
    this.cdr.markForCheck();
  }

  ejecutarEliminacion() {
    if (!this.usuarioAEliminar || !this.usuarioAEliminar.id) return;
    this.eliminando = true;
    this.cdr.markForCheck();

    this.rbacService.eliminarUsuario(this.usuarioAEliminar.id).subscribe({
      next: () => {
        this.eliminando = false;
        this.showDeleteModal = false;
        this.mostrarAlerta('success', `Usuario ${this.usuarioAEliminar?.email} eliminado exitosamente.`);
        this.usuarioAEliminar = null;
        this.cargarDatos();
      },
      error: () => {
        this.eliminando = false;
        this.showDeleteModal = false;
        this.mostrarAlerta('error', 'No se pudo eliminar el usuario de la base de datos Master.');
        this.cdr.markForCheck();
      }
    });
  }

  toggleEstadoUsuario(u: UsuarioMasterDTO) {
    if (!u.id) return;
    const nuevoEstado = !u.estaActivo;
    this.rbacService.cambiarEstado(u.id, nuevoEstado).subscribe({
      next: () => {
        u.estaActivo = nuevoEstado;
        this.mostrarAlerta('info', `Usuario ${u.email} marcado como ${nuevoEstado ? 'ACTIVO' : 'INACTIVO'}.`);
        this.cdr.markForCheck();
      }
    });
  }

  verPermisos(u: UsuarioMasterDTO) {
    this.usuarioSeleccionadoPermisos = u;
    this.showPermisosModal = true;
    this.cdr.markForCheck();
  }

  tienePermiso(codigoAccion: string): boolean {
    if (!this.usuarioSeleccionadoPermisos) return false;
    if (this.usuarioSeleccionadoPermisos.perfilCodigo === 'ADMIN_NEGOCIO') return true;
    return (this.usuarioSeleccionadoPermisos.acciones || []).includes(codigoAccion);
  }
}
