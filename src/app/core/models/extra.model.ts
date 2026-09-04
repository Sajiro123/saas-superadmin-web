export interface Subscription {
  id: string;
  tenantId: string;
  tenantNombreComercial: string;
  tenantSubdominio: string;
  verticalId: string;
  planId: string;
  planNombre: string;
  montoPago: number;
  metodoPago: string;
  codigoTransaccion: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  creadoEn: string;
}

export interface Plan {
  id: string;
  nombre: string;
  maxSucursales: number;
  maxUsuarios: number;
  precioMensual: number;
  caracteristicas?: string;
  estaActivo: boolean;
}

export interface DatabaseMonitor {
  tenantId: string;
  tenantNombre: string;
  subdominio: string;
  verticalId: string;
  hostBd: string;
  puertoBd: number;
  usuarioBd: string;
  poolMin: number;
  poolMax: number;
  status: string;
  latencyMs: number;
  actualizadoEn: string;
}

export interface AuditLog {
  id: string;
  tenantNombre: string;
  usuarioEmail: string;
  tipoEvento: string;
  descripcion: string;
  detallesJson: string;
  direccionIp: string;
  creadoEn: string;
}
