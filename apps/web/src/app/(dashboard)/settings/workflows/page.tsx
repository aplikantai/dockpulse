'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout';
import { GlassCard, GlassCardTitle } from '@/components/ui/GlassCard';
import {
  Zap,
  Mail,
  MessageSquare,
  Bell,
  ShoppingCart,
  FileText,
  Users,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Save,
} from 'lucide-react';

interface WorkflowTrigger {
  id: string;
  name: string;
  description: string;
  category: 'orders' | 'quotes' | 'customers' | 'inventory';
  icon: React.ComponentType<{ className?: string }>;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

const defaultTriggers: WorkflowTrigger[] = [
  // Orders
  {
    id: 'order_new',
    name: 'Nowe zamówienie',
    description: 'Powiadomienie o nowym zamówieniu',
    category: 'orders',
    icon: ShoppingCart,
    channels: { email: true, sms: true, push: true },
  },
  {
    id: 'order_confirmed',
    name: 'Zamówienie potwierdzone',
    description: 'Powiadomienie po potwierdzeniu zamówienia',
    category: 'orders',
    icon: CheckCircle2,
    channels: { email: true, sms: false, push: true },
  },
  {
    id: 'order_in_progress',
    name: 'Zamówienie w realizacji',
    description: 'Powiadomienie o rozpoczęciu realizacji',
    category: 'orders',
    icon: Clock,
    channels: { email: true, sms: false, push: true },
  },
  {
    id: 'order_shipped',
    name: 'Zamówienie wysłane',
    description: 'Powiadomienie o wysyłce z numerem śledzenia',
    category: 'orders',
    icon: Truck,
    channels: { email: true, sms: true, push: true },
  },
  {
    id: 'order_completed',
    name: 'Zamówienie zrealizowane',
    description: 'Powiadomienie o zakończeniu zamówienia',
    category: 'orders',
    icon: CheckCircle2,
    channels: { email: true, sms: false, push: false },
  },

  // Quotes
  {
    id: 'quote_new',
    name: 'Nowa wycena',
    description: 'Powiadomienie klienta o nowej wycenie',
    category: 'quotes',
    icon: FileText,
    channels: { email: true, sms: true, push: true },
  },
  {
    id: 'quote_expiring',
    name: 'Wycena wygasa',
    description: 'Przypomnienie przed wygaśnięciem wyceny',
    category: 'quotes',
    icon: Clock,
    channels: { email: true, sms: false, push: true },
  },
  {
    id: 'quote_accepted',
    name: 'Wycena zaakceptowana',
    description: 'Powiadomienie o akceptacji wyceny przez klienta',
    category: 'quotes',
    icon: CheckCircle2,
    channels: { email: true, sms: true, push: true },
  },

  // Customers
  {
    id: 'customer_welcome',
    name: 'Powitanie klienta',
    description: 'Email powitalny z danymi dostępowymi do portalu',
    category: 'customers',
    icon: Users,
    channels: { email: true, sms: true, push: false },
  },
  {
    id: 'customer_password_reset',
    name: 'Reset hasła',
    description: 'Powiadomienie z nowym hasłem',
    category: 'customers',
    icon: Users,
    channels: { email: false, sms: true, push: false },
  },

  // Inventory
  {
    id: 'inventory_low',
    name: 'Niski stan magazynowy',
    description: 'Alert gdy produkt spadnie poniżej minimum',
    category: 'inventory',
    icon: Package,
    channels: { email: true, sms: false, push: true },
  },
  {
    id: 'inventory_out',
    name: 'Brak w magazynie',
    description: 'Alert gdy produkt będzie niedostępny',
    category: 'inventory',
    icon: Package,
    channels: { email: true, sms: true, push: true },
  },
];

const categoryLabels: Record<string, string> = {
  orders: 'Zamówienia',
  quotes: 'Wyceny',
  customers: 'Klienci',
  inventory: 'Magazyn',
};

export default function WorkflowsSettingsPage() {
  const [triggers, setTriggers] = useState(defaultTriggers);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleChannel = (
    triggerId: string,
    channel: 'email' | 'sms' | 'push'
  ) => {
    setTriggers((prev) =>
      prev.map((t) =>
        t.id === triggerId
          ? { ...t, channels: { ...t.channels, [channel]: !t.channels[channel] } }
          : t
      )
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // API call would go here
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const groupedTriggers = triggers.reduce((acc, trigger) => {
    if (!acc[trigger.category]) {
      acc[trigger.category] = [];
    }
    acc[trigger.category].push(trigger);
    return acc;
  }, {} as Record<string, WorkflowTrigger[]>);

  return (
    <>
      <PageHeader
        title="Automatyzacje"
        description="Konfiguruj automatyczne powiadomienia i workflow"
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="glass-button flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Zapisuję...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Zapisano!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Zapisz zmiany
              </>
            )}
          </button>
        }
      />

      {/* Legend */}
      <GlassCard className="mb-6">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-sm text-gray-500">Kanały powiadomień:</span>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-700">Email</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-700">SMS</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-700">Push</span>
          </div>
        </div>
      </GlassCard>

      {/* Triggers by category */}
      <div className="space-y-6">
        {Object.entries(groupedTriggers).map(([category, categoryTriggers]) => (
          <GlassCard key={category}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <GlassCardTitle className="m-0">
                {categoryLabels[category]}
              </GlassCardTitle>
            </div>

            <div className="space-y-4">
              {categoryTriggers.map((trigger) => {
                const TriggerIcon = trigger.icon;
                return (
                  <div
                    key={trigger.id}
                    className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <TriggerIcon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{trigger.name}</p>
                        <p className="text-sm text-gray-500">{trigger.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Email toggle */}
                      <button
                        onClick={() => toggleChannel(trigger.id, 'email')}
                        className={`
                          p-2 rounded-xl transition-all
                          ${trigger.channels.email
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-400'
                          }
                        `}
                        title="Email"
                      >
                        <Mail className="w-5 h-5" />
                      </button>

                      {/* SMS toggle */}
                      <button
                        onClick={() => toggleChannel(trigger.id, 'sms')}
                        className={`
                          p-2 rounded-xl transition-all
                          ${trigger.channels.sms
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                          }
                        `}
                        title="SMS"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>

                      {/* Push toggle */}
                      <button
                        onClick={() => toggleChannel(trigger.id, 'push')}
                        className={`
                          p-2 rounded-xl transition-all
                          ${trigger.channels.push
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-100 text-gray-400'
                          }
                        `}
                        title="Push"
                      >
                        <Bell className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Info card */}
      <GlassCard className="mt-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Jak działają automatyzacje?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Po włączeniu powiadomienia dla danego zdarzenia, system automatycznie
              wyśle wiadomość do odpowiedniego odbiorcy (klienta lub administratora).
              Możesz włączyć wiele kanałów jednocześnie.
            </p>
          </div>
        </div>
      </GlassCard>
    </>
  );
}
