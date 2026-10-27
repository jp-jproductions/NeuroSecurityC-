import { SedeConEstado, ResumenEstadisticas, RegistroHistorial, AdminUser, SystemStatus } from '../types';

const TOKEN_KEY = 'neuromedica_auth_token';
const USER_KEY = 'neuromedica_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AdminUser | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredSession(token: string, user: AdminUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    if (text && text.length < 150 && !text.includes('<!DOCTYPE') && !text.includes('<html')) {
      data = { error: text.trim() };
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `Error en la solicitud (${response.status})`);
  }

  return data as T;
}

export const api = {
  // Public
  async getSedes(includeArchived: boolean = false): Promise<{ sedes: SedeConEstado[]; total: number; ultima_actualizacion_general: string }> {
    return request(`/api/sedes?include_archived=${includeArchived}`);
  },

  async getStats(): Promise<ResumenEstadisticas> {
    return request('/api/stats');
  },

  async getHistorial(sedeId?: string, limit: number = 100): Promise<{ historial: RegistroHistorial[]; total: number }> {
    const query = new URLSearchParams();
    if (sedeId) query.set('sede_id', sedeId);
    query.set('limit', limit.toString());
    return request(`/api/historial?${query.toString()}`);
  },

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
    const data = await request<{ token: string; user: AdminUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredSession(data.token, data.user);
    return data;
  },

  async checkAuth(): Promise<{ user: AdminUser }> {
    return request('/api/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Admin Actions
  async updateSedeStatus(
    id: string,
    payload: {
      estado_camaras: SystemStatus;
      estado_alarma: SystemStatus;
      nota?: string;
      fecha_revision?: string;
    }
  ): Promise<{ message: string; sede: SedeConEstado }> {
    return request(`/api/admin/sedes/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async markSedeOperational(id: string): Promise<{ message: string; sede: SedeConEstado }> {
    return request(`/api/admin/sedes/${id}/mark-operational`, {
      method: 'POST',
    });
  },

  async bulkUpdateSedes(payload: {
    updates: Array<{
      sede_id: string;
      estado_camaras: SystemStatus;
      estado_alarma: SystemStatus;
      nota?: string;
      fecha_revision?: string;
    }>;
    fecha_revision_general?: string;
  }): Promise<{ message: string; actualizadas: number }> {
    return request('/api/admin/sedes/bulk-update', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createSede(payload: {
    nombre: string;
    grupo: string;
    estado_camaras?: SystemStatus;
    estado_alarma?: SystemStatus;
    nota?: string;
  }): Promise<{ message: string; sede: SedeConEstado }> {
    return request('/api/admin/sedes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateSede(
    id: string,
    payload: {
      nombre?: string;
      grupo?: string;
      activa?: boolean;
      orden?: number;
    }
  ): Promise<{ message: string; sede: SedeConEstado }> {
    return request(`/api/admin/sedes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteSede(id: string, permanent: boolean = false): Promise<{ message: string }> {
    return request(`/api/admin/sedes/${id}?permanent=${permanent}`, {
      method: 'DELETE',
    });
  },

  async getUsers(): Promise<{ users: AdminUser[] }> {
    return request('/api/admin/users');
  },

  async createUser(payload: {
    email: string;
    nombre: string;
    password: string;
    rol: 'superadmin' | 'admin';
  }): Promise<{ message: string; user: AdminUser }> {
    return request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async resetDefaults(): Promise<{ message: string }> {
    return request('/api/admin/reset-defaults', {
      method: 'POST',
    });
  },
};
