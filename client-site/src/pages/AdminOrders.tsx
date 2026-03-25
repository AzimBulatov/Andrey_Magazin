import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'http://backend:3000';

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

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/orders`);
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await axios.patch(`${API_URL}/orders/${id}/status`, { status });
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

  if (isLoading) return <div>Загрузка...</div>;

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 className="page-title">Заказы</h1>
        <p className="page-subtitle">Всего заказов: {orders?.length || 0}</p>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Номер заказа</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Имя</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Фамилия</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Сумма</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Статус</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Дата</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order: any) => (
              <tr key={order.id} style={{ borderTop: '1px solid #e9ecef' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: '700', color: '#667eea', fontSize: '16px' }}>
                    #{order.orderNumber || order.id}
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>{order.user?.firstName || '-'}</td>
                <td style={{ padding: '16px 24px' }}>{order.user?.lastName || '-'}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontWeight: '700', fontSize: '16px' }}>
                    {order.totalAmount} ₽
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    ...statusColors[order.status]
                  }}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', color: '#6c757d', fontSize: '14px' }}>
                  {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <button
                    onClick={() => handleViewOrder(order)}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    Подробнее
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!orders || orders.length === 0) && (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6c757d' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <p>Заказы не найдены</p>
          </div>
        )}
      </div>

      {showModal && selectedOrder && (
        <div 
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '700px' }}
          >
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
              Заказ #{selectedOrder.orderNumber || selectedOrder.id}
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#6c757d' }}>
                Информация о клиенте
              </h3>
              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px' }}>
                <p style={{ marginBottom: '8px' }}>
                  <strong>Имя:</strong> {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
                </p>
                <p style={{ marginBottom: '8px' }}>
                  <strong>Email:</strong> {selectedOrder.user?.email || '-'}
                </p>
                <p style={{ marginBottom: '8px' }}>
                  <strong>Телефон:</strong> {selectedOrder.phone || selectedOrder.user?.phone || '-'}
                </p>
                <p>
                  <strong>Адрес доставки:</strong> {selectedOrder.deliveryAddress || '-'}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#6c757d' }}>
                Товары в заказе
              </h3>
              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px' }}>
                {selectedOrder.items?.map((item: any, index: number) => (
                  <div 
                    key={index}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: index < selectedOrder.items.length - 1 ? '1px solid #dee2e6' : 'none'
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {item.product?.name || 'Товар'}
                      </p>
                      <p style={{ fontSize: '14px', color: '#6c757d' }}>
                        {item.quantity} шт. × {item.price} ₽
                      </p>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '16px' }}>
                      {(item.quantity * item.price).toFixed(2)} ₽
                    </div>
                  </div>
                ))}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '2px solid #dee2e6'
                }}>
                  <span style={{ fontSize: '18px', fontWeight: '700' }}>Итого:</span>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#667eea' }}>
                    {selectedOrder.totalAmount} ₽
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#6c757d' }}>
                Изменить статус
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {Object.entries(statusLabels).map(([status, label]) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    style={{
                      padding: '10px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      ...statusColors[status],
                      opacity: selectedOrder.status === status ? 1 : 0.6
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
