/**
 * Platform Admin API Client
 * Centralized API calls for platform administration
 */

const API_BASE_URL = 'http://localhost:3003/api/admin';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.message || `Request failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Platform Statistics
 */
export async function getPlatformStats() {
  return fetchApi('/stats');
}

/**
 * Tenant Management
 */
export async function getTenants() {
  return fetchApi('/tenants');
}

export async function getTenantById(id: string) {
  return fetchApi(`/tenants/${id}`);
}

export async function createTenant(data: {
  name: string;
  subdomain: string;
  adminEmail: string;
  adminName: string;
}) {
  return fetchApi('/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTenant(id: string, data: Partial<{
  name: string;
  status: string;
}>) {
  return fetchApi(`/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTenant(id: string) {
  return fetchApi(`/tenants/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Module Management
 */
export async function getModules() {
  return fetchApi('/modules');
}

export async function installModule(tenantId: string, moduleCode: string) {
  return fetchApi(`/tenants/${tenantId}/modules/${moduleCode}`, {
    method: 'POST',
  });
}

export async function uninstallModule(tenantId: string, moduleCode: string) {
  return fetchApi(`/tenants/${tenantId}/modules/${moduleCode}`, {
    method: 'DELETE',
  });
}

export async function toggleModule(
  tenantId: string,
  moduleCode: string,
  enabled: boolean
) {
  return fetchApi(`/tenants/${tenantId}/modules/${moduleCode}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

/**
 * Export API base URL for custom calls
 */
export { API_BASE_URL };
