'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Bell,
  BarChart3,
  LogOut,
  Building2,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { name: 'Panel główny', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Klienci', href: '/customers', icon: Users },
  { name: 'Produkty', href: '/products', icon: Package },
  { name: 'Zamówienia', href: '/orders', icon: ShoppingCart, badge: 3 },
  { name: 'Wyceny', href: '/quotes', icon: FileText },
  { name: 'Magazyn', href: '/inventory', icon: Warehouse },
  { name: 'Raporty', href: '/reports', icon: BarChart3 },
];

const bottomNavItems: NavItem[] = [
  { name: 'Powiadomienia', href: '/notifications', icon: Bell, badge: 5 },
  { name: 'Ustawienia', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 h-screen
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/80 border-r border-white/20 shadow-lg" />

      {/* Content */}
      <div className="relative flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-100/50">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-xl text-gray-900">
                DockPulse
              </span>
            )}
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {mainNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200
                      ${active
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900'
                      }
                    `}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 font-medium">{item.name}</span>
                        {item.badge && (
                          <span className={`
                            px-2 py-0.5 text-xs font-semibold rounded-full
                            ${active
                              ? 'bg-white/20 text-white'
                              : 'bg-primary/10 text-primary'
                            }
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-100/50 py-4 px-3">
          <ul className="space-y-1">
            {bottomNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200
                      ${active
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900'
                      }
                    `}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 font-medium">{item.name}</span>
                        {item.badge && (
                          <span className={`
                            px-2 py-0.5 text-xs font-semibold rounded-full
                            ${active
                              ? 'bg-white/20 text-white'
                              : 'bg-red-100 text-red-600'
                            }
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Logout */}
          <button
            className="
              w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-gray-600 hover:bg-red-50 hover:text-red-600
              transition-all duration-200
            "
            title={collapsed ? 'Wyloguj' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Wyloguj</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="
            absolute -right-3 top-20
            w-6 h-6 rounded-full
            bg-white border border-gray-200 shadow-sm
            flex items-center justify-center
            hover:bg-gray-50 transition-colors
          "
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>
    </aside>
  );
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
