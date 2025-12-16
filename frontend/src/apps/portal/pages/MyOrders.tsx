import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '@/shared/api/client';
import { StatusBadge } from '@/shared/ui/StatusBadge';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  notes: string;
  createdAt: string;
}

interface OrdersResponse {
  data: Order[];
}

export function MyOrders() {
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery<OrdersResponse>({
    queryKey: ['portal', 'orders'],
    queryFn: () => api.get('/api/portal/orders'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{t('common.error')}</p>
      </div>
    );
  }

  const orders = data?.data || [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{t('portal.myOrders')}</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('common.noResults')}</p>
          <Link
            to="/portal/new"
            className="inline-block mt-4 text-primary-600 hover:text-primary-700"
          >
            {t('portal.newOrder')} &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/portal/orders/${order.id}`}
              className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {order.notes || '-'}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
