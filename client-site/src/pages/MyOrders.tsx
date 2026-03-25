import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : '';

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
const completedStatuses = ['DELIVERED', 'COMPLETED', 'CANCELLED'];

export default function MyOrders() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/orders`);
      return res.data.filter((order: any) => order.userId === user?.id);
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div>Загрузка...</div>;

  const activeOrders = orders?.filter((order: any) => activeStatuses.includes(order.status)) || [];
  const completedOrders = orders?.filter((order: any) => completedStatuses.includes(order.status)) || [];
  
  const displayOrders = activeTab === 'active' ? activeOrders : completedOrders;

  return (
    <div>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        marginBottom: '24px'
      }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '40px' }}>📦</span>
          Мои заказы
        </h1>
        <p className="page-subtitle">История ваших покупок</p>
      </div>

      {/* Табы */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        background: 'white',
        padding: '8px',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            flex: 1,
            padding: '16px 24px',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s',
            background: activeTab === 'active' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
            color: activeTab === 'active' ? 'white' : '#6c757d'
          }}
        >
          🚀 Активные ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={{
            flex: 1,
            padding: '16px 24px',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s',
            background: activeTab === 'completed' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
            color: activeTab === 'completed' ? 'white' : '#6c757d'
          }}
        >
          ✓ Завершенные ({completedOrders.length})
        </button>
      </div>

      {displayOrders && displayOrders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {displayOrders.map((order: any) => (
            <div key={order.id} style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#667eea', marginBottom: '8px' }}>
                    Заказ #{order.orderNumber || order.id}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>
                    {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <span style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  ...statusColors[order.status]
                }}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '20px' }}>
                {order.items?.map((item: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: index < order.items.length - 1 ? '1px solid #f8f9fa' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {item.product?.name || 'Товар'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {item.quantity} шт. × {item.price} ₽
                      </div>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '16px' }}>
                      {(item.quantity * item.price).toFixed(2)} ₽
                    </div>
                  </div>
                ))}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '2px solid #e9ecef'
                }}>
                  <span style={{ fontSize: '18px', fontWeight: '700' }}>Итого:</span>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#667eea' }}>
                    {order.totalAmount} ₽
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{
          background: 'white',
          borderRadius: '20px',
          padding: '80px 40px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
        }}>
          <div className="empty-icon" style={{ fontSize: '100px', marginBottom: '24px' }}>
            {activeTab === 'active' ? '🚀' : '✓'}
          </div>
          <h2 style={{ fontSize: '32px', marginBottom: '16px', color: '#212529' }}>
            {activeTab === 'active' ? 'Нет активных заказов' : 'Нет завершенных заказов'}
          </h2>
          <p style={{ fontSize: '18px', color: '#6c757d', marginBottom: '32px' }}>
            {activeTab === 'active' 
              ? 'Начните покупки в нашем каталоге' 
              : 'Здесь будут отображаться доставленные и отмененные заказы'}
          </p>
          {activeTab === 'active' && (
            <a href="/" className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '16px', textDecoration: 'none' }}>
              Перейти в каталог
            </a>
          )}
        </div>
      )}
    </div>
  );
}
