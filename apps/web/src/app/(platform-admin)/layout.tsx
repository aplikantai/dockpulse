'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { name: 'Tenants', href: '/admin/tenants', icon: '🏢' },
  { name: 'Modules', href: '/admin/modules', icon: '🧩' },
];

export default function PlatformAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-white border-r border-gray-200 shadow-lg">
          {/* Logo */}
          <div className="mb-8 px-3">
            <h1 className="text-2xl font-bold text-gray-900">DockPulse</h1>
            <p className="text-sm text-gray-500 mt-1">Platform Admin</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname?.includes(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                PA
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Platform Admin
                </p>
                <p className="text-xs text-gray-500 truncate">admin@dockpulse.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 text-gray-600 bg-white rounded-lg shadow-lg lg:hidden"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Main Content */}
      <div className={`transition-all ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-8 py-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Platform Administration
            </h2>
            <p className="text-gray-600 mt-1">
              Manage tenants, modules, and system-wide settings
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
