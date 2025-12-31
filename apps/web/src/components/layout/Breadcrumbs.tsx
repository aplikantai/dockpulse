'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

// Route name mappings
const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Klienci',
  products: 'Produkty',
  orders: 'Zamówienia',
  quotes: 'Wyceny',
  inventory: 'Magazyn',
  reports: 'Raporty',
  notifications: 'Powiadomienia',
  settings: 'Ustawienia',
  new: 'Nowy',
  edit: 'Edycja',
};

interface BreadcrumbItem {
  label: string;
  href: string;
  current: boolean;
}

export function Breadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;

      // Try to get a friendly name, otherwise capitalize
      let label = routeNames[path.toLowerCase()];

      // If it's a UUID or ID, try to get context from previous path
      if (!label && /^[0-9a-f-]{36}$/i.test(path)) {
        const previousPath = paths[index - 1];
        if (previousPath) {
          const singular = previousPath.replace(/s$/, '');
          label = `${routeNames[singular] || singular.charAt(0).toUpperCase() + singular.slice(1)} #${path.slice(0, 8)}`;
        } else {
          label = `#${path.slice(0, 8)}`;
        }
      }

      if (!label) {
        label = path.charAt(0).toUpperCase() + path.slice(1);
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        current: index === paths.length - 1,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't render if we're on the home page or just dashboard
  if (pathname === '/' || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center text-sm mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1">
        {/* Home link */}
        <li>
          <Link
            href="/dashboard"
            className="
              flex items-center gap-1 px-2 py-1 rounded-lg
              text-gray-500 hover:text-gray-700 hover:bg-gray-100/50
              transition-all duration-200
            "
          >
            <Home className="w-4 h-4" />
            <span className="sr-only">Strona główna</span>
          </Link>
        </li>

        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
            {item.current ? (
              <span
                className="px-2 py-1 rounded-lg text-gray-900 font-medium bg-gray-100/50"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="
                  px-2 py-1 rounded-lg
                  text-gray-500 hover:text-gray-700 hover:bg-gray-100/50
                  transition-all duration-200
                "
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-gray-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
