import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RbacMasterService, UsuarioMasterDTO, TenantSimpleDTO, PerfilDTO, AccionDTO } from '../../core/services/rbac-master.service';

@Component({
  selector: 'app-usuarios-empresas-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Toast Alert (Modern Soft Enterprise Design) -->
      <div *ngIf="mensajeToast" 
           class="fixed top-20 right-8 z-50 max-w-sm sm:max-w-md w-full p-4 rounded-3xl shadow-xl shadow-slate-900/5 border backdrop-blur-md transition-all duration-300 animate-slide-down flex items-start gap-3.5 bg-white/95 dark:bg-slate-900/95"
           [ngClass]="{
             'border-emerald-200/90 dark:border-emerald-800/80 ring-1 ring-emerald-500/15': mensajeToast.tipo === 'success',
             'border-rose-200/90 dark:border-rose-800/80 ring-1 ring-rose-500/15': mensajeToast.tipo === 'error',
             'border-indigo-200/90 dark:border-indigo-800/80 ring-1 ring-indigo-500/15': mensajeToast.tipo === 'info'
           }">
        
        <div class="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold shadow-2xs border"
             [ngClass]="{
               'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400': mensajeToast.tipo === 'success',
               'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400': mensajeToast.tipo === 'error',
               'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400': mensajeToast.tipo === 'info'
             }">
          <i class="fa-solid" [ngClass]="mensajeToast.tipo === 'success' ? 'fa-check' : mensajeToast.tipo === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info'"></i>
        </div>

        <div class="flex-1 pr-1 pt-0.5">
          <p class="text-[10px] font-black uppercase tracking-wider mb-0.5"
             [ngClass]="{
               'text-emerald-700 dark:text-emerald-400': mensajeToast.tipo === 'success',
               'text-rose-700 dark:text-rose-400': mensajeToast.tipo === 'error',
               'text-indigo-700 dark:text-indigo-400': mensajeToast.tipo === 'info'
             }">
            {{ mensajeToast.tipo === 'success' ? 'Operación Exitosa' : mensajeToast.tipo === 'error' ? 'Atención' : 'Notificación' }}
          </p>
          <p class="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug">
            {{ mensajeToast.texto }}
          </p>
        </div>

        <button type="button" (click)="mensajeToast = null" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 mt-0.5">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
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
          <span class="text-[11px] font-bold uppercase text-slate-400">Total Colaboradores</span>
          <p class="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{{ usuarios.length }}</p>
        </div>

        <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span class="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">🔑 Con Usuario</span>
          <p class="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{{ totalConUsuario }}</p>
        </div>

        <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span class="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">👤 Sin Usuario</span>
          <p class="text-2xl font-black text-slate-500 dark:text-slate-300 font-mono mt-1">{{ totalSinUsuario }}</p>
        </div>

        <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span class="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400">👑 Admins</span>
          <p class="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">{{ totalAdmins }}</p>
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
            <input type="text" [(ngModel)]="busqueda" placeholder="Buscar colaborador, DNI, email..."
                   class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500">
          </div>

          <div class="flex items-center gap-1.5 overflow-x-auto">
            <button (click)="filtroRol = 'TODOS'"
                    [class]="filtroRol === 'TODOS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                    class="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors whitespace-nowrap">
              Todos
            </button>
            <button (click)="filtroRol = 'CON_USUARIO'"
                    [class]="filtroRol === 'CON_USUARIO' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                    class="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors whitespace-nowrap">
              🔑 Con Login
            </button>
            <button (click)="filtroRol = 'SIN_USUARIO'"
                    [class]="filtroRol === 'SIN_USUARIO' ? 'bg-slate-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
                    class="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors whitespace-nowrap">
              👤 Sin Login
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
                <th class="px-6 py-4">Colaborador / Personal</th>
                <th class="px-6 py-4">Documento / DNI</th>
                <th class="px-6 py-4">Acceso Login</th>
                <th class="px-6 py-4">Cargo / Perfil</th>
                <th class="px-6 py-4">Sede Asignada</th>
                <th class="px-6 py-4">Colegiatura / PIN</th>
                <th class="px-6 py-4 text-center">Estado</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800/60">
              <tr *ngIf="usuariosFiltrados.length === 0" class="text-center text-slate-500">
                <td colspan="9" class="px-6 py-12">
                  <i class="fa-solid fa-folder-open text-3xl mb-2 text-slate-400 dark:text-slate-600 block"></i>
                  <span class="text-sm font-medium">No se encontraron colaboradores para la empresa o filtro seleccionado.</span>
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
                      <p class="font-bold text-slate-900 dark:text-white leading-tight">{{ u.negocioNombre || 'Empresa' }}</p>
                      <span class="text-[10px] font-mono text-slate-400">NEGOCIO</span>
                    </div>
                  </div>
                </td>

                <!-- Personal & Nombres -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2.5">
                    <div [ngClass]="getPerfilBadgeClass(u.perfilCodigo)"
                         class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      <i class="fa-solid" [ngClass]="getPerfilIcon(u.perfilCodigo)"></i>
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

                <!-- Acceso Login (Badge Con Usuario vs Sin Usuario) -->
                <td class="px-6 py-4">
                  <div *ngIf="u.tieneUsuario" class="flex flex-col gap-1">
                    <span class="px-2 py-0.5 w-max rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1">
                      <i class="fa-solid fa-key text-[9px]"></i> Con Usuario
                    </span>
                    <span class="font-medium text-slate-700 dark:text-slate-300 font-mono text-xs">{{ u.email }}</span>
                  </div>
                  <div *ngIf="!u.tieneUsuario" class="flex flex-col gap-1">
                    <span class="px-2 py-0.5 w-max rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-500 dark:text-slate-400 font-bold text-[10px] inline-flex items-center gap-1">
                      <i class="fa-solid fa-user text-[9px]"></i> Sin Usuario
                    </span>
                    <span class="text-[11px] text-slate-400 italic">Solo Personal</span>
                  </div>
                </td>

                <!-- Rol -->
                <td class="px-6 py-4">
                  <span class="px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1.5" [ngClass]="getPerfilBadgeClass(u.perfilCodigo)">
                    <i class="fa-solid text-[9px]" [ngClass]="getPerfilIcon(u.perfilCodigo)"></i>
                    <span>{{ u.perfilNombre || u.perfilCodigo }}</span>
                  </span>
                </td>

                <!-- Sede Asignada -->
                <td class="px-6 py-4">
                  <span class="px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <i class="fa-solid fa-building text-indigo-500 text-[9px]"></i>
                    <span>{{ u.sedeNombre || 'Sede Cajamarca Central' }}</span>
                  </span>
                </td>

                <!-- Colegiatura & PIN -->
                <td class="px-6 py-4 text-[11px] font-mono">
                  <span *ngIf="u.nroColegiatura" class="font-bold text-purple-700 dark:text-purple-300 block mb-0.5">{{ u.nroColegiatura }}</span>
                  <div *ngIf="u.tieneUsuario" class="flex items-center gap-1.5">
                    <span class="text-[10px] text-slate-400">PIN:</span>
                    <span class="font-mono font-bold">{{ mostrarPins[u.id || ''] ? (u.pinSeguridad || '1234') : '••••' }}</span>
                    <button (click)="toggleMostrarPin(u.id)" class="text-slate-400 hover:text-slate-700 dark:hover:text-white text-[10px] cursor-pointer">
                      <i class="fa-solid" [ngClass]="mostrarPins[u.id || ''] ? 'fa-eye-slash' : 'fa-eye'"></i>
                    </button>
                  </div>
                  <span *ngIf="!u.tieneUsuario" class="text-slate-400 text-[10px] italic">Sin PIN</span>
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
                  <button (click)="abrirModalEditar(u)" title="Editar Colaborador"
                          class="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                  </button>
                  <button *ngIf="u.tieneUsuario" (click)="verPermisos(u)" title="Ver Permisos RBAC"
                          class="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <i class="fa-solid fa-key text-xs"></i>
                  </button>
                  <button (click)="confirmarEliminar(u)" title="Eliminar Colaborador"
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
            <select [(ngModel)]="usuarioEnEdicion.negocioId" (change)="onTenantChangeInModal()" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
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
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">N° Documento *:</label>
                <input [(ngModel)]="usuarioEnEdicion.numeroDocumento" placeholder="Número de documento (ej: 8 dígitos para DNI)..."
                       class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
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

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Teléfono:</label>
                <input [(ngModel)]="usuarioEnEdicion.telefono" placeholder="987654321" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">N° Colegiatura (CQFP / CMP):</label>
                <input [(ngModel)]="usuarioEnEdicion.nroColegiatura" placeholder="Ej: CQFP 14820" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-purple-700 dark:text-purple-300" />
              </div>
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Fecha de Nacimiento:</label>
                <input [(ngModel)]="usuarioEnEdicion.fechanacimiento" type="date" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200" />
              </div>
            </div>

            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Dirección:</label>
              <input [(ngModel)]="usuarioEnEdicion.direccion" placeholder="Av. / Calle / Distrito" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200" />
            </div>

            <!-- Sede / Sucursal Asignada -->
            <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <label class="block text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <i class="fa-solid fa-building text-indigo-600 dark:text-indigo-400"></i>
                <span>Sede / Sucursal Asignada *:</span>
              </label>
              <select [(ngModel)]="usuarioEnEdicion.sedeId" (change)="onSedeChangeInModal()" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200">
                <option *ngFor="let s of sedesDisponiblesModal" [value]="s.id">{{ s.nombre }} ({{ s.direccion }})</option>
              </select>
              <p class="text-[10px] text-slate-400">Sucursal donde prestará servicios y operará este colaborador.</p>
            </div>
          </div>

          <!-- TAB 2: CUENTA & PERFIL -->
          <div *ngIf="tabModal === 'cuenta'" class="space-y-3 text-xs">
            
            <!-- Toggle Switch: Habilitar Cuenta -->
            <div class="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
              <div>
                <p class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <i class="fa-solid fa-shield-halved text-indigo-600 dark:text-indigo-400"></i>
                  <span>¿Habilitar Cuenta de Acceso (Login)?</span>
                </p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  {{ usuarioEnEdicion.tieneUsuario ? 'Este colaborador tendrá credenciales activas para iniciar sesión' : 'Solo se guardará como personal operativo (sin credenciales de inicio de sesión)' }}
                </p>
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="usuarioEnEdicion.tieneUsuario" class="w-4 h-4 rounded text-indigo-600" />
                <span class="font-bold" [ngClass]="usuarioEnEdicion.tieneUsuario ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'">
                  {{ usuarioEnEdicion.tieneUsuario ? 'CON ACCESO' : 'SIN ACCESO' }}
                </span>
              </label>
            </div>

            <!-- Email, Password, PIN (Si tiene cuenta) -->
            <div *ngIf="usuarioEnEdicion.tieneUsuario" class="space-y-3">
              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Correo Electrónico (Login) *:</label>
                <input [(ngModel)]="usuarioEnEdicion.email" type="email" placeholder="usuario@empresa.com" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-800 dark:text-slate-200" />
              </div>

              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Contraseña: 
                  <span *ngIf="modoEdicion && usuarioOriginalTieneCuenta" class="text-slate-400 font-normal">(Dejar en blanco para no cambiarla)</span>
                  <span *ngIf="!modoEdicion || !usuarioOriginalTieneCuenta" class="text-indigo-600 dark:text-indigo-400 font-normal">(Obligatorio para nueva cuenta)</span>
                </label>
                <input [(ngModel)]="passwordInput" type="password" placeholder="••••••••" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-800 dark:text-slate-200" />
              </div>

              <div>
                <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">PIN Supervisor (4 dígitos):</label>
                <input [(ngModel)]="usuarioEnEdicion.pinSeguridad" type="password" maxlength="6" placeholder="1234" class="w-full text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 dark:text-slate-200" />
              </div>
            </div>

            <div *ngIf="!usuarioEnEdicion.tieneUsuario" class="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-slate-500">
              <i class="fa-solid fa-id-badge text-xl mb-1 text-slate-400"></i>
              <p class="font-bold text-slate-700 dark:text-slate-300">Personal Registrado sin Login</p>
              <p class="text-[10px] text-slate-400 max-w-sm mx-auto">Este personal aparecerá en el directorio del restaurante y roles operativos. Si desea que ingrese al sistema, active el switch superior.</p>
            </div>

            <!-- Perfil / Rol Operativo -->
            <div>
              <label class="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Cargo / Perfil Asignado:</label>
              <select [(ngModel)]="usuarioEnEdicion.perfilCodigo" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200">
                <option *ngFor="let p of perfilesDisponibles" [value]="p.codigo">{{ p.nombre }}</option>
              </select>
            </div>

            <!-- Sede de Operación / Acceso -->
            <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <label class="block text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <i class="fa-solid fa-building text-indigo-600 dark:text-indigo-400"></i>
                <span>Sede de Operación / Acceso *:</span>
              </label>
              <select [(ngModel)]="usuarioEnEdicion.sedeId" (change)="onSedeChangeInModal()" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200">
                <option *ngFor="let s of sedesDisponiblesModal" [value]="s.id">{{ s.nombre }} ({{ s.direccion }})</option>
              </select>
              <p class="text-[10px] text-slate-400">Sede fija donde se emitirán las operaciones y comprobantes del usuario.</p>
            </div>

            <!-- Estado de la persona/usuario -->
            <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-800">
              <div>
                <p class="font-bold text-slate-800 dark:text-white">Estado del Colaborador</p>
                <p class="text-[10px] text-slate-400">Si está inactivo, figura como baja o suspendido</p>
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

      <!-- MODAL PERMISOS RBAC (Dinámica, Interactiva y Personalizable) -->
      <div *ngIf="showPermisosModal && usuarioSeleccionadoPermisos" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div class="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] flex flex-col animate-slide-up">
          
          <!-- Header -->
          <div class="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-base">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Matriz de Permisos & Acciones RBAC</span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <strong class="text-slate-800 dark:text-slate-200">{{ usuarioSeleccionadoPermisos.nombreCompleto || usuarioSeleccionadoPermisos.email }}</strong>
                  <span class="text-slate-400 dark:text-slate-600 mx-1">|</span>
                  <span>{{ usuarioSeleccionadoPermisos.negocioNombre || 'Empresa' }}</span>
                  <span class="text-slate-400 dark:text-slate-600 mx-1">|</span>
                  <span class="font-bold text-indigo-600 dark:text-indigo-400">{{ usuarioSeleccionadoPermisos.perfilNombre || usuarioSeleccionadoPermisos.perfilCodigo }}</span>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span *ngIf="usuarioSeleccionadoPermisos.tienePermisosPersonalizados" 
                    class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <i class="fa-solid fa-wrench mr-1"></i> Personalizado
              </span>
              <span *ngIf="!usuarioSeleccionadoPermisos.tienePermisosPersonalizados" 
                    class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <i class="fa-solid fa-clone mr-1"></i> Heredado de Perfil
              </span>
              <button (click)="showPermisosModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-white w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Quick Action Toolbar -->
          <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 shrink-0 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400">Acciones rápidas:</span>
              <button type="button" (click)="marcarTodos(true)"
                      class="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-slate-700 text-[11px] font-semibold cursor-pointer shadow-2xs transition-colors">
                <i class="fa-solid fa-circle-check text-emerald-600 mr-1"></i> Marcar Todos
              </button>
              <button type="button" (click)="marcarTodos(false)"
                      class="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-slate-700 text-[11px] font-semibold cursor-pointer shadow-2xs transition-colors">
                <i class="fa-solid fa-circle-xmark text-rose-600 mr-1"></i> Desmarcar Todos
              </button>
            </div>

            <button type="button" (click)="restablecerAPerfil()" [disabled]="guardandoPermisos"
                    class="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5">
              <i class="fa-solid fa-rotate-left"></i> Restablecer a Perfil Base
            </button>
          </div>

          <!-- Dynamic Modules List (Scrollable) -->
          <div class="space-y-3.5 overflow-y-auto pr-1 flex-1 text-xs">
            <div *ngFor="let mod of accionesAgrupadas" class="p-3.5 bg-slate-50/70 dark:bg-slate-950/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-indigo-600 dark:text-indigo-400 shadow-2xs">
                    <i class="fa-solid" [ngClass]="mod.icono"></i>
                  </div>
                  <span class="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    {{ mod.titulo }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-mono text-slate-400">
                    {{ mod.acciones.length }} acción(es)
                  </span>
                  <button type="button" (click)="toggleModulo(mod.acciones)"
                          class="text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer"
                          [ngClass]="todosHabilitadosEnModulo(mod.acciones) ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'">
                    {{ todosHabilitadosEnModulo(mod.acciones) ? 'Desmarcar Módulo' : 'Marcar Módulo' }}
                  </button>
                </div>
              </div>

              <!-- Actions Grid inside Module -->
              <div class="grid grid-cols-1 gap-2 pt-1">
                <div *ngFor="let acc of mod.acciones"
                     (click)="togglePermiso(acc.codigo)"
                     [ngClass]="tienePermiso(acc.codigo) ? 'bg-white dark:bg-slate-900 border-emerald-400/80 dark:border-emerald-600/60 shadow-2xs' : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'"
                     class="p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-all select-none">
                  
                  <div class="space-y-0.5 flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-800 dark:text-slate-100 text-xs">
                        {{ acc.nombre }}
                      </span>
                      <span class="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {{ acc.codigo }}
                      </span>
                    </div>
                    <p *ngIf="acc.descripcion" class="text-[10px] text-slate-400 dark:text-slate-500 leading-tight truncate">
                      {{ acc.descripcion }}
                    </p>
                  </div>

                  <!-- Custom Toggle Switch Indicator -->
                  <div class="shrink-0 flex items-center gap-2">
                    <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                          [ngClass]="tienePermiso(acc.codigo) ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'">
                      {{ tienePermiso(acc.codigo) ? 'PERMITIDO' : 'DENEGADO' }}
                    </span>
                    <div class="w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5"
                         [ngClass]="tienePermiso(acc.codigo) ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'">
                      <div class="w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform"
                           [ngClass]="tienePermiso(acc.codigo) ? 'translate-x-5' : 'translate-x-0'">
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div class="text-[11px] text-slate-500 dark:text-slate-400">
              Total asignado: <strong class="text-emerald-600 dark:text-emerald-400 font-mono">{{ permisosSeleccionados.size }}</strong> de <span class="font-mono">{{ acciones.length }}</span> acciones habilitadas.
            </div>

            <div class="flex items-center gap-2">
              <button type="button" (click)="showPermisosModal = false"
                      class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors">
                Cancelar
              </button>

              <button type="button" (click)="guardarPermisos()" [disabled]="guardandoPermisos"
                      class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer transition-all">
                <i *ngIf="guardandoPermisos" class="fa-solid fa-spinner fa-spin"></i>
                <i *ngIf="!guardandoPermisos" class="fa-solid fa-check"></i>
                <span>{{ guardandoPermisos ? 'Guardando...' : 'Guardar Permisos RBAC' }}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  `
})
export class UsuariosEmpresasPageComponent implements OnInit {
  private rbacService = inject(RbacMasterService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  tenants: TenantSimpleDTO[] = [];
  usuarios: UsuarioMasterDTO[] = [];
  perfiles: PerfilDTO[] = [];
  acciones: AccionDTO[] = [];
  sedesDisponiblesModal: any[] = [];

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
  permisosSeleccionados = new Set<string>();
  guardandoPermisos = false;

  ngOnInit() {
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

  usuarioOriginalTieneCuenta = false;

  get usuariosFiltrados(): UsuarioMasterDTO[] {
    return this.usuarios.filter(u => {
      const matchTenant = this.filtroTenantId === 'TODOS' || u.negocioId === this.filtroTenantId;
      let matchRol = true;
      if (this.filtroRol === 'CON_USUARIO') matchRol = !!u.tieneUsuario;
      else if (this.filtroRol === 'SIN_USUARIO') matchRol = !u.tieneUsuario;
      else if (this.filtroRol !== 'TODOS') matchRol = u.perfilCodigo === this.filtroRol;

      const q = this.busqueda.toLowerCase().trim();
      const matchTexto = !q || 
        (u.nombreCompleto && u.nombreCompleto.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.numeroDocumento && u.numeroDocumento.includes(q)) ||
        (u.negocioNombre && u.negocioNombre.toLowerCase().includes(q)) ||
        (u.nroColegiatura && u.nroColegiatura.toLowerCase().includes(q));
      return matchTenant && matchRol && matchTexto;
    });
  }

  get totalConUsuario(): number {
    return this.usuarios.filter(u => u.tieneUsuario).length;
  }

  get totalSinUsuario(): number {
    return this.usuarios.filter(u => !u.tieneUsuario).length;
  }

  get totalAdmins(): number {
    return this.usuarios.filter(u => u.perfilCodigo && u.perfilCodigo.toUpperCase().includes('ADMIN')).length;
  }

  get perfilesDisponibles(): PerfilDTO[] {
    if (this.perfiles && this.perfiles.length > 0) {
      return this.perfiles;
    }
    return [
      { id: '1', codigo: 'ADMIN_NEGOCIO', nombre: 'Administrador de Farmacia', descripcion: '', esSistema: true, estaActivo: true },
      { id: '2', codigo: 'ADMIN_RESTAURANTE', nombre: 'Administrador de Restaurante', descripcion: '', esSistema: true, estaActivo: true },
      { id: '3', codigo: 'MOZO_RESTAURANTE', nombre: 'Mozo / Mesero', descripcion: '', esSistema: true, estaActivo: true },
      { id: '4', codigo: 'COCINERO_RESTAURANTE', nombre: 'Cocinero / Chef', descripcion: '', esSistema: true, estaActivo: true },
      { id: '5', codigo: 'CAJERO_RESTAURANTE', nombre: 'Cajero de Restaurante', descripcion: '', esSistema: true, estaActivo: true },
      { id: '6', codigo: 'QUIMICO_FARMACEUTICO', nombre: 'Químico Farmacéutico (Q.F.)', descripcion: '', esSistema: true, estaActivo: true },
      { id: '7', codigo: 'CAJERO_VENDEDOR', nombre: 'Cajero / Dispensador', descripcion: '', esSistema: true, estaActivo: true }
    ];
  }

  getPerfilBadgeClass(codigo?: string): string {
    const c = (codigo || '').toUpperCase();
    if (c.includes('ADMIN')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    if (c.includes('MOZO')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    if (c.includes('COCIN') || c.includes('CHEF')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
    if (c.includes('QUIMIC')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
    if (c.includes('CAJER')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
  }

  getPerfilIcon(codigo?: string): string {
    const c = (codigo || '').toUpperCase();
    if (c.includes('ADMIN')) return 'fa-crown';
    if (c.includes('MOZO')) return 'fa-utensils';
    if (c.includes('COCIN') || c.includes('CHEF')) return 'fa-fire-burner';
    if (c.includes('QUIMIC')) return 'fa-shield-halved';
    if (c.includes('CAJER')) return 'fa-cash-register';
    return 'fa-user';
  }

  getUsuarioVacio(): UsuarioMasterDTO {
    return {
      negocioId: this.tenants[0]?.id || 'a0000000-0000-0000-0000-000000000004',
      email: '',
      password: '',
      pinSeguridad: '1234',
      estaActivo: true,
      tieneUsuario: false,
      perfilCodigo: 'MOZO_RESTAURANTE',
      tipoDocumento: 'DNI',
      numeroDocumento: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      direccion: '',
      nroColegiatura: '',
      fechanacimiento: ''
    };
  }

  cargarSedesTenant(tenantId?: string) {
    if (!tenantId) return;
    this.http.get<any>(`${environment.masterApiUrl}/tenants/${tenantId}/sedes`).subscribe({
      next: (res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          this.sedesDisponiblesModal = res.data;
          if (!this.usuarioEnEdicion.sedeId) {
            this.usuarioEnEdicion.sedeId = res.data[0].id;
            this.usuarioEnEdicion.sedeNombre = res.data[0].nombre;
          }
        } else {
          this.asignarSedesFallback(tenantId);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.asignarSedesFallback(tenantId);
        this.cdr.markForCheck();
      }
    });
  }

  private asignarSedesFallback(tenantId?: string) {
    const isWilly = tenantId === 'a0000000-0000-0000-0000-000000000004';
    this.sedesDisponiblesModal = [
      isWilly
        ? { id: '44444444-4444-4444-4444-444444444444', nombre: 'Sucursal Manchay - Pachacámac', direccion: 'Av. Víctor Malásquez s/n' }
        : { id: '11111111-1111-1111-1111-111111111111', nombre: 'Sede Cajamarca Central', direccion: 'Av. Central 123' }
    ];
    if (!this.usuarioEnEdicion.sedeId) {
      this.usuarioEnEdicion.sedeId = this.sedesDisponiblesModal[0].id;
      this.usuarioEnEdicion.sedeNombre = this.sedesDisponiblesModal[0].nombre;
    }
  }

  onSedeChangeInModal() {
    const found = this.sedesDisponiblesModal.find(s => s.id === this.usuarioEnEdicion.sedeId);
    if (found) {
      this.usuarioEnEdicion.sedeNombre = found.nombre;
    }
  }

  onTenantChangeInModal() {
    this.usuarioEnEdicion.sedeId = '';
    this.usuarioEnEdicion.sedeNombre = '';
    this.cargarSedesTenant(this.usuarioEnEdicion.negocioId);
  }

  abrirModalNuevo() {
    this.modoEdicion = false;
    this.usuarioOriginalTieneCuenta = false;
    this.usuarioEnEdicion = this.getUsuarioVacio();
    this.passwordInput = '123456';
    this.tabModal = 'persona';
    this.cargarSedesTenant(this.usuarioEnEdicion.negocioId);
    this.showModal = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(u: UsuarioMasterDTO) {
    this.modoEdicion = true;
    this.usuarioOriginalTieneCuenta = !!u.tieneUsuario;
    this.usuarioEnEdicion = { 
      ...u,
      tieneUsuario: !!u.tieneUsuario,
      tipoDocumento: u.tipoDocumento || 'DNI',
      pinSeguridad: u.pinSeguridad || '1234',
      fechanacimiento: u.fechanacimiento || '',
      sedeId: u.sedeId || '',
      sedeNombre: u.sedeNombre || ''
    };
    this.passwordInput = '';
    this.tabModal = 'persona';
    this.cargarSedesTenant(u.negocioId);
    this.showModal = true;
    this.cdr.markForCheck();
  }

  toggleMostrarPin(id?: string) {
    if (!id) return;
    this.mostrarPins[id] = !this.mostrarPins[id];
    this.cdr.markForCheck();
  }

  guardarUsuario() {
    if (!this.usuarioEnEdicion.nombres || !this.usuarioEnEdicion.apellidos) {
      this.mostrarAlerta('error', 'Por favor complete los campos obligatorios: Nombres y Apellidos.');
      return;
    }

    if (this.usuarioEnEdicion.tieneUsuario && !this.usuarioEnEdicion.email) {
      this.mostrarAlerta('error', 'El email es obligatorio para habilitar la cuenta de usuario.');
      return;
    }

    if (this.usuarioEnEdicion.tieneUsuario && !this.usuarioOriginalTieneCuenta && !this.passwordInput) {
      this.mostrarAlerta('error', 'Por favor ingrese una contraseña para habilitar la cuenta de usuario.');
      return;
    }

    this.guardando = true;
    this.cdr.markForCheck();

    if (this.passwordInput) {
      this.usuarioEnEdicion.password = this.passwordInput;
    }

    const payload = { ...this.usuarioEnEdicion };

    if (this.modoEdicion && this.usuarioEnEdicion.id) {
      this.rbacService.actualizarUsuario(this.usuarioEnEdicion.id, payload).subscribe({
        next: () => {
          this.guardando = false;
          this.showModal = false;
          this.mostrarAlerta('success', payload.tieneUsuario ? 'Colaborador y credenciales actualizados exitosamente en Master DB.' : 'Colaborador actualizado exitosamente en Master DB.');
          this.cargarDatos();
        },
        error: () => {
          this.guardando = false;
          this.mostrarAlerta('error', 'Error al actualizar colaborador en Master DB.');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.rbacService.crearUsuario(payload).subscribe({
        next: () => {
          this.guardando = false;
          this.showModal = false;
          this.mostrarAlerta('success', payload.tieneUsuario ? 'Colaborador con cuenta de acceso registrado exitosamente.' : 'Colaborador registrado exitosamente en Master DB.');
          this.cargarDatos();
        },
        error: () => {
          this.guardando = false;
          this.mostrarAlerta('error', 'Error al crear colaborador en Master DB.');
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
        this.mostrarAlerta('success', `Colaborador ${this.usuarioAEliminar?.nombreCompleto || this.usuarioAEliminar?.email} eliminado exitosamente.`);
        this.usuarioAEliminar = null;
        this.cargarDatos();
      },
      error: () => {
        this.eliminando = false;
        this.showDeleteModal = false;
        this.mostrarAlerta('error', 'No se pudo eliminar el colaborador de la base de datos Master.');
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
        this.mostrarAlerta('info', `Colaborador ${u.nombreCompleto || u.email} marcado como ${nuevoEstado ? 'ACTIVO' : 'INACTIVO'}.`);
        this.cdr.markForCheck();
      }
    });
  }

  get accionesAgrupadas(): { modulo: string; titulo: string; icono: string; color: string; acciones: AccionDTO[] }[] {
    const ordenModulos = ['POS', 'INVENTARIO', 'COMPRAS', 'DASHBOARD', 'SEGURIDAD'];
    const metaModulos: Record<string, { titulo: string; icono: string; color: string }> = {
      'POS': {
        titulo: 'Punto de Venta (POS) & Caja',
        icono: 'fa-cash-register',
        color: 'emerald'
      },
      'INVENTARIO': {
        titulo: 'Inventario, Lotes & DIGEMID (FEFO)',
        icono: 'fa-boxes-stacked',
        color: 'purple'
      },
      'COMPRAS': {
        titulo: 'Compras & Cuentas por Pagar (CxP)',
        icono: 'fa-truck-ramp-box',
        color: 'blue'
      },
      'DASHBOARD': {
        titulo: 'Finanzas, Reportes & Rentabilidad',
        icono: 'fa-chart-line',
        color: 'amber'
      },
      'SEGURIDAD': {
        titulo: 'Seguridad, Usuarios & Roles',
        icono: 'fa-shield-halved',
        color: 'indigo'
      }
    };

    const agrupado: Record<string, AccionDTO[]> = {};
    for (const acc of this.acciones) {
      const mod = acc.modulo || 'OTROS';
      if (!agrupado[mod]) agrupado[mod] = [];
      agrupado[mod].push(acc);
    }

    const resultado: { modulo: string; titulo: string; icono: string; color: string; acciones: AccionDTO[] }[] = [];

    for (const m of ordenModulos) {
      if (agrupado[m] && agrupado[m].length > 0) {
        resultado.push({
          modulo: m,
          titulo: metaModulos[m].titulo,
          icono: metaModulos[m].icono,
          color: metaModulos[m].color,
          acciones: agrupado[m]
        });
      }
    }

    for (const m of Object.keys(agrupado)) {
      if (!ordenModulos.includes(m)) {
        resultado.push({
          modulo: m,
          titulo: `Módulo: ${m}`,
          icono: 'fa-folder',
          color: 'slate',
          acciones: agrupado[m]
        });
      }
    }

    return resultado;
  }

  verPermisos(u: UsuarioMasterDTO) {
    this.usuarioSeleccionadoPermisos = u;
    this.permisosSeleccionados = new Set<string>(u.acciones || []);
    this.showPermisosModal = true;
    this.cdr.markForCheck();
  }

  tienePermiso(codigoAccion: string): boolean {
    return this.permisosSeleccionados.has(codigoAccion);
  }

  togglePermiso(codigoAccion: string) {
    if (this.permisosSeleccionados.has(codigoAccion)) {
      this.permisosSeleccionados.delete(codigoAccion);
    } else {
      this.permisosSeleccionados.add(codigoAccion);
    }
    this.cdr.markForCheck();
  }

  todosHabilitadosEnModulo(acciones: AccionDTO[]): boolean {
    if (!acciones || acciones.length === 0) return false;
    return acciones.every(a => this.permisosSeleccionados.has(a.codigo));
  }

  algunoHabilitadoEnModulo(acciones: AccionDTO[]): boolean {
    if (!acciones || acciones.length === 0) return false;
    return acciones.some(a => this.permisosSeleccionados.has(a.codigo));
  }

  toggleModulo(acciones: AccionDTO[]) {
    const todos = this.todosHabilitadosEnModulo(acciones);
    if (todos) {
      acciones.forEach(a => this.permisosSeleccionados.delete(a.codigo));
    } else {
      acciones.forEach(a => this.permisosSeleccionados.add(a.codigo));
    }
    this.cdr.markForCheck();
  }

  marcarTodos(habilitar: boolean) {
    if (habilitar) {
      this.acciones.forEach(a => this.permisosSeleccionados.add(a.codigo));
    } else {
      this.permisosSeleccionados.clear();
    }
    this.cdr.markForCheck();
  }

  restablecerAPerfil() {
    if (!this.usuarioSeleccionadoPermisos?.id) return;
    this.guardandoPermisos = true;
    this.cdr.markForCheck();

    this.rbacService.actualizarAccionesUsuario(this.usuarioSeleccionadoPermisos.id, [], true).subscribe({
      next: (res) => {
        this.guardandoPermisos = false;
        const resData = res?.data;
        const nuevasAcciones = resData?.acciones || [];
        if (this.usuarioSeleccionadoPermisos) {
          this.usuarioSeleccionadoPermisos.acciones = nuevasAcciones;
          this.usuarioSeleccionadoPermisos.tienePermisosPersonalizados = false;
          this.permisosSeleccionados = new Set<string>(nuevasAcciones);
        }
        this.mostrarAlerta('success', 'Permisos restablecidos a los valores por defecto del perfil.');
        this.cargarDatos();
        this.cdr.markForCheck();
      },
      error: () => {
        this.guardandoPermisos = false;
        this.mostrarAlerta('error', 'Error al restablecer permisos.');
        this.cdr.markForCheck();
      }
    });
  }

  guardarPermisos() {
    if (!this.usuarioSeleccionadoPermisos?.id) return;
    this.guardandoPermisos = true;
    this.cdr.markForCheck();

    const accionesArray = Array.from(this.permisosSeleccionados);

    this.rbacService.actualizarAccionesUsuario(this.usuarioSeleccionadoPermisos.id, accionesArray, false).subscribe({
      next: (res) => {
        this.guardandoPermisos = false;
        const resData = res?.data;
        const accionesFinales = resData?.acciones || accionesArray;
        if (this.usuarioSeleccionadoPermisos) {
          this.usuarioSeleccionadoPermisos.acciones = accionesFinales;
          this.usuarioSeleccionadoPermisos.tienePermisosPersonalizados = true;
        }
        this.mostrarAlerta('success', 'Matriz de permisos RBAC guardada con éxito.');
        this.showPermisosModal = false;
        this.cargarDatos();
        this.cdr.markForCheck();
      },
      error: () => {
        this.guardandoPermisos = false;
        this.mostrarAlerta('error', 'Error al guardar los permisos en Master DB.');
        this.cdr.markForCheck();
      }
    });
  }
}
