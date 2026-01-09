/**
 * SubmoduleGate Component
 *
 * Conditional rendering component that shows content only if required submodules are enabled
 */

'use client';

import React from 'react';
import { useHasSubmodule, useHasSubmodules } from '@/lib/hooks/useHasSubmodule';

// ===========================================
// TYPES
// ===========================================

interface SubmoduleGateProps {
  /**
   * Single submodule code or array of codes required to show children
   */
  require: string | string[];

  /**
   * Logic for multiple submodules: 'all' (AND) or 'any' (OR)
   * @default 'all'
   */
  logic?: 'all' | 'any';

  /**
   * Content to show when submodule is enabled
   */
  children: React.ReactNode;

  /**
   * Optional fallback content when submodule is not enabled
   */
  fallback?: React.ReactNode;

  /**
   * Optional loading component
   */
  loading?: React.ReactNode;

  /**
   * If true, shows nothing when not enabled (instead of fallback)
   * @default false
   */
  hideWhenDisabled?: boolean;
}

// ===========================================
// SINGLE SUBMODULE GATE
// ===========================================

function SingleSubmoduleGate({
  require: submoduleCode,
  children,
  fallback,
  loading,
  hideWhenDisabled = false,
}: Omit<SubmoduleGateProps, 'logic'> & { require: string }) {
  const { hasSubmodule, isLoading } = useHasSubmodule(submoduleCode);

  // Show loading state
  if (isLoading) {
    return loading ? <>{loading}</> : null;
  }

  // Show children if enabled
  if (hasSubmodule) {
    return <>{children}</>;
  }

  // Show fallback or hide
  if (hideWhenDisabled) {
    return null;
  }

  return fallback ? <>{fallback}</> : null;
}

// ===========================================
// MULTIPLE SUBMODULES GATE
// ===========================================

function MultipleSubmodulesGate({
  require: submoduleCodes,
  logic = 'all',
  children,
  fallback,
  loading,
  hideWhenDisabled = false,
}: Omit<SubmoduleGateProps, 'require'> & { require: string[] }) {
  const { hasAll, hasAny, isLoading } = useHasSubmodules(submoduleCodes);

  // Show loading state
  if (isLoading) {
    return loading ? <>{loading}</> : null;
  }

  // Determine if should show children based on logic
  const shouldShow = logic === 'all' ? hasAll : hasAny;

  // Show children if condition met
  if (shouldShow) {
    return <>{children}</>;
  }

  // Show fallback or hide
  if (hideWhenDisabled) {
    return null;
  }

  return fallback ? <>{fallback}</> : null;
}

// ===========================================
// MAIN COMPONENT
// ===========================================

/**
 * SubmoduleGate - Conditional rendering based on submodule availability
 *
 * @example
 * ```tsx
 * // Single submodule
 * <SubmoduleGate require="CRM.SEGMENTS">
 *   <SegmentsFeature />
 * </SubmoduleGate>
 *
 * // With fallback
 * <SubmoduleGate
 *   require="CRM.SEGMENTS"
 *   fallback={<UpgradePrompt submodule="CRM.SEGMENTS" />}
 * >
 *   <SegmentsFeature />
 * </SubmoduleGate>
 *
 * // Multiple submodules (all required)
 * <SubmoduleGate require={['CRM.SEGMENTS', 'CRM.EXPORT']}>
 *   <ExportSegmentsButton />
 * </SubmoduleGate>
 *
 * // Multiple submodules (any required)
 * <SubmoduleGate
 *   require={['CRM.SEGMENTS', 'CRM.TAGS']}
 *   logic="any"
 * >
 *   <FilterOptions />
 * </SubmoduleGate>
 *
 * // Hide completely when disabled
 * <SubmoduleGate require="CRM.PORTAL" hideWhenDisabled>
 *   <CustomerPortalLink />
 * </SubmoduleGate>
 * ```
 */
export function SubmoduleGate(props: SubmoduleGateProps) {
  const { require: submoduleRequirement } = props;

  // Handle single submodule
  if (typeof submoduleRequirement === 'string') {
    return <SingleSubmoduleGate {...props} require={submoduleRequirement} />;
  }

  // Handle multiple submodules
  return <MultipleSubmodulesGate {...props} require={submoduleRequirement} />;
}

// ===========================================
// UPGRADE PROMPT COMPONENT
// ===========================================

interface UpgradePromptProps {
  submodule: string;
  title?: string;
  description?: string;
  price?: number;
  features?: string[];
  onUpgrade?: () => void;
}

/**
 * Default upgrade prompt component
 *
 * @example
 * ```tsx
 * <SubmoduleGate
 *   require="CRM.SEGMENTS"
 *   fallback={<UpgradePrompt submodule="CRM.SEGMENTS" />}
 * >
 *   <SegmentsFeature />
 * </SubmoduleGate>
 * ```
 */
export function UpgradePrompt({
  submodule,
  title = 'Premium Feature',
  description = 'This feature requires a premium submodule.',
  price,
  features = [],
  onUpgrade,
}: UpgradePromptProps) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Lock Icon */}
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>

        {price && (
          <p className="text-2xl font-bold text-gray-900 mb-4">
            {price} PLN<span className="text-sm text-gray-500">/msc</span>
          </p>
        )}

        {features.length > 0 && (
          <ul className="text-left text-sm text-gray-600 mb-4 space-y-1">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start">
                <svg
                  className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={onUpgrade || (() => alert('Upgrade functionality not implemented'))}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Włącz za {price || '?'} PLN/msc
        </button>

        <p className="text-xs text-gray-500 mt-3">
          Submodule code: <code className="bg-gray-200 px-1 rounded">{submodule}</code>
        </p>
      </div>
    </div>
  );
}

export default SubmoduleGate;
