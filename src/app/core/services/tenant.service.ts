import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Tenant, CreateTenantRequest, ApiResponse } from '../models/tenant.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.masterApiUrl}/tenants`;

  tenantsSignal = signal<Tenant[]>([]);

  loadTenants(): Observable<ApiResponse<Tenant[]>> {
    return this.http.get<ApiResponse<Tenant[]>>(this.apiUrl).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.tenantsSignal.set(res.data);
        }
      })
    );
  }

  createTenant(req: CreateTenantRequest): Observable<ApiResponse<Tenant>> {
    return this.http.post<ApiResponse<Tenant>>(this.apiUrl, req).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.tenantsSignal.update(list => [res.data, ...list]);
        }
      })
    );
  }

  updateTenant(id: string, req: any): Observable<ApiResponse<Tenant>> {
    return this.http.put<ApiResponse<Tenant>>(`${this.apiUrl}/${id}`, req).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.tenantsSignal.update(list => list.map(t => t.id === id ? res.data : t));
        }
      })
    );
  }

  deleteTenant(id: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`).pipe(
      tap(res => {
        if (res.success) {
          this.tenantsSignal.update(list => list.filter(t => t.id !== id));
        }
      })
    );
  }
}
