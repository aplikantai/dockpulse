/**
 * useSubmodules Hook
 *
 * React Query hook for managing submodules
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllSubmodules,
  getSubmodulesByModule,
  getEnabledSubmodules,
  enableSubmodule,
  disableSubmodule,
  batchEnableSubmodules,
  getPricingCatalog,
  type SubmoduleDefinition,
  type EnabledSubmodulesResponse,
} from '../api/submodules';

// ===========================================
// QUERY KEYS
// ===========================================

export const SUBMODULE_KEYS = {
  all: ['submodules'] as const,
  catalog: () => [...SUBMODULE_KEYS.all, 'catalog'] as const,
  byModule: (moduleCode: string) => [...SUBMODULE_KEYS.all, 'module', moduleCode] as const,
  enabled: () => [...SUBMODULE_KEYS.all, 'enabled'] as const,
  enabledDetails: () => [...SUBMODULE_KEYS.all, 'enabled', 'details'] as const,
  pricing: () => [...SUBMODULE_KEYS.all, 'pricing'] as const,
};

// ===========================================
// HOOKS
// ===========================================

/**
 * Hook to get all available submodules (catalog)
 */
export function useSubmodulesCatalog() {
  return useQuery({
    queryKey: SUBMODULE_KEYS.catalog(),
    queryFn: getAllSubmodules,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get submodules for a specific module
 */
export function useSubmodulesByModule(moduleCode: string) {
  return useQuery({
    queryKey: SUBMODULE_KEYS.byModule(moduleCode),
    queryFn: () => getSubmodulesByModule(moduleCode),
    enabled: !!moduleCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get enabled submodules for current tenant
 */
export function useEnabledSubmodules(includeDetails = false) {
  return useQuery({
    queryKey: includeDetails ? SUBMODULE_KEYS.enabledDetails() : SUBMODULE_KEYS.enabled(),
    queryFn: () => getEnabledSubmodules(includeDetails),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get pricing catalog (addon submodules only)
 */
export function usePricingCatalog() {
  return useQuery({
    queryKey: SUBMODULE_KEYS.pricing(),
    queryFn: getPricingCatalog,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to enable a submodule
 */
export function useEnableSubmodule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enableSubmodule,
    onSuccess: () => {
      // Invalidate enabled submodules queries
      queryClient.invalidateQueries({ queryKey: SUBMODULE_KEYS.enabled() });
      queryClient.invalidateQueries({ queryKey: SUBMODULE_KEYS.enabledDetails() });
    },
  });
}

/**
 * Hook to disable a submodule
 */
export function useDisableSubmodule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disableSubmodule,
    onSuccess: () => {
      // Invalidate enabled submodules queries
      queryClient.invalidateQueries({ queryKey: SUBMODULE_KEYS.enabled() });
      queryClient.invalidateQueries({ queryKey: SUBMODULE_KEYS.enabledDetails() });
    },
  });
}

/**
 * Hook to batch enable multiple submodules
 */
export function useBatchEnableSubmodules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchEnableSubmodules,
    onSuccess: () => {
      // Invalidate enabled submodules queries
      queryClient.invalidateQueries({ queryKey: SUBMODULE_KEYS.enabled() });
      queryClient.invalidateQueries({ queryKey: SUBMODULE_KEYS.enabledDetails() });
    },
  });
}

/**
 * Main useSubmodules hook - combines multiple queries for easy use
 *
 * @param moduleCode - Optional module code to filter by
 * @returns Object with submodules data and mutation functions
 *
 * @example
 * ```tsx
 * const { catalog, enabled, enable, disable } = useSubmodules();
 *
 * // Get all available submodules
 * const allSubmodules = catalog.data?.submodules;
 *
 * // Get enabled submodules for tenant
 * const enabledCodes = enabled.data?.submodules;
 *
 * // Enable a submodule
 * enable.mutate('CRM.SEGMENTS');
 * ```
 */
export function useSubmodules(moduleCode?: string) {
  const catalog = useSubmodulesCatalog();
  const byModule = useSubmodulesByModule(moduleCode || '');
  const enabled = useEnabledSubmodules(false);
  const enabledDetails = useEnabledSubmodules(true);
  const pricing = usePricingCatalog();
  const enable = useEnableSubmodule();
  const disable = useDisableSubmodule();
  const batchEnable = useBatchEnableSubmodules();

  // Helper function to check if submodule is enabled
  const isEnabled = (code: string): boolean => {
    if (!enabled.data) return false;

    if (Array.isArray(enabled.data.submodules)) {
      if (typeof enabled.data.submodules[0] === 'string') {
        return (enabled.data.submodules as string[]).includes(code);
      } else {
        return (enabled.data.submodules as any[]).some(
          (sm) => sm.code === code
        );
      }
    }

    return false;
  };

  // Helper function to get submodule definition
  const getSubmodule = (code: string): SubmoduleDefinition | undefined => {
    return catalog.data?.submodules.find((sm) => sm.code === code);
  };

  return {
    // Queries
    catalog,
    byModule: moduleCode ? byModule : undefined,
    enabled,
    enabledDetails,
    pricing,

    // Mutations
    enable,
    disable,
    batchEnable,

    // Helper functions
    isEnabled,
    getSubmodule,

    // Convenience properties
    allSubmodules: catalog.data?.submodules || [],
    enabledSubmodules: enabled.data?.submodules || [],
    moduleSubmodules: byModule.data?.submodules || [],

    // Loading states
    isLoading: catalog.isLoading || enabled.isLoading,
    isError: catalog.isError || enabled.isError,
  };
}
