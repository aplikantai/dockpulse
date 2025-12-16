import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Simplified auth hook for portal (would be separate from panel auth)
// For demo purposes, using mock data
const usePortalAuth = () => ({
  user: { name: 'Client User', email: 'client@example.com' },
  tenantName: 'Demo Company',
  logout: () => { window.location.href = '/portal/login'; },
});

export function PortalLayout() {
  const { t, i18n } = useTranslation();
  const { user, tenantName, logout } = usePortalAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'pl' ? 'en' : 'pl');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{tenantName}</h1>
            <p className="text-sm text-gray-500">{t('portal.title')}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={toggleLanguage}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {i18n.language === 'pl' ? 'EN' : 'PL'}
            </button>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-6">
            <Link
              to="/portal"
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive('/portal')
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('portal.myOrders')}
            </Link>
            <Link
              to="/portal/new"
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive('/portal/new')
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('portal.newOrder')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default PortalLayout;
