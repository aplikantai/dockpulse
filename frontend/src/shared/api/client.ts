/**
 * API Client z credentials: 'include' dla httpOnly cookies
 * BEZ localStorage - tokeny sa w cookies!
 */

const API_URL = import.meta.env.VITE_API_URL || '';

// CSRF token (pobierany przy starcie)
let csrfToken: string | null = null;

/**
 * Get tenant slug from subdomain or fallback to env/default
 * e.g., demo.localhost:5173 -> 'demo'
 */
function getTenantSlug(): string {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // For subdomains like demo.localhost or demo.dockpulse.com
  if (parts.length >= 2 && parts[0] !== 'www') {
    // Check it's not just 'localhost' or an IP
    if (parts[0] !== 'localhost' && !parts[0].match(/^\d+$/)) {
      return parts[0];
    }
  }

  // Fallback to env variable or default 'demo' for development
  return import.meta.env.VITE_TENANT_SLUG || 'demo';
}

/**
 * Common headers for all requests
 */
function getHeaders(includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Tenant-Slug': getTenantSlug(),
  };

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
}

/**
 * Inicjalizuj CSRF token - wywolaj na starcie aplikacji
 */
export async function initCSRF(): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/api/csrf-token`, {
      credentials: 'include',
      headers: {
        'X-Tenant-Slug': getTenantSlug(),
      },
    });
    const data = await res.json();
    csrfToken = data.csrfToken;
  } catch (error) {
    console.error('Failed to init CSRF:', error);
  }
}

/**
 * API client z automatycznym credentials i CSRF
 */
export const api = {
  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      credentials: 'include',
      headers: getHeaders(),
    });
    return handleResponse<T>(res);
  },

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(res);
  },

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(res);
  },

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(res);
  },

  async delete<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getHeaders(false),
    });
    return handleResponse<T>(res);
  },

  async uploadFiles(
    endpoint: string,
    files: File[],
    fieldName = 'files'
  ): Promise<unknown> {
    const formData = new FormData();
    files.forEach((file) => formData.append(fieldName, file));

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: getHeaders(false), // No Content-Type for FormData
      body: formData,
    });
    return handleResponse(res);
  },
};

async function handleResponse<T>(res: Response, skipAuthRedirect = false): Promise<T> {
  if (res.status === 401) {
    // Nie przekierowuj automatycznie - to robi AuthContext/guards
    throw new Error('Not authenticated');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  // Handle empty responses
  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default api;
