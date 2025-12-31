'use client';

import { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  HelpCircle,
} from 'lucide-react';

interface NavbarProps {
  sidebarCollapsed?: boolean;
}

export function Navbar({ sidebarCollapsed = false }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Mock user data - will be replaced with real data
  const user = {
    name: 'Jan Kowalski',
    email: 'jan@firma.pl',
    role: 'Administrator',
    avatar: null,
  };

  // Mock notifications
  const notifications = [
    { id: 1, title: 'Nowe zamówienie #2137', time: '5 min temu', unread: true },
    { id: 2, title: 'Klient zaakceptował wycenę', time: '1 godz. temu', unread: true },
    { id: 3, title: 'Produkt "Widget XL" na wyczerpaniu', time: '3 godz. temu', unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header
      className={`
        fixed top-0 right-0 z-30 h-16
        transition-all duration-300
        ${sidebarCollapsed ? 'left-20' : 'left-64'}
      `}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm" />

      {/* Content */}
      <div className="relative flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj klientów, zamówień, produktów..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-xl
                bg-gray-100/50 border border-transparent
                focus:bg-white focus:border-primary/20 focus:ring-2 focus:ring-primary/10
                transition-all duration-200 outline-none
                text-gray-900 placeholder-gray-400
              "
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-gray-400 bg-gray-200/50 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-6">
          {/* Theme toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="
              p-2.5 rounded-xl
              text-gray-600 hover:bg-gray-100/50 hover:text-gray-900
              transition-all duration-200
            "
            title={darkMode ? 'Tryb jasny' : 'Tryb ciemny'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Help */}
          <button
            className="
              p-2.5 rounded-xl
              text-gray-600 hover:bg-gray-100/50 hover:text-gray-900
              transition-all duration-200
            "
            title="Pomoc"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="
                relative p-2.5 rounded-xl
                text-gray-600 hover:bg-gray-100/50 hover:text-gray-900
                transition-all duration-200
              "
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="
                  absolute right-0 top-full mt-2 w-80 z-50
                  backdrop-blur-xl bg-white/95 rounded-2xl
                  border border-gray-100 shadow-xl
                  overflow-hidden
                ">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Powiadomienia</h3>
                    <button className="text-sm text-primary hover:text-primary-600">
                      Oznacz jako przeczytane
                    </button>
                  </div>
                  <ul className="max-h-80 overflow-y-auto">
                    {notifications.map((notif) => (
                      <li
                        key={notif.id}
                        className={`
                          px-4 py-3 hover:bg-gray-50 cursor-pointer
                          ${notif.unread ? 'bg-primary/5' : ''}
                        `}
                      >
                        <p className="text-sm text-gray-900 font-medium">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {notif.time}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-3 border-t border-gray-100 text-center">
                    <button className="text-sm text-primary hover:text-primary-600 font-medium">
                      Zobacz wszystkie
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User menu */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="
                flex items-center gap-3 py-1.5 pl-1.5 pr-3 rounded-xl
                hover:bg-gray-100/50 transition-all duration-200
              "
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-semibold shadow-md shadow-primary/20">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  user.name.split(' ').map((n) => n[0]).join('')
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="
                  absolute right-0 top-full mt-2 w-56 z-50
                  backdrop-blur-xl bg-white/95 rounded-2xl
                  border border-gray-100 shadow-xl
                  overflow-hidden
                ">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <ul className="py-2">
                    <li>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                        <User className="w-4 h-4" />
                        Mój profil
                      </button>
                    </li>
                    <li>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                        <Settings className="w-4 h-4" />
                        Ustawienia
                      </button>
                    </li>
                  </ul>
                  <div className="border-t border-gray-100 py-2">
                    <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                      <LogOut className="w-4 h-4" />
                      Wyloguj się
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
