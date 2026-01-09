/**
 * Submodules API Client
 *
 * API functions for managing submodules in the frontend
 */

import { apiGet, apiPost } from '../api';

// ===========================================
// TYPES
// ===========================================

export type SubmoduleCategory = 'INCLUDED' | 'ADDON';

export interface SubmoduleDefinition {
  code: string;
  parentModule: string;
  name: string;
  namePl: string;
  description: string;
  descriptionPl: string;
  icon: string;
  category: SubmoduleCategory;
  price: number | null;
  isActive: boolean;
  isBeta: boolean;
  features: string[];
  routes: string[];
  apiEndpoints: string[];
  requiredSubmodules: string[];
  conflictsWith: string[];
  defaultEnabled: boolean;
  sortOrder: number;
}

export interface SubmoduleCatalogResponse {
  submodules: SubmoduleDefinition[];
  total: number;
}

export interface SubmodulesByModuleResponse {
  moduleCode: string;
  submodules: SubmoduleDefinition[];
  total: number;
}

export interface EnabledSubmodulesResponse {
  tenantId: string;
  submodules: string[] | Array<{
    code: string;
    definition: SubmoduleDefinition;
    enabledAt: string | null;
  }>;
  total: number;
}

export interface SubmoduleCheckResponse {
  tenantId: string;
  submoduleCode: string;
  isEnabled: boolean;
}

export interface SubmoduleActionResponse {
  success: boolean;
  message: string;
  tenantId: string;
  submoduleCode: string;
}

export interface BatchEnableResponse {
  success: boolean;
  tenantId: string;
  enabled: string[];
  skipped: string[];
  errors: string[];
}

export interface PricingCatalogResponse {
  addons: Array<{
    code: string;
    parentModule: string;
    name: string;
    namePl: string;
    description: string;
    descriptionPl: string;
    price: number;
    features: string[];
    category: SubmoduleCategory;
    isBeta: boolean;
  }>;
  total: number;
}

// ===========================================
// API FUNCTIONS
// ===========================================

/**
 * Get all available submodules (catalog)
 */
export async function getAllSubmodules(): Promise<SubmoduleCatalogResponse> {
  return apiGet<SubmoduleCatalogResponse>('/api/submodules');
}

/**
 * Get submodules for a specific module
 */
export async function getSubmodulesByModule(
  moduleCode: string
): Promise<SubmodulesByModuleResponse> {
  return apiGet<SubmodulesByModuleResponse>(`/api/submodules/module/${moduleCode}`);
}

/**
 * Get pricing catalog (addon submodules only)
 */
export async function getPricingCatalog(): Promise<PricingCatalogResponse> {
  return apiGet<PricingCatalogResponse>('/api/submodules/pricing');
}

/**
 * Get enabled submodules for current tenant
 */
export async function getEnabledSubmodules(
  includeDetails?: boolean
): Promise<EnabledSubmodulesResponse> {
  const params = includeDetails ? '?details=true' : '';
  return apiGet<EnabledSubmodulesResponse>(`/api/submodules/enabled${params}`);
}

/**
 * Check if a specific submodule is enabled
 */
export async function checkSubmoduleEnabled(
  code: string
): Promise<SubmoduleCheckResponse> {
  return apiGet<SubmoduleCheckResponse>(`/api/submodules/${code}/check`);
}

/**
 * Enable a submodule
 */
export async function enableSubmodule(
  code: string
): Promise<SubmoduleActionResponse> {
  return apiPost<SubmoduleActionResponse>(`/api/submodules/${code}/enable`);
}

/**
 * Disable a submodule
 */
export async function disableSubmodule(
  code: string
): Promise<SubmoduleActionResponse> {
  return apiPost<SubmoduleActionResponse>(`/api/submodules/${code}/disable`);
}

/**
 * Batch enable multiple submodules
 */
export async function batchEnableSubmodules(
  submoduleCodes: string[]
): Promise<BatchEnableResponse> {
  return apiPost<BatchEnableResponse>('/api/submodules/batch-enable', {
    submoduleCodes,
  });
}

/**
 * Initialize default submodules
 */
export async function initializeDefaultSubmodules(): Promise<{
  success: boolean;
  message: string;
  tenantId: string;
}> {
  return apiPost('/api/submodules/initialize');
}
