'use client';

import { PageHeader } from '@/components/layout';
import { GlassCard, GlassCardTitle } from '@/components/ui/GlassCard';
import { User, Building2, Bell, Shield, Palette, Database, Brain } from 'lucide-react';
import Link from 'next/link';

const settingsSections = [
  { name: 'Profil', description: 'Zarządzaj swoim kontem i danymi', icon: User, href: '#' },
  { name: 'Firma', description: 'Dane firmy, logo, dane kontaktowe', icon: Building2, href: '#' },
  { name: 'Powiadomienia', description: 'Preferencje powiadomień email i SMS', icon: Bell, href: '#' },
  { name: 'Bezpieczeństwo', description: 'Hasło, 2FA, aktywne sesje', icon: Shield, href: '#' },
  { name: 'Wygląd', description: 'Branding, kolory, logo', icon: Palette, href: '#' },
  { name: 'Ustawienia AI', description: 'Modele AI, asystent, automatyzacja', icon: Brain, href: '/settings/ai' },
  { name: 'Moduły', description: 'Aktywuj/dezaktywuj moduły systemu', icon: Database, href: '/settings/modules' },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Ustawienia"
        description="Konfiguracja systemu i preferencje"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => (
          <Link key={section.name} href={section.href}>
            <GlassCard
              className="cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <section.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{section.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      <GlassCard className="mt-8">
        <GlassCardTitle>Szybkie ustawienia</GlassCardTitle>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Powiadomienia email</p>
              <p className="text-sm text-gray-500">Otrzymuj powiadomienia o nowych zamówieniach</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Powiadomienia SMS</p>
              <p className="text-sm text-gray-500">Otrzymuj SMS przy pilnych zdarzeniach</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Tryb ciemny</p>
              <p className="text-sm text-gray-500">Włącz ciemny motyw interfejsu</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </GlassCard>
    </>
  );
}
