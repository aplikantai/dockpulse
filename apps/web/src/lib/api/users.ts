/**
 * Users API Client
 *
 * API functions for managing users, roles, permissions, and audit logs
 */

import { apiGet, apiPost, apiPut, apiDelete } from '../api';

// ===========================================
// TYPES - USER
// ===========================================

export type UserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'VIEWER'
  | 'PLATFORM_ADMIN';

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  avatar?: string;
  role: UserRole;
  permissions: string[];
  customRole?: string;
  active: boolean;
  mustChangePw: boolean;
  lastLogin?: string;
  failedLogins: number;
  lockedUntil?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface CreateUserDto {
  email: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  name: string;
  avatar?: string;
  role: UserRole;
  permissions?: string[];
  customRole?: string;
  mustChangePw?: boolean;
  active?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string;
  role?: UserRole;
  permissions?: string[];
  customRole?: string;
  mustChangePw?: boolean;
  active?: boolean;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordDto {
  newPassword: string;
  mustChangePw?: boolean;
}

export interface UpdatePermissionsDto {
  permissions: string[];
}

// ===========================================
// TYPES - ROLE
// ===========================================

export interface RoleDefinition {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  color: string;
  permissions: string[];
  inheritsFrom?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoleListResponse {
  roles: RoleDefinition[];
  total: number;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  color?: string;
  permissions: string[];
  inheritsFrom?: string;
  sortOrder?: number;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  color?: string;
  permissions?: string[];
  inheritsFrom?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// ===========================================
// TYPES - AUDIT
// ===========================================

export type AuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'STATUS_CHANGED'
  | 'ASSIGNED'
  | 'UNASSIGNED'
  | 'VIEWED'
  | 'EXPORTED'
  | 'IMPORTED'
  | 'SENT'
  | 'APPROVED'
  | 'REJECTED'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET';

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  userName?: string;
  userIp?: string;
  userAgent?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  oldValues?: any;
  newValues?: any;
  changes?: Array<{ field: string; from: any; to: any }>;
  metadata?: any;
  createdAt: string;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

// ===========================================
// TYPES - PERMISSIONS
// ===========================================

export interface Permission {
  key: string;
  description: string;
}

export interface PermissionsByModule {
  [module: string]: Permission[];
}

// ===========================================
// API FUNCTIONS - USERS
// ===========================================

/**
 * Get all users for tenant (with optional filters)
 */
export async function getUsers(filters?: {
  role?: UserRole;
  active?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<UserListResponse> {
  const params = new URLSearchParams();
  if (filters?.role) params.append('role', filters.role);
  if (filters?.active !== undefined) params.append('active', String(filters.active));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiGet<UserListResponse>(`/api/users${query}`);
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  return apiGet<User>('/api/users/me');
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User> {
  return apiGet<User>(`/api/users/${userId}`);
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserDto): Promise<User> {
  return apiPost<User>('/api/users', data);
}

/**
 * Update current user profile
 */
export async function updateCurrentUser(data: UpdateUserDto): Promise<User> {
  return apiPut<User>('/api/users/me', data);
}

/**
 * Update user by ID (admin)
 */
export async function updateUser(userId: string, data: UpdateUserDto): Promise<User> {
  return apiPut<User>(`/api/users/${userId}`, data);
}

/**
 * Delete user (soft delete)
 */
export async function deleteUser(userId: string): Promise<void> {
  return apiDelete<void>(`/api/users/${userId}`);
}

/**
 * Change own password
 */
export async function changePassword(data: ChangePasswordDto): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/api/users/me/change-password', data);
}

/**
 * Reset user password (admin)
 */
export async function resetUserPassword(
  userId: string,
  data: ResetPasswordDto
): Promise<{ message: string }> {
  return apiPost<{ message: string }>(`/api/users/${userId}/reset-password`, data);
}

/**
 * Update user permissions (admin)
 */
export async function updateUserPermissions(
  userId: string,
  data: UpdatePermissionsDto
): Promise<User> {
  return apiPut<User>(`/api/users/${userId}/permissions`, data);
}

/**
 * Unlock user account (admin)
 */
export async function unlockUser(userId: string): Promise<{ message: string }> {
  return apiPost<{ message: string }>(`/api/users/${userId}/unlock`);
}

// ===========================================
// API FUNCTIONS - ROLES
// ===========================================

/**
 * Get all custom roles for tenant
 */
export async function getRoles(filters?: { isActive?: boolean }): Promise<RoleListResponse> {
  const params = new URLSearchParams();
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiGet<RoleListResponse>(`/api/roles${query}`);
}

/**
 * Get role by ID
 */
export async function getRole(roleId: string): Promise<RoleDefinition> {
  return apiGet<RoleDefinition>(`/api/roles/${roleId}`);
}

/**
 * Get role with inherited permissions
 */
export async function getRoleWithInherited(
  roleId: string
): Promise<RoleDefinition & { inheritedPermissions: string[] }> {
  return apiGet(`/api/roles/${roleId}/with-inherited`);
}

/**
 * Create a custom role
 */
export async function createRole(data: CreateRoleDto): Promise<RoleDefinition> {
  return apiPost<RoleDefinition>('/api/roles', data);
}

/**
 * Update a custom role
 */
export async function updateRole(
  roleId: string,
  data: UpdateRoleDto
): Promise<RoleDefinition> {
  return apiPut<RoleDefinition>(`/api/roles/${roleId}`, data);
}

/**
 * Delete a custom role
 */
export async function deleteRole(roleId: string): Promise<void> {
  return apiDelete<void>(`/api/roles/${roleId}`);
}

// ===========================================
// API FUNCTIONS - AUDIT
// ===========================================

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters?: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<AuditLogListResponse> {
  const params = new URLSearchParams();
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.entityType) params.append('entityType', filters.entityType);
  if (filters?.entityId) params.append('entityId', filters.entityId);
  if (filters?.action) params.append('action', filters.action);
  if (filters?.fromDate) params.append('fromDate', filters.fromDate);
  if (filters?.toDate) params.append('toDate', filters.toDate);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiGet<AuditLogListResponse>(`/api/audit${query}`);
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(
  entityType: string,
  entityId: string,
  options?: { limit?: number; offset?: number }
): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.offset) params.append('offset', String(options.offset));

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiGet<AuditLog[]>(`/api/audit/entity/${entityType}/${entityId}${query}`);
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.offset) params.append('offset', String(options.offset));

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiGet<AuditLog[]>(`/api/audit/user/${userId}${query}`);
}

// ===========================================
// API FUNCTIONS - PERMISSIONS
// ===========================================

/**
 * Get all available permissions
 */
export async function getAllPermissions(): Promise<Permission[]> {
  return apiGet<Permission[]>('/api/permissions');
}

/**
 * Get permissions grouped by module
 */
export async function getPermissionsByModule(): Promise<PermissionsByModule> {
  return apiGet<PermissionsByModule>('/api/permissions/by-module');
}

/**
 * Get default permissions for each role
 */
export async function getDefaultRolePermissions(): Promise<Record<UserRole, string[]>> {
  return apiGet<Record<UserRole, string[]>>('/api/permissions/default-roles');
}
