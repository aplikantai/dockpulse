'use client';

import { PageHeader } from '@/components/layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { BarChart3, Download, FileText, Users, ShoppingCart, Package } from 'lucide-react';

const reportTypes = [
  { name: 'Raport zamówień', description: 'Eksport wszystkich zamówień z wybranego okresu', icon: ShoppingCart, color: 'bg-blue-500' },
  { name: 'Raport klientów', description: 'Lista klientów z historią zamówień', icon: Users, color: 'bg-green-500' },
  { name: 'Raport produktów', description: 'Katalog produktów ze stanami magazynowymi', icon: Package, color: 'bg-purple-500' },
  { name: 'Raport wycen', description: 'Wszystkie wyceny z ich statusami', icon: FileText, color: 'bg-orange-500' },
];

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Raporty"
        description="Generuj i eksportuj raporty"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {reportTypes.map((report) => (
          <GlassCard key={report.name} className="hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${report.color}`}>
                <report.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                <div className="flex gap-2 mt-4">
                  <button className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Wykresy i analityka</h3>
            <p className="text-gray-500 max-w-md">
              Tutaj pojawią się interaktywne wykresy z analizą sprzedaży,
              trendami i prognozami.
            </p>
          </div>
        </div>
      </GlassCard>
    </>
  );
}
