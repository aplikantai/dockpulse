/**
 * useHasSubmodule Hook
 *
 * Simple hook to check if a submodule is enabled for the current tenant
 */

import { useEnabledSubmodules } from './useSubmodules';

/**
 * Hook to check if a specific submodule is enabled
 *
 * @param submoduleCode - The submodule code to check (e.g., 'CRM.SEGMENTS')
 * @returns Object with enabled status and loading state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasSubmodule, isLoading } = useHasSubmodule('CRM.SEGMENTS');
 *
 *   if (isLoading) return <Spinner />;
 *
 *   if (!hasSubmodule) {
 *     return <UpgradePrompt submodule="CRM.SEGMENTS" />;
 *   }
 *
 *   return <SegmentsFeature />;
 * }
 * ```
 */
export function useHasSubmodule(submoduleCode: string) {
  const { data, isLoading, isError } = useEnabledSubmodules(false);

  // Check if the submodule is in the enabled list
  const hasSubmodule = (() => {
    if (!data || !data.submodules) return false;

    if (Array.isArray(data.submodules)) {
      // Handle both string[] and object[] responses
      if (typeof data.submodules[0] === 'string') {
        return (data.submodules as string[]).includes(submoduleCode);
      } else {
        return (data.submodules as any[]).some(
          (sm) => sm.code === submoduleCode
        );
      }
    }

    return false;
  })();

  return {
    hasSubmodule,
    isLoading,
    isError,
    // Convenience aliases
    enabled: hasSubmodule,
    isEnabled: hasSubmodule,
  };
}

/**
 * Hook to check multiple submodules at once
 *
 * @param submoduleCodes - Array of submodule codes to check
 * @returns Object with results for each submodule
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { results, isLoading } = useHasSubmodules([
 *     'CRM.SEGMENTS',
 *     'CRM.EXPORT'
 *   ]);
 *
 *   const canExportSegments = results['CRM.SEGMENTS'] && results['CRM.EXPORT'];
 * }
 * ```
 */
export function useHasSubmodules(submoduleCodes: string[]) {
  const { data, isLoading, isError } = useEnabledSubmodules(false);

  const results: Record<string, boolean> = {};

  for (const code of submoduleCodes) {
    if (!data || !data.submodules) {
      results[code] = false;
      continue;
    }

    if (Array.isArray(data.submodules)) {
      if (typeof data.submodules[0] === 'string') {
        results[code] = (data.submodules as string[]).includes(code);
      } else {
        results[code] = (data.submodules as any[]).some(
          (sm) => sm.code === code
        );
      }
    } else {
      results[code] = false;
    }
  }

  // Helper to check if ALL submodules are enabled
  const hasAll = submoduleCodes.every((code) => results[code]);

  // Helper to check if ANY submodule is enabled
  const hasAny = submoduleCodes.some((code) => results[code]);

  return {
    results,
    hasAll,
    hasAny,
    isLoading,
    isError,
  };
}
