export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tipoToken: string;
  usuarioId: string;
  email: string;
  tenantId: string;
  subdominio: string;
  nombreComercial: string;
  verticalId: string;
  planId: string;
  esPropietario: boolean;
  esSuperadmin: boolean;
  dbHost: string;
}
