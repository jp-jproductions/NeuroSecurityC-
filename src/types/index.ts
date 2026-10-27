export type SystemStatus = 'operativo' | 'desactivado' | 'novedad';

export interface Sede {
  id: string;
  nombre: string;
  grupo: string;
  activa: boolean;
  orden: number;
  creada_en?: string;
}

export interface EstadoSede {
  sede_id: string;
  estado_camaras: SystemStatus;
  estado_alarma: SystemStatus;
  nota: string;
  fecha_revision: string; // ISO 8601 string
  actualizado_en: string;
  actualizado_por: string;
}

export interface SedeConEstado extends Sede {
  estado_camaras: SystemStatus;
  estado_alarma: SystemStatus;
  nota: string;
  fecha_revision: string;
  actualizado_en: string;
  actualizado_por: string;
  // Computed helpers:
  dias_sin_revision: number;
  es_desactualizada: boolean; // > 4 días
  es_100_operativa: boolean;
  tiene_novedad: boolean;
  tiene_desactivado: boolean;
}

export interface RegistroHistorial {
  id: string;
  sede_id: string;
  sede_nombre: string;
  fecha: string;
  usuario: string;
  estado_camaras_anterior: SystemStatus;
  estado_camaras_nuevo: SystemStatus;
  estado_alarma_anterior: SystemStatus;
  estado_alarma_nuevo: SystemStatus;
  nota_anterior?: string;
  nota_nueva?: string;
  tipo_evento: 'actualizacion' | 'creacion' | 'marcado_operativo' | 'masivo' | 'eliminacion';
}

export interface ResumenEstadisticas {
  total_sedes: number;
  operativas_100: number;
  con_novedad: number;
  con_desactivado: number;
  desactualizadas: number;
  ultima_actualizacion_general: string;
}

export interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  rol: 'superadmin' | 'admin';
  creado_en: string;
}

export interface AuthSession {
  token: string;
  user: AdminUser;
}
