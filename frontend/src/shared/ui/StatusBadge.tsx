import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'priority';
}

// Kolory zgodne ze specyfikacją KOLORYSTYKA.md
const statusColors: Record<string, string> = {
  // Order statuses
  NEW: 'bg-[#DBEAFE] text-[#1E40AF]',           // Blue
  CONFIRMED: 'bg-[#CFFAFE] text-[#0E7490]',    // Cyan
  IN_PROGRESS: 'bg-[#FEF3C7] text-[#B45309]',  // Yellow
  READY: 'bg-[#DCFCE7] text-[#166534]',        // Green
  COMPLETED: 'bg-[#F3F4F6] text-[#374151]',    // Gray
  CANCELLED: 'bg-[#FEE2E2] text-[#B91C1C]',    // Red

  // Priorities
  LOW: 'bg-gray-100 text-[#6B7280]',
  NORMAL: 'bg-blue-100 text-[#3B82F6]',
  HIGH: 'bg-orange-100 text-[#F97316]',
  URGENT: 'bg-red-100 text-[#EF4444]',
};

export function StatusBadge({ status, type = 'order' }: StatusBadgeProps) {
  const { t } = useTranslation();

  const translationKey =
    type === 'priority' ? `order.priority.${status}` : `order.status.${status}`;

  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {t(translationKey)}
    </span>
  );
}

export default StatusBadge;
