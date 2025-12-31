'use client';

import { PageHeader } from '@/components/layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Plus, Search, Filter, MoreHorizontal, Package } from 'lucide-react';

const products = [
  { id: '1', sku: 'PRD-001', name: 'Widget Standard', category: 'Widgety', price: '99.00 zł', stock: 150, active: true },
  { id: '2', sku: 'PRD-002', name: 'Widget Premium', category: 'Widgety', price: '199.00 zł', stock: 75, active: true },
  { id: '3', sku: 'PRD-003', name: 'Gadget Basic', category: 'Gadżety', price: '49.00 zł', stock: 200, active: true },
  { id: '4', sku: 'PRD-004', name: 'Gadget Pro', category: 'Gadżety', price: '149.00 zł', stock: 50, active: true },
  { id: '5', sku: 'PRD-005', name: 'Akcesoria zestaw', category: 'Akcesoria', price: '29.00 zł', stock: 0, active: false },
];

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Produkty"
        description="Zarządzaj katalogiem produktów"
        actions={
          <button className="glass-button flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Dodaj produkt
          </button>
        }
      />

      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Szukaj produktów..." className="glass-input pl-10" />
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Produkt</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">SKU</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Kategoria</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cena</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-500" />
                      </div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">{product.sku}</td>
                  <td className="px-6 py-4 text-gray-600">{product.category}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{product.price}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                      product.stock > 50 ? 'bg-green-100 text-green-700' :
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {product.active ? 'Aktywny' : 'Nieaktywny'}
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
      </GlassCard>
    </>
  );
}
