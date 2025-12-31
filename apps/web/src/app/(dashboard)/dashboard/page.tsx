'use client';

import { PageHeader } from '@/components/layout';
import { GlassCard, GlassCardTitle } from '@/components/ui/GlassCard';
import {
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

// KPI Card Component
function KPICard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            {changeType === 'up' && (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            )}
            {changeType === 'down' && (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ${
                changeType === 'up'
                  ? 'text-green-600'
                  : changeType === 'down'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {change}
            </span>
            <span className="text-sm text-gray-400">vs poprzedni miesiąc</span>
          </div>
        </div>
        <div
          className={`p-3 rounded-xl ${color}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </GlassCard>
  );
}

// Recent Order Component
function RecentOrder({
  orderNumber,
  customer,
  status,
  amount,
  time,
}: {
  orderNumber: string;
  customer: string;
  status: 'new' | 'confirmed' | 'in_progress' | 'completed';
  amount: string;
  time: string;
}) {
  const statusConfig = {
    new: { label: 'Nowe', color: 'bg-blue-100 text-blue-700' },
    confirmed: { label: 'Potwierdzone', color: 'bg-yellow-100 text-yellow-700' },
    in_progress: { label: 'W realizacji', color: 'bg-purple-100 text-purple-700' },
    completed: { label: 'Zakończone', color: 'bg-green-100 text-green-700' },
  };

  const { label, color } = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{orderNumber}</p>
          <p className="text-sm text-gray-500">{customer}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">{amount}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({
  icon: Icon,
  title,
  time,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  time: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Mock data - will be replaced with API calls
  const kpis = [
    {
      title: 'Klienci',
      value: '1,234',
      change: '+12%',
      changeType: 'up' as const,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Zamówienia (miesiąc)',
      value: '456',
      change: '+8%',
      changeType: 'up' as const,
      icon: ShoppingCart,
      color: 'bg-green-500',
    },
    {
      title: 'Produkty',
      value: '89',
      change: '+3',
      changeType: 'neutral' as const,
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      title: 'Przychód (miesiąc)',
      value: '125,430 zł',
      change: '+15%',
      changeType: 'up' as const,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  const recentOrders = [
    { orderNumber: 'ZAM-2025-0042', customer: 'ABC Sp. z o.o.', status: 'new' as const, amount: '3,450 zł', time: '5 min temu' },
    { orderNumber: 'ZAM-2025-0041', customer: 'XYZ S.A.', status: 'confirmed' as const, amount: '12,800 zł', time: '1 godz. temu' },
    { orderNumber: 'ZAM-2025-0040', customer: 'Firma Kowalski', status: 'in_progress' as const, amount: '890 zł', time: '2 godz. temu' },
    { orderNumber: 'ZAM-2025-0039', customer: 'Tech Solutions', status: 'completed' as const, amount: '5,200 zł', time: '3 godz. temu' },
  ];

  const activities = [
    { icon: CheckCircle2, title: 'Zamówienie ZAM-2025-0038 zostało zrealizowane', time: '10 min temu', color: 'bg-green-500' },
    { icon: Users, title: 'Nowy klient: Firma Nowak sp. j.', time: '30 min temu', color: 'bg-blue-500' },
    { icon: ShoppingCart, title: 'Nowe zamówienie od ABC Sp. z o.o.', time: '1 godz. temu', color: 'bg-purple-500' },
    { icon: Clock, title: 'Wycena WYC-2025-0015 oczekuje na akceptację', time: '2 godz. temu', color: 'bg-yellow-500' },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Przegląd najważniejszych wskaźników"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <GlassCardTitle>Ostatnie zamówienia</GlassCardTitle>
              <button className="text-sm text-primary hover:text-primary-600 font-medium">
                Zobacz wszystkie
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <RecentOrder key={order.orderNumber} {...order} />
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Activity Feed */}
        <div>
          <GlassCard>
            <GlassCardTitle className="mb-4">Ostatnia aktywność</GlassCardTitle>
            <div className="divide-y divide-gray-100">
              {activities.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
