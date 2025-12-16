import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { Card, CardTitle } from '@/shared/ui/Card';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { Link } from 'react-router-dom';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  clientName: string;
  createdAt: string;
}

interface OrdersResponse {
  data: Order[];
  pagination: {
    total: number;
  };
}

export function Dashboard() {
  const { t } = useTranslation();

  const { data: ordersData } = useQuery<OrdersResponse>({
    queryKey: ['orders', 'recent'],
    queryFn: () => api.get('/api/orders?limit=5'),
  });

  const recentOrders = ordersData?.data || [];
  const totalOrders = ordersData?.pagination?.total || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.dashboard')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-500">{t('order.title')}</p>
          <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t('order.status.NEW')}</p>
          <p className="text-3xl font-bold text-blue-600">
            {recentOrders.filter((o) => o.status === 'NEW').length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t('order.status.IN_PROGRESS')}</p>
          <p className="text-3xl font-bold text-yellow-600">
            {recentOrders.filter((o) => o.status === 'IN_PROGRESS').length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t('order.status.COMPLETED')}</p>
          <p className="text-3xl font-bold text-green-600">
            {recentOrders.filter((o) => o.status === 'COMPLETED').length}
          </p>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>{t('order.title')}</CardTitle>
          <Link
            to="/orders"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {t('common.actions')} &rarr;
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('common.noResults')}</p>
        ) : (
          <div className="divide-y">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.clientName || '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default Dashboard;
