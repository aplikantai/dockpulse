/**
 * API Helper - Centralized API client for frontend
 *
 * Provides consistent error handling, authorization, and request methods
 * for communicating with the NestJS backend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  headers?: Record<string, string>;
  token?: string;
  adminToken?: string;
}

/**
 * Internal fetch wrapper with error handling
 */
async function apiFetch(
  endpoint: string,
  method: string,
  body?: any,
  options?: RequestOptions
): Promise<any> {
  const url = `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  // Add authorization token if provided
  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  // Add admin token if provided
  if (options?.adminToken) {
    headers['Authorization'] = `Bearer ${options.adminToken}`;
  }

  // Auto-detect token from localStorage if not provided
  if (!options?.token && !options?.adminToken && typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');

    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    throw new ApiError(0, 'Network Error', error);
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  return apiFetch(endpoint, 'GET', undefined, options);
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<T> {
  return apiFetch(endpoint, 'POST', body, options);
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<T> {
  return apiFetch(endpoint, 'PUT', body, options);
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  return apiFetch(endpoint, 'DELETE', undefined, options);
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<T> {
  return apiFetch(endpoint, 'PATCH', body, options);
}

/**
 * Helper to get current auth token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Helper to get current admin token
 */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
}

/**
 * Helper to check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken() || !!getAdminToken();
}

/**
 * Helper to clear auth tokens (logout)
 */
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('adminToken');
}

export { API_URL };
