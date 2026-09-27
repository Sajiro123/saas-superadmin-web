export interface Tenant {
  id: string;
  subdominio: string;
  razonSocial: string;
  nombreComercial: string;
  numeroIdentificacion: string;
  verticalId: string; // 'FARMACIA' | 'RETAIL' | 'RESTAURANTE'
  verticalNombre: string;
  planId: string;
  planNombre: string;
  estado: string; // 'ACTIVO' | 'PENDIENTE_CONFIGURACION' | 'SUSPENDIDO'
  emailContacto: string;
  telefonoContacto?: string;
  dbHost?: string;
  logoUrl?: string;
  creadoEn: string;
}

export interface CreateTenantRequest {
  subdominio: string;
  razonSocial: string;
  nombreComercial?: string;
  numeroIdentificacion: string;
  verticalId: string;
  planId: string;
  emailContacto: string;
  telefonoContacto?: string;
  logoUrl?: string;
  dbHost?: string;
  dbPort?: number;
  dbPassword?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
