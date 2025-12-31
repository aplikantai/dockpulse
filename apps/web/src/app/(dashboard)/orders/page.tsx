'use client';

import { PageHeader } from '@/components/layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Plus, Search, Filter, MoreHorizontal, ShoppingCart, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';

const statusConfig = {
  new: { label: 'Nowe', color: 'bg-blue-100 text-blue-700', icon: Clock },
  confirmed: { label: 'Potwierdzone', color: 'bg-yellow-100 text-yellow-700', icon: CheckCircle2 },
  in_progress: { label: 'W realizacji', color: 'bg-purple-100 text-purple-700', icon: Truck },
  completed: { label: 'Zakończone', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Anulowane', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const orders = [
  { id: '1', number: 'ZAM-2025-0042', customer: 'ABC Sp. z o.o.', status: 'new' as const, total: '3,450.00 zł', date: '2025-01-15', items: 5 },
  { id: '2', number: 'ZAM-2025-0041', customer: 'XYZ S.A.', status: 'confirmed' as const, total: '12,800.00 zł', date: '2025-01-14', items: 12 },
  { id: '3', number: 'ZAM-2025-0040', customer: 'Firma Kowalski', status: 'in_progress' as const, total: '890.00 zł', date: '2025-01-14', items: 2 },
  { id: '4', number: 'ZAM-2025-0039', customer: 'Tech Solutions', status: 'completed' as const, total: '5,200.00 zł', date: '2025-01-13', items: 8 },
  { id: '5', number: 'ZAM-2025-0038', customer: 'Nowak i Wspólnicy', status: 'cancelled' as const, total: '1,500.00 zł', date: '2025-01-12', items: 3 },
];

export default function OrdersPage() {
  return (
    <>
      <PageHeader
        title="Zamówienia"
        description="Zarządzaj zamówieniami klientów"
        actions={
          <button className="glass-button flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nowe zamówienie
          </button>
        }
      />

      {/* Status filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button className="px-4 py-2 rounded-xl bg-primary text-white font-medium whitespace-nowrap">
          Wszystkie
        </button>
        {Object.entries(statusConfig).map(([key, { label, color }]) => (
          <button key={key} className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap ${color}`}>
            {label}
          </button>
        ))}
      </div>

      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Szukaj zamówień..." className="glass-input pl-10" />
          </div>
          <button className="glass-button-secondary flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtry
          </button>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nr zamówienia</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Klient</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pozycje</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Wartość</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = statusConfig[order.status];
                const StatusIcon = status.icon;
                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-gray-500" />
                        </div>
                        <p className="font-medium text-gray-900">{order.number}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{order.customer}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{order.items}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{order.total}</td>
                    <td className="px-6 py-4 text-gray-600">{order.date}</td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}
