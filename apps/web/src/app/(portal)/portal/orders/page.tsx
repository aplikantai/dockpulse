'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronRight,
  Package,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'Nowe', color: 'bg-blue-100 text-blue-700', icon: Clock },
  confirmed: { label: 'Potwierdzone', color: 'bg-yellow-100 text-yellow-700', icon: CheckCircle2 },
  in_progress: { label: 'W realizacji', color: 'bg-purple-100 text-purple-700', icon: Truck },
  completed: { label: 'Zakończone', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Anulowane', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function PortalOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Mock data - will be replaced with API call
    setOrders([
      {
        id: '1',
        orderNumber: 'ZAM-2025-0042',
        status: 'in_progress',
        total: 3450,
        date: '2025-01-15',
        items: [
          { name: 'Widget Premium', quantity: 3, price: 597 },
          { name: 'Gadget Pro', quantity: 2, price: 298 },
        ],
      },
      {
        id: '2',
        orderNumber: 'ZAM-2025-0038',
        status: 'completed',
        total: 12800,
        date: '2025-01-12',
        items: [
          { name: 'Widget Standard', quantity: 10, price: 990 },
          { name: 'Gadget Basic', quantity: 5, price: 245 },
        ],
      },
      {
        id: '3',
        orderNumber: 'ZAM-2025-0035',
        status: 'completed',
        total: 890,
        date: '2025-01-08',
        items: [
          { name: 'Akcesoria zestaw', quantity: 2, price: 58 },
        ],
      },
      {
        id: '4',
        orderNumber: 'ZAM-2025-0030',
        status: 'cancelled',
        total: 1500,
        date: '2025-01-05',
        items: [
          { name: 'Widget Premium', quantity: 1, price: 199 },
        ],
      },
    ]);
    setLoading(false);
  }, []);

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Moje zamówienia</h1>
        <p className="text-gray-500 mt-1">Historia wszystkich Twoich zamówień</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-white/70 text-gray-600 hover:bg-gray-100'
          }`}
        >
          Wszystkie ({orders.length})
        </button>
        {Object.entries(statusConfig).map(([key, { label, color }]) => {
          const count = orders.filter((o) => o.status === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                filter === key ? color : 'bg-white/70 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Brak zamówień
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all'
              ? 'Nie masz jeszcze żadnych zamówień'
              : 'Brak zamówień w wybranej kategorii'}
          </p>
          <Link
            href="/portal/new-order"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Package className="w-4 h-4" />
            Złóż zamówienie
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.new;
            const StatusIcon = status.icon;
            return (
              <Link key={order.id} href={`/portal/orders/${order.id}`}>
                <GlassCard className="hover:shadow-xl transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.items.length} produktów • {order.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-gray-900">
                        {order.total.toLocaleString('pl-PL')} zł
                      </p>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      )}
    </PortalLayout>
  );
}
