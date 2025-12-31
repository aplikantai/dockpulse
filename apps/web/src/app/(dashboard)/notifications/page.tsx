'use client';

import { PageHeader } from '@/components/layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Bell, CheckCircle2, ShoppingCart, Users, Clock, Settings } from 'lucide-react';

const notifications = [
  { id: 1, title: 'Nowe zamówienie #ZAM-2025-0042', message: 'Klient ABC Sp. z o.o. złożył nowe zamówienie', time: '5 min temu', read: false, icon: ShoppingCart, color: 'bg-blue-500' },
  { id: 2, title: 'Wycena zaakceptowana', message: 'Klient XYZ S.A. zaakceptował wycenę WYC-2025-0014', time: '1 godz. temu', read: false, icon: CheckCircle2, color: 'bg-green-500' },
  { id: 3, title: 'Nowy klient zarejestrowany', message: 'Firma Nowak sp. j. została dodana do systemu', time: '2 godz. temu', read: true, icon: Users, color: 'bg-purple-500' },
  { id: 4, title: 'Niski stan magazynowy', message: 'Produkt "Widget Premium" ma stan poniżej minimum', time: '3 godz. temu', read: true, icon: Clock, color: 'bg-yellow-500' },
];

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="Powiadomienia"
        description="Centrum powiadomień systemowych"
        actions={
          <button className="glass-button-secondary flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Ustawienia
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-0">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Wszystkie powiadomienia</h3>
              <button className="text-sm text-primary hover:text-primary-600">
                Oznacz wszystkie jako przeczytane
              </button>
            </div>
            <ul className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl ${notif.color}`}>
                      <notif.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{notif.title}</p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        <div>
          <GlassCard>
            <h3 className="font-semibold text-gray-900 mb-4">Podsumowanie</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Nieprzeczytane</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm font-medium">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Dzisiaj</span>
                <span className="text-gray-900 font-medium">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Ten tydzień</span>
                <span className="text-gray-900 font-medium">12</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
