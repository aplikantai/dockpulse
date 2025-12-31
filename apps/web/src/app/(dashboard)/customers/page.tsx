'use client';

import { PageHeader } from '@/components/layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Plus, Search, Filter, MoreHorizontal, Mail, Phone } from 'lucide-react';

// Placeholder data
const customers = [
  { id: '1', name: 'ABC Sp. z o.o.', email: 'kontakt@abc.pl', phone: '+48 123 456 789', city: 'Warszawa', orders: 24 },
  { id: '2', name: 'XYZ S.A.', email: 'biuro@xyz.pl', phone: '+48 987 654 321', city: 'Kraków', orders: 18 },
  { id: '3', name: 'Firma Kowalski', email: 'jan@kowalski.pl', phone: '+48 555 123 456', city: 'Poznań', orders: 12 },
  { id: '4', name: 'Tech Solutions', email: 'info@techsolutions.pl', phone: '+48 111 222 333', city: 'Wrocław', orders: 8 },
  { id: '5', name: 'Nowak i Wspólnicy', email: 'biuro@nowak.pl', phone: '+48 444 555 666', city: 'Gdańsk', orders: 5 },
];

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        title="Klienci"
        description="Zarządzaj bazą klientów"
        actions={
          <button className="glass-button flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Dodaj klienta
          </button>
        }
      />

      {/* Filters */}
      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj klientów..."
              className="glass-input pl-10"
            />
          </div>
          <button className="glass-button-secondary flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtry
          </button>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nazwa</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Telefon</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Miasto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Zamówienia</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{customer.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      {customer.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{customer.city}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {customer.orders}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Wyświetlono 1-5 z 5 klientów
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm disabled:opacity-50" disabled>
              Poprzednia
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm disabled:opacity-50" disabled>
              Następna
            </button>
          </div>
        </div>
      </GlassCard>
    </>
  );
}
