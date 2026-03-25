import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'http://backend:3000';

export default function AdminUsers() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/users`);
      return res.data;
    },
  });

  if (isLoading) return <div>Загрузка...</div>;

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 className="page-title">Пользователи</h1>
        <p className="page-subtitle">Всего пользователей: {users?.length || 0}</p>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>ID</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Имя</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Фамилия</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Отчество</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Email</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Telegram</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Сумма покупок</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Активные заказы</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>Дата регистрации</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user: any) => (
              <tr key={user.id} style={{ borderTop: '1px solid #e9ecef' }}>
                <td style={{ padding: '16px 24px', fontWeight: '600' }}>#{user.id}</td>
                <td style={{ padding: '16px 24px' }}>{user.firstName || '-'}</td>
                <td style={{ padding: '16px 24px' }}>{user.lastName || '-'}</td>
                <td style={{ padding: '16px 24px' }}>{user.middleName || '-'}</td>
                <td style={{ padding: '16px 24px' }}>{user.email || '-'}</td>
                <td style={{ padding: '16px 24px' }}>
                  {user.username ? (
                    <span style={{ color: '#667eea', fontWeight: '500' }}>@{user.username}</span>
                  ) : (
                    '-'
                  )}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontWeight: '700', color: '#28a745' }}>
                    {user.totalSpent?.toFixed(2) || '0.00'} ₽
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    borderRadius: '12px',
                    background: user.hasActiveOrders ? '#fff3cd' : '#d4edda',
                    color: user.hasActiveOrders ? '#856404' : '#155724',
                    fontWeight: '600'
                  }}>
                    {user.hasActiveOrders ? 'Да' : 'Нет'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', color: '#6c757d', fontSize: '14px' }}>
                  {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!users || users.length === 0) && (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6c757d' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <p>Пользователи не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}
