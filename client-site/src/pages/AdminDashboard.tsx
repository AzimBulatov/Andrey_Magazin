import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : '';

export default function AdminDashboard() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/products`);
      return res.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/categories`);
      return res.data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/orders`);
      return res.data;
    },
  });

  return (
    <div>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        marginBottom: '32px'
      }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '40px' }}>⚙️</span>
          Админ-панель
        </h1>
        <p className="page-subtitle">Управление магазином</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px', 
          padding: '32px',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
          color: 'white',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '12px', fontWeight: '500' }}>Всего товаров</p>
              <p style={{ fontSize: '40px', fontWeight: '700' }}>{products?.length || 0}</p>
            </div>
            <div style={{ fontSize: '56px', opacity: 0.3 }}>📦</div>
          </div>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '20px', 
          padding: '32px',
          boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)',
          color: 'white',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(240, 147, 251, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(240, 147, 251, 0.3)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '12px', fontWeight: '500' }}>Категорий</p>
              <p style={{ fontSize: '40px', fontWeight: '700' }}>{categories?.length || 0}</p>
            </div>
            <div style={{ fontSize: '56px', opacity: 0.3 }}>🏷️</div>
          </div>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '20px', 
          padding: '32px',
          boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)',
          color: 'white',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(79, 172, 254, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(79, 172, 254, 0.3)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '12px', fontWeight: '500' }}>Заказов</p>
              <p style={{ fontSize: '40px', fontWeight: '700' }}>{orders?.length || 0}</p>
            </div>
            <div style={{ fontSize: '56px', opacity: 0.3 }}>🛒</div>
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'white', 
        borderRadius: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '28px 32px', borderBottom: '2px solid #f8f9fa', background: 'linear-gradient(to right, #f8f9fa, white)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#212529', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📦</span>
            Последние товары
          </h2>
        </div>
        <div style={{ padding: '32px' }}>
          {products && products.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {products.slice(0, 5).map((product: any, index: number) => (
                <div key={product.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '20px 0',
                  borderBottom: index < 4 ? '1px solid #f8f9fa' : 'none',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.padding = '20px 16px';
                  e.currentTarget.style.borderRadius = '12px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.padding = '20px 0';
                  e.currentTarget.style.borderRadius = '0';
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {product.image ? (
                      <img
                        src={`${API_URL}/${product.image}`}
                        alt={product.name}
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    ) : (
                      <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        background: '#f8f9fa', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                      }}>
                        📦
                      </div>
                    )}
                    <div>
                      <p style={{ fontWeight: '600', marginBottom: '4px' }}>{product.name}</p>
                      <p style={{ fontSize: '14px', color: '#6c757d' }}>{product.category?.name}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '700', fontSize: '18px', color: '#667eea' }}>{product.price} ₽</p>
                    <p style={{ fontSize: '14px', color: '#6c757d' }}>В наличии: {product.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#6c757d', padding: '40px 0' }}>Товары не найдены</p>
          )}
        </div>
      </div>
    </div>
  );
}
