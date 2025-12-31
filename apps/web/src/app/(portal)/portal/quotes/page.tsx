'use client';

import { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  sent: { label: 'Oczekuje', color: 'bg-blue-100 text-blue-700', icon: Clock },
  accepted: { label: 'Zaakceptowana', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Odrzucona', color: 'bg-red-100 text-red-700', icon: XCircle },
  expired: { label: 'Wygasła', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
};

export default function PortalQuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    // Mock data - will be replaced with API call
    setQuotes([
      {
        id: '1',
        quoteNumber: 'WYC-2025-0015',
        status: 'sent',
        total: 8500,
        validUntil: '2025-01-25',
        items: [
          { name: 'Widget Premium', quantity: 10, price: 1990 },
          { name: 'Gadget Pro', quantity: 5, price: 745 },
        ],
      },
      {
        id: '2',
        quoteNumber: 'WYC-2025-0012',
        status: 'sent',
        total: 3200,
        validUntil: '2025-01-20',
        items: [
          { name: 'Widget Standard', quantity: 20, price: 1980 },
        ],
      },
      {
        id: '3',
        quoteNumber: 'WYC-2025-0010',
        status: 'accepted',
        total: 15000,
        validUntil: '2025-01-15',
        items: [
          { name: 'Gadget Basic', quantity: 50, price: 2450 },
        ],
      },
      {
        id: '4',
        quoteNumber: 'WYC-2025-0008',
        status: 'rejected',
        total: 4200,
        validUntil: '2025-01-10',
        items: [
          { name: 'Akcesoria zestaw', quantity: 100, price: 2900 },
        ],
      },
    ]);
    setLoading(false);
  }, []);

  const handleAccept = async (quoteId: string) => {
    setActionLoading(quoteId);
    // API call would go here
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setQuotes((prev) =>
      prev.map((q) =>
        q.id === quoteId ? { ...q, status: 'accepted' } : q
      )
    );
    setActionLoading(null);
  };

  const handleReject = async (quoteId: string) => {
    setActionLoading(quoteId);
    // API call would go here
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setQuotes((prev) =>
      prev.map((q) =>
        q.id === quoteId ? { ...q, status: 'rejected' } : q
      )
    );
    setActionLoading(null);
  };

  const pendingQuotes = quotes.filter((q) => q.status === 'sent');
  const otherQuotes = quotes.filter((q) => q.status !== 'sent');

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
        <h1 className="text-2xl font-bold text-gray-900">Wyceny</h1>
        <p className="text-gray-500 mt-1">Przeglądaj i akceptuj otrzymane wyceny</p>
      </div>

      {/* Pending quotes */}
      {pendingQuotes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Oczekujące na akceptację ({pendingQuotes.length})
          </h2>
          <div className="space-y-4">
            {pendingQuotes.map((quote) => {
              const isLoading = actionLoading === quote.id;
              return (
                <GlassCard key={quote.id} className="bg-blue-50/50 border-blue-100">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-gray-900">{quote.quoteNumber}</p>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Clock className="w-3.5 h-3.5" />
                            Oczekuje
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {quote.items.length} produktów • Ważna do: {quote.validUntil}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold text-gray-900">
                        {quote.total.toLocaleString('pl-PL')} zł
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(quote.id)}
                          disabled={isLoading}
                          className="
                            px-4 py-2 rounded-xl font-medium
                            bg-white border border-red-200 text-red-600
                            hover:bg-red-50 transition-colors
                            disabled:opacity-50
                            flex items-center gap-2
                          "
                        >
                          <X className="w-4 h-4" />
                          Odrzuć
                        </button>
                        <button
                          onClick={() => handleAccept(quote.id)}
                          disabled={isLoading}
                          className="
                            px-4 py-2 rounded-xl font-medium
                            bg-green-500 text-white
                            hover:bg-green-600 transition-colors
                            disabled:opacity-50
                            flex items-center gap-2
                            shadow-lg shadow-green-500/25
                          "
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Akceptuj
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quote items preview */}
                  <div className="mt-4 pt-4 border-t border-blue-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Zawartość wyceny:</p>
                    <div className="flex flex-wrap gap-2">
                      {quote.items.map((item: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-white rounded-lg text-sm text-gray-600"
                        >
                          {item.name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Other quotes */}
      {otherQuotes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Historia wycen
          </h2>
          <div className="space-y-4">
            {otherQuotes.map((quote) => {
              const status = statusConfig[quote.status];
              const StatusIcon = status.icon;
              return (
                <GlassCard key={quote.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-gray-900">{quote.quoteNumber}</p>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {quote.items.length} produktów • {quote.validUntil}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-gray-900">
                        {quote.total.toLocaleString('pl-PL')} zł
                      </p>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {quotes.length === 0 && (
        <GlassCard className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Brak wycen
          </h3>
          <p className="text-gray-500">
            Nie masz jeszcze żadnych wycen
          </p>
        </GlassCard>
      )}
    </PortalLayout>
  );
}
