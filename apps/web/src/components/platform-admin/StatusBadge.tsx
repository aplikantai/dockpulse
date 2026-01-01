/**
 * Status Badge Component
 * Reusable status indicator with different variants
 */

import { getStatusColor } from '@/lib/platform-admin/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const colors = getStatusColor(status);

  return (
    <span
      className={`
        px-3 py-1 rounded-full text-xs font-medium border
        ${colors.bg} ${colors.text} ${colors.border}
        ${className}
      `}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/**
 * Status Dot Indicator
 */
interface StatusDotProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  showLabel?: boolean;
  className?: string;
}

export function StatusDot({ status, showLabel = false, className = '' }: StatusDotProps) {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  };

  const labels = {
    online: 'Online',
    offline: 'Offline',
    busy: 'Busy',
    away: 'Away',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
        {status === 'online' && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${colors[status]} animate-ping opacity-75`} />
        )}
      </div>
      {showLabel && (
        <span className="text-sm text-gray-600">{labels[status]}</span>
      )}
    </div>
  );
}
