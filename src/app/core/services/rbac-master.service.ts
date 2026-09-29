import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UsuarioMasterDTO {
  id?: string;
  usuarioId?: string;
  personaId?: string;
  tieneUsuario?: boolean;
  negocioId?: string;
  negocioNombre?: string;
  email: string;
  password?: string;
  pinSeguridad?: string;
  estaActivo: boolean;
  perfilCodigo: string;
  perfilNombre?: string;
  acciones?: string[];
  tienePermisosPersonalizados?: boolean;
  
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  nombreCompleto?: string;
  telefono?: string;
  direccion?: string;
  nroColegiatura?: string;
  fechanacimiento?: string;
  sedeId?: string;
  sedeNombre?: string;
}

export interface SedeSimpleDTO {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  activa?: boolean;
}

export interface TenantSimpleDTO {
  id: string;
  nombreComercial: string;
  razonSocial: string;
  subdominio: string;
  estado: string;
  verticalId: string;
  planId?: string;
}

export interface PerfilDTO {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  esSistema: boolean;
  estaActivo: boolean;
}

export interface AccionDTO {
  id: string;
  codigo: string;
  nombre: string;
  modulo: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class RbacMasterService {
  private http = inject(HttpClient);
  private masterApiUrl = environment.masterApiUrl;

  private decolectaToken = 'sk_19378.UWsZ39cBhh6HbrZlBmpURHd9SPniRJMC';

  private get decolectaUrl(): string {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return '/decolecta-api';
    }
    return 'https://api.decolecta.com/v1';
  }

  listarTenants(): Observable<TenantSimpleDTO[]> {
    return this.http.get<any>(`${this.masterApiUrl}/tenants`).pipe(
      map(res => (res && res.data && Array.isArray(res.data)) ? res.data : []),
      catchError(err => {
        console.error('Error al listar tenants en Master API:', err);
        return of([]);
      })
    );
  }

  listarUsuarios(negocioId?: string): Observable<UsuarioMasterDTO[]> {
    const params: any = {};
    if (negocioId && negocioId !== 'TODOS') {
      params.negocioId = negocioId;
    }

    return this.http.get<any>(`${this.masterApiUrl}/usuarios-negocio`, { params }).pipe(
      map(res => (res && res.data && Array.isArray(res.data)) ? res.data : []),
      catchError(err => {
        console.error('Error al listar usuarios en Master API:', err);
        return of([]);
      })
    );
  }

  crearUsuario(usuario: UsuarioMasterDTO): Observable<UsuarioMasterDTO> {
    return this.http.post<any>(`${this.masterApiUrl}/usuarios-negocio`, usuario).pipe(
      map(res => (res && res.data) ? res.data : usuario)
    );
  }

  actualizarUsuario(id: string, usuario: UsuarioMasterDTO): Observable<UsuarioMasterDTO> {
    return this.http.put<any>(`${this.masterApiUrl}/usuarios-negocio/${id}`, usuario).pipe(
      map(res => (res && res.data) ? res.data : usuario)
    );
  }

  actualizarAccionesUsuario(id: string, acciones: string[], restablecer: boolean = false): Observable<any> {
    return this.http.put<any>(`${this.masterApiUrl}/usuarios-negocio/${id}/acciones`, { acciones, restablecer });
  }

  eliminarUsuario(id: string): Observable<any> {
    return this.http.delete<any>(`${this.masterApiUrl}/usuarios-negocio/${id}`);
  }

  cambiarEstado(id: string, activo: boolean): Observable<any> {
    return this.http.patch<any>(`${this.masterApiUrl}/usuarios-negocio/${id}/estado?activo=${activo}`, {});
  }

  listarPerfiles(): Observable<PerfilDTO[]> {
    return this.http.get<any>(`${this.masterApiUrl}/usuarios-negocio/perfiles`).pipe(
      map(res => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
        return [
          { id: '1', codigo: 'ADMIN_NEGOCIO', nombre: 'Administrador de Farmacia', descripcion: 'Acceso total y configuración', esSistema: true, estaActivo: true },
          { id: '2', codigo: 'QUIMICO_FARMACEUTICO', nombre: 'Director Técnico / Químico Farmacéutico', descripcion: 'DIGEMID, Recetas y Bajas', esSistema: true, estaActivo: true },
          { id: '3', codigo: 'CAJERO_VENDEDOR', nombre: 'Cajero / Dispensador', descripcion: 'POS, Turnos y Ventas', esSistema: true, estaActivo: true },
          { id: '4', codigo: 'ADMIN_RESTAURANTE', nombre: 'Administrador de Restaurante', descripcion: 'Acceso total salón y cocina', esSistema: true, estaActivo: true },
          { id: '5', codigo: 'MOZO_RESTAURANTE', nombre: 'Mozo / Mesero', descripcion: 'Toma de pedidos y comandas', esSistema: true, estaActivo: true },
          { id: '6', codigo: 'COCINERO', nombre: 'Cocinero / Chef', descripcion: 'KDS y preparación', esSistema: true, estaActivo: true }
        ];
      }),
      catchError(() => of([
        { id: '1', codigo: 'ADMIN_NEGOCIO', nombre: 'Administrador de Farmacia', descripcion: 'Acceso total y configuración', esSistema: true, estaActivo: true },
        { id: '2', codigo: 'QUIMICO_FARMACEUTICO', nombre: 'Director Técnico / Químico Farmacéutico', descripcion: 'DIGEMID, Recetas y Bajas', esSistema: true, estaActivo: true },
        { id: '3', codigo: 'CAJERO_VENDEDOR', nombre: 'Cajero / Dispensador', descripcion: 'POS, Turnos y Ventas', esSistema: true, estaActivo: true }
      ]))
    );
  }

  listarAcciones(): Observable<AccionDTO[]> {
    return this.http.get<any>(`${this.masterApiUrl}/usuarios-negocio/acciones`).pipe(
      map(res => (res && res.data) ? res.data : []),
      catchError(() => of([]))
    );
  }

  consultarDni(dni: string): Observable<any> {
    const doc = dni ? dni.trim() : '';
    return this.http.get<any>(`${this.decolectaUrl}/reniec/dni?numero=${doc}&token=${this.decolectaToken}`);
  }

  listarSedesTenant(tenantId?: string): Observable<SedeSimpleDTO[]> {
    if (!tenantId) return of([]);

    const isFarmacia = tenantId === 'a0000000-0000-0000-0000-000000000001';
    const isWilly = tenantId === 'a0000000-0000-0000-0000-000000000004';

    // Para Farmacia: consultar directamente la base de datos Supabase de Farmacia
    if (isFarmacia) {
      const supabaseUrl = 'https://nsrqkzgjouggdzxpxybp.supabase.co';
      const supabaseKey = 'sb_publishable_ImWQQbBmqMzGWw1t-9Z3AA_flpMw8Fe';
      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      };

      return this.http.get<any[]>(`${supabaseUrl}/rest/v1/sucursales?select=*&esta_activo=eq.true&order=es_principal.desc`, { headers }).pipe(
        map(items => {
          if (Array.isArray(items) && items.length > 0) {
            return items.map(s => ({
              id: s.id,
              nombre: s.nombre,
              direccion: s.direccion || '',
              telefono: s.telefono || '',
              activa: s.esta_activo ?? true
            }));
          }
          return [
            { id: '11111111-1111-1111-1111-111111111111', nombre: 'Medicare Farmacia', direccion: 'Av. Central 123, Cajamarca', activa: true },
            { id: '45fca103-2669-48b8-8a1c-7e5380da5e1f', nombre: 'D Kelly Store', direccion: 'Av.Jiron Apurimac 1168', activa: true }
          ];
        }),
        catchError(() => of([
          { id: '11111111-1111-1111-1111-111111111111', nombre: 'Medicare Farmacia', direccion: 'Av. Central 123, Cajamarca', activa: true },
          { id: '45fca103-2669-48b8-8a1c-7e5380da5e1f', nombre: 'D Kelly Store', direccion: 'Av.Jiron Apurimac 1168', activa: true }
        ]))
      );
    }

    if (isWilly) {
      return of([
        { id: '44444444-4444-4444-4444-444444444444', nombre: 'Sucursal Manchay - Pachacámac', direccion: 'Av. Víctor Malásquez s/n', activa: true }
      ]);
    }

    // Para cualquier otro tenant intentar endpoint o fallback genérico
    return this.http.get<any>(`${this.masterApiUrl}/tenants/${tenantId}/sedes`).pipe(
      map(res => (res && res.data && Array.isArray(res.data)) ? res.data : []),
      catchError(() => of([
        { id: '11111111-1111-1111-1111-111111111111', nombre: 'Sede Principal', direccion: 'Sede Principal', activa: true }
      ]))
    );
  }
}
