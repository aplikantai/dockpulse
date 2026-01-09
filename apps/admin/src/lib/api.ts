import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dockpulse.com/api';

// API Client
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('platform_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Platform Admin API
export const platformApi = {
  // Auth
  login: (email: string, password: string) =>
    api.post('/platform/auth/login', { email, password }),

  // Tenants
  getTenants: (params?: { status?: string; plan?: string; search?: string }) =>
    api.get('/platform/tenants', { params }),

  getTenant: (id: string) =>
    api.get(`/platform/tenants/${id}`),

  createTenant: (data: any) =>
    api.post('/platform/tenants', data),

  updateTenant: (id: string, data: any) =>
    api.put(`/platform/tenants/${id}`, data),

  deleteTenant: (id: string) =>
    api.delete(`/platform/tenants/${id}`),

  activateTenant: (id: string) =>
    api.post(`/platform/tenants/${id}/activate`),

  suspendTenant: (id: string) =>
    api.post(`/platform/tenants/${id}/suspend`),

  // Stats
  getStats: () =>
    api.get('/platform/stats'),

  // Modules
  getAvailableModules: () =>
    api.get('/platform/modules'),

  getTenantModules: (id: string) =>
    api.get(`/platform/tenants/${id}/modules`),
};

export default api;
