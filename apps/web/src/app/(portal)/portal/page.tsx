'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { GlassCard, GlassCardTitle } from '@/components/ui/GlassCard';
import {
  ShoppingCart,
  FileText,
  Package,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'Nowe', color: 'bg-blue-100 text-blue-700', icon: Clock },
  confirmed: { label: 'Potwierdzone', color: 'bg-yellow-100 text-yellow-700', icon: CheckCircle2 },
  in_progress: { label: 'W realizacji', color: 'bg-purple-100 text-purple-700', icon: Truck },
  completed: { label: 'Zakończone', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

export default function PortalDashboardPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    pendingQuotes: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedCustomer = localStorage.getItem('portal_customer');
    if (storedCustomer) {
      setCustomer(JSON.parse(storedCustomer));
    }

    // Mock data - will be replaced with API calls
    setStats({
      totalOrders: 24,
      pendingOrders: 3,
      totalSpent: 45680,
      pendingQuotes: 2,
    });

    setRecentOrders([
      {
        id: '1',
        orderNumber: 'ZAM-2025-0042',
        status: 'in_progress',
        total: 3450,
        date: '2025-01-15',
        items: 5,
      },
      {
        id: '2',
        orderNumber: 'ZAM-2025-0038',
        status: 'completed',
        total: 12800,
        date: '2025-01-12',
        items: 12,
      },
      {
        id: '3',
        orderNumber: 'ZAM-2025-0035',
        status: 'completed',
        total: 890,
        date: '2025-01-08',
        items: 2,
      },
    ]);

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Witaj, {customer?.name?.split(' ')[0] || 'Kliencie'}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Tutaj znajdziesz przegląd swoich zamówień i wycen
        </p>
      </div>

      {/* Quick action */}
      <Link href="/portal/new-order">
        <GlassCard className="mb-8 cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Złóż nowe zamówienie</h3>
                <p className="text-sm text-gray-500">Wybierz produkty z naszego katalogu</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary" />
          </div>
        </GlassCard>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500">Zamówień łącznie</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              <p className="text-xs text-gray-500">W realizacji</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSpent.toLocaleString('pl-PL')} zł
              </p>
              <p className="text-xs text-gray-500">Wydane łącznie</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingQuotes}</p>
              <p className="text-xs text-gray-500">Oczekujące wyceny</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Recent orders */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <GlassCardTitle>Ostatnie zamówienia</GlassCardTitle>
          <Link
            href="/portal/orders"
            className="text-sm text-primary hover:text-primary-600 font-medium flex items-center gap-1"
          >
            Zobacz wszystkie
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nie masz jeszcze żadnych zamówień</p>
            <Link
              href="/portal/new-order"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-600 transition-colors"
            >
              <Package className="w-4 h-4" />
              Złóż pierwsze zamówienie
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.new;
              const StatusIcon = status.icon;
              return (
                <Link
                  key={order.id}
                  href={`/portal/orders/${order.id}`}
                  className="flex items-center justify-between py-4 hover:bg-gray-50/50 -mx-6 px-6 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">
                        {order.items} produktów • {order.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {order.total.toLocaleString('pl-PL')} zł
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </GlassCard>
    </PortalLayout>
  );
}
