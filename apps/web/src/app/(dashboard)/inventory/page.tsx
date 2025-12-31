'use client';

import { PageHeader } from '@/components/layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Warehouse, AlertTriangle, CheckCircle2, Package } from 'lucide-react';

export default function InventoryPage() {
  return (
    <>
      <PageHeader
        title="Magazyn"
        description="Zarządzaj stanami magazynowymi"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">W normie</p>
              <p className="text-2xl font-bold text-gray-900">78</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Niski stan</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Brak w magazynie</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Moduł magazynu</h3>
            <p className="text-gray-500 max-w-md">
              Tutaj będzie pełna lista produktów z ich stanami magazynowymi,
              historią zmian i alertami o niskich stanach.
            </p>
          </div>
        </div>
      </GlassCard>
    </>
  );
}
