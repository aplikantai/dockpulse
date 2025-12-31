'use client';

import { PageHeader } from '@/components/layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Plus, Search, Filter, MoreHorizontal, FileText, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Szkic', color: 'bg-gray-100 text-gray-700', icon: FileText },
  sent: { label: 'Wysłana', color: 'bg-blue-100 text-blue-700', icon: Clock },
  accepted: { label: 'Zaakceptowana', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Odrzucona', color: 'bg-red-100 text-red-700', icon: XCircle },
  expired: { label: 'Wygasła', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
};

const quotes = [
  { id: '1', number: 'WYC-2025-0015', customer: 'ABC Sp. z o.o.', status: 'sent' as const, total: '8,500.00 zł', validUntil: '2025-01-25', items: 4 },
  { id: '2', number: 'WYC-2025-0014', customer: 'XYZ S.A.', status: 'accepted' as const, total: '25,000.00 zł', validUntil: '2025-01-20', items: 10 },
  { id: '3', number: 'WYC-2025-0013', customer: 'Firma Kowalski', status: 'draft' as const, total: '2,300.00 zł', validUntil: '-', items: 3 },
  { id: '4', number: 'WYC-2025-0012', customer: 'Tech Solutions', status: 'rejected' as const, total: '15,000.00 zł', validUntil: '2025-01-10', items: 7 },
  { id: '5', number: 'WYC-2025-0011', customer: 'Nowak i Wspólnicy', status: 'expired' as const, total: '4,200.00 zł', validUntil: '2025-01-05', items: 2 },
];

export default function QuotesPage() {
  return (
    <>
      <PageHeader
        title="Wyceny"
        description="Zarządzaj wycenami dla klientów"
        actions={
          <button className="glass-button flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nowa wycena
          </button>
        }
      />

      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Szukaj wycen..." className="glass-input pl-10" />
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nr wyceny</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Klient</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pozycje</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Wartość</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ważna do</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => {
                const status = statusConfig[quote.status];
                const StatusIcon = status.icon;
                return (
                  <tr key={quote.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-500" />
                        </div>
                        <p className="font-medium text-gray-900">{quote.number}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{quote.customer}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{quote.items}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{quote.total}</td>
                    <td className="px-6 py-4 text-gray-600">{quote.validUntil}</td>
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
