import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтвержден',
  PROCESSING: 'В обработке',
  SHIPPED: 'Отправлен',
  DELIVERED: 'Доставлен',
  COMPLETED: 'Выполнен',
  CANCELLED: 'Отменен',
};

const statusColors: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: '#fff3cd', color: '#856404' },
  CONFIRMED: { bg: '#d1ecf1', color: '#0c5460' },
  PROCESSING: { bg: '#cce5ff', color: '#004085' },
  SHIPPED: { bg: '#d4edda', color: '#155724' },
  DELIVERED: { bg: '#d4edda', color: '#155724' },
  COMPLETED: { bg: '#d4edda', color: '#155724' },
  CANCELLED: { bg: '#f8d7da', color: '#721c24' },
};

const activeStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'];

export default function Orders() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await api.patch(`/orders/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowModal(false);
    },
  });

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleStatusChange = (status: string) => {
    if (selectedOrder) {
      updateStatusMutation.mutate({ id: selectedOrder.id, status });
    }
  };

  if (isLoading) return <div className="p-8">Загрузка...</div>;

  const activeOrders = orders?.filter((order: any) => activeStatuses.includes(order.status)) || [];
  const displayOrders = activeTab === 'active' ? activeOrders : orders || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Заказы</h1>
        <p className="text-gray-500">
          {activeTab === 'active' 
            ? `Активных заказов: ${activeOrders.length}` 
            : `Всего заказов: ${orders?.length || 0}`}
        </p>
      </div>

      {/* Табы */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🚀 Активные ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📦 Все заказы ({orders?.length || 0})
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Номер
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Клиент
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Сумма
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Дата
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayOrders.map((order: any) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-blue-600">
                    #{order.orderNumber || order.id}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">
                    {order.user?.firstName} {order.user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{order.user?.email}</div>
                </td>
                <td className="px-6 py-4 font-semibold">{order.totalAmount} ₽</td>
                <td className="px-6 py-4">
                  <span
                    className="px-3 py-1 text-xs rounded-full font-semibold"
                    style={{
                      backgroundColor: statusColors[order.status]?.bg,
                      color: statusColors[order.status]?.color,
                    }}
                  >
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewOrder(order)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Подробнее
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {displayOrders.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-lg">
              {activeTab === 'active' ? 'Нет активных заказов' : 'Заказы не найдены'}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6">
              Заказ #{selectedOrder.orderNumber || selectedOrder.id}
            </h2>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Информация о клиенте
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p>
                  <strong>Имя:</strong> {selectedOrder.user?.firstName}{' '}
                  {selectedOrder.user?.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedOrder.user?.email || '-'}
                </p>
                <p>
                  <strong>Телефон:</strong>{' '}
                  {selectedOrder.phone || selectedOrder.user?.phone || '-'}
                </p>
                <p>
                  <strong>Адрес доставки:</strong>{' '}
                  {selectedOrder.deliveryAddress || '-'}
                </p>
                <p>
                  <strong>Способ оплаты:</strong> {selectedOrder.paymentMethod || '-'}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Товары в заказе
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {selectedOrder.items?.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between py-3 border-b border-gray-200 last:border-0"
                  >
                    <div>
                      <p className="font-semibold">{item.product?.name || 'Товар'}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} шт. × {item.price} ₽
                      </p>
                    </div>
                    <div className="font-bold">
                      {(item.quantity * item.price).toFixed(2)} ₽
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-4 mt-4 border-t-2 border-gray-300">
                  <span className="text-lg font-bold">Итого:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {selectedOrder.totalAmount} ₽
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Изменить статус
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className="px-4 py-2 rounded-lg font-semibold text-sm transition"
                    style={{
                      backgroundColor: statusColors[status]?.bg,
                      color: statusColors[status]?.color,
                      opacity: selectedOrder.status === status ? 1 : 0.6,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-semibold"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
