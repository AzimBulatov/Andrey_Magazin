import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'http://backend:3000';

interface CheckoutItem {
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { cart } = useCart();
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [paymentTiming, setPaymentTiming] = useState<'now' | 'on_delivery'>('now');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card' | 'sbp'>('card');
  const [loading, setLoading] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/profile');
      return;
    }

    // Получаем выбранные товары из state или все товары из корзины
    const selectedItems = location.state?.selectedItems || cart;
    setCheckoutItems(selectedItems);

    // Загружаем адреса пользователя
    loadAddresses();
    // Загружаем баланс кошелька
    loadWalletBalance();
  }, [isAuthenticated, location.state, cart]);

  const loadWalletBalance = async () => {
    try {
      const res = await axios.get(`${API_URL}/payments/wallet/${user?.id}`);
      setWalletBalance(res.data.balance);
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    }
  };

  const loadAddresses = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/${user?.id}`);
      const userData = res.data;
      setAddresses(userData.addresses || []);
      
      // Автоматически выбираем первый адрес
      if (userData.addresses && userData.addresses.length > 0) {
        setSelectedAddress(userData.addresses[0].id);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const calculateTotal = () => {
    return checkoutItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Пожалуйста, выберите адрес доставки');
      return;
    }

    const totalAmount = calculateTotal();

    // Проверяем баланс, если выбрана оплата через кошелек
    if (paymentMethod === 'wallet' && paymentTiming === 'now') {
      if (walletBalance < totalAmount) {
        alert(`Недостаточно средств на балансе. Ваш баланс: ${walletBalance.toLocaleString('ru-RU')} ₽, требуется: ${totalAmount.toLocaleString('ru-RU')} ₽`);
        return;
      }
    }

    setLoading(true);

    try {
      const orderData = {
        userId: user?.id,
        items: checkoutItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalAmount,
        deliveryAddress: addresses.find(a => a.id === selectedAddress)?.fullAddress,
        paymentMethod: paymentMethod === 'wallet' ? 'Кошелек' : paymentMethod === 'card' ? 'Карта' : 'СБП',
        paymentTiming: paymentTiming,
        phone: user?.phone || '',
      };

      const orderRes = await axios.post(`${API_URL}/orders`, orderData);
      const orderId = orderRes.data.id;

      // Если выбрана оплата через кошелек и оплата сейчас - списываем деньги
      if (paymentMethod === 'wallet' && paymentTiming === 'now') {
        try {
          await axios.post(`${API_URL}/payments/pay-order`, {
            userId: user?.id,
            orderId: orderId,
            amount: totalAmount,
          });
        } catch (paymentError: any) {
          alert('Ошибка при оплате: ' + (paymentError.response?.data?.message || 'Неизвестная ошибка'));
          setLoading(false);
          return;
        }
      }
      
      // Удаляем из корзины только оформленные товары
      for (const item of checkoutItems) {
        try {
          await axios.delete(`${API_URL}/cart/${user?.id}/remove/${item.productId}`);
        } catch (err) {
          console.error('Error removing item from cart:', err);
        }
      }

      alert(paymentMethod === 'wallet' && paymentTiming === 'now' 
        ? 'Заказ успешно оформлен и оплачен!' 
        : 'Заказ успешно оформлен!');
      navigate('/orders');
    } catch (error: any) {
      console.error('Error placing order:', error);
      alert(error.response?.data?.message || 'Ошибка при оформлении заказа');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="empty-state" style={{
        background: 'white',
        borderRadius: '20px',
        padding: '80px 40px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
      }}>
        <div className="empty-icon" style={{ fontSize: '100px', marginBottom: '24px' }}>🛒</div>
        <h2 style={{ fontSize: '32px', marginBottom: '16px', color: '#212529' }}>Нет товаров для оформления</h2>
        <p style={{ fontSize: '18px', color: '#6c757d', marginBottom: '32px' }}>
          Вернитесь в корзину и выберите товары
        </p>
        <button onClick={() => navigate('/cart')} className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '16px' }}>
          Вернуться в корзину
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Заголовок */}
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        marginBottom: '24px'
      }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '40px' }}>📦</span>
          Оформление заказа
        </h1>
        <p className="page-subtitle">Проверьте данные и подтвердите заказ</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* Левая колонка - форма */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Адрес доставки */}
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>📍</span>
              Адрес доставки
            </h2>

            {addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ color: '#6c757d', marginBottom: '20px' }}>У вас нет сохраненных адресов</p>
                <button 
                  onClick={() => navigate('/profile')}
                  className="btn btn-secondary"
                >
                  Добавить адрес в профиле
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    style={{
                      display: 'flex',
                      alignItems: 'start',
                      gap: '16px',
                      padding: '20px',
                      border: selectedAddress === address.id ? '3px solid #667eea' : '2px solid #e9ecef',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      background: selectedAddress === address.id ? '#f8f9ff' : 'white'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedAddress !== address.id) {
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.background = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAddress !== address.id) {
                        e.currentTarget.style.borderColor = '#e9ecef';
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress === address.id}
                      onChange={() => setSelectedAddress(address.id)}
                      style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer', accentColor: '#667eea' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px', color: '#212529' }}>
                        {address.title || 'Адрес'}
                      </div>
                      <div style={{ color: '#495057', fontSize: '15px', lineHeight: '1.6' }}>
                        {address.fullAddress}
                      </div>
                      {(address.apartment || address.entrance || address.floor) && (
                        <div style={{ color: '#6c757d', fontSize: '14px', marginTop: '8px' }}>
                          {address.apartment && `Кв. ${address.apartment}`}
                          {address.entrance && ` • Подъезд ${address.entrance}`}
                          {address.floor && ` • Этаж ${address.floor}`}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Способ оплаты */}
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>💳</span>
              Как оплатите заказ?
            </h2>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <button
                onClick={() => setPaymentTiming('now')}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  border: paymentTiming === 'now' ? '3px solid #667eea' : '2px solid #e9ecef',
                  borderRadius: '16px',
                  background: paymentTiming === 'now' ? '#f8f9ff' : 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  transition: 'all 0.3s',
                  color: paymentTiming === 'now' ? '#667eea' : '#495057'
                }}
              >
                Оплатить сейчас
              </button>
              <button
                onClick={() => setPaymentTiming('on_delivery')}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  border: paymentTiming === 'on_delivery' ? '3px solid #667eea' : '2px solid #e9ecef',
                  borderRadius: '16px',
                  background: paymentTiming === 'on_delivery' ? '#f8f9ff' : 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  transition: 'all 0.3s',
                  color: paymentTiming === 'on_delivery' ? '#667eea' : '#495057'
                }}
              >
                При получении
              </button>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#212529' }}>
              Способ оплаты
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  border: paymentMethod === 'wallet' ? '3px solid #667eea' : '2px solid #e9ecef',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: paymentMethod === 'wallet' ? '#f8f9ff' : 'white'
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'wallet'}
                  onChange={() => setPaymentMethod('wallet')}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#667eea' }}
                />
                <div style={{ fontSize: '28px' }}>💰</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: '#212529' }}>Кошелек платформы</div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>
                    Баланс: {walletBalance.toLocaleString('ru-RU')} ₽
                  </div>
                  {paymentMethod === 'wallet' && walletBalance < calculateTotal() && (
                    <div style={{ fontSize: '13px', color: '#dc3545', marginTop: '4px' }}>
                      ⚠️ Недостаточно средств. Пополните баланс в разделе "Финансы"
                    </div>
                  )}
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  border: '2px solid #e9ecef',
                  borderRadius: '16px',
                  cursor: 'not-allowed',
                  transition: 'all 0.3s',
                  background: '#f8f9fa',
                  opacity: 0.6
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  disabled
                  style={{ width: '20px', height: '20px', cursor: 'not-allowed' }}
                />
                <div style={{ fontSize: '28px' }}>💳</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: '#6c757d' }}>Банковская карта</div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>Скоро</div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  border: '2px solid #e9ecef',
                  borderRadius: '16px',
                  cursor: 'not-allowed',
                  transition: 'all 0.3s',
                  background: '#f8f9fa',
                  opacity: 0.6
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  disabled
                  style={{ width: '20px', height: '20px', cursor: 'not-allowed' }}
                />
                <div style={{ fontSize: '28px' }}>📱</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: '#6c757d' }}>СБП</div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>Скоро</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Правая колонка - итоги */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🛍️</span>
              Ваш заказ
            </h2>

            <div style={{ marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
              {checkoutItems.map((item) => (
                <div key={item.productId} style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #f8f9fa'
                }}>
                  {item.product.image ? (
                    <img
                      src={`${API_URL}/${item.product.image}`}
                      alt={item.product.name}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px' }}
                    />
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}>
                      📦
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      {item.quantity} шт. × {item.product.price} ₽
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#667eea', marginTop: '4px' }}>
                      {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              padding: '24px 0',
              borderTop: '2px solid #e9ecef',
              borderBottom: '2px solid #e9ecef',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', color: '#6c757d' }}>Товары ({checkoutItems.length})</span>
                <span style={{ fontSize: '16px', fontWeight: '600' }}>{calculateTotal().toLocaleString('ru-RU')} ₽</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', color: '#6c757d' }}>Доставка</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#22c55e' }}>Бесплатно</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <span style={{ fontSize: '20px', fontWeight: '700' }}>Итого:</span>
              <span style={{ fontSize: '28px', fontWeight: '700', color: '#667eea' }}>
                {calculateTotal().toLocaleString('ru-RU')} ₽
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading || !selectedAddress}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '20px',
                fontSize: '18px',
                fontWeight: '700',
                borderRadius: '16px'
              }}
            >
              {loading ? 'Оформление...' : '✓ Заказать'}
            </button>

            <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#22c55e', fontSize: '18px' }}>✓</span>
                <span style={{ fontSize: '14px', color: '#495057', fontWeight: '500' }}>Безопасная оплата</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#22c55e', fontSize: '18px' }}>✓</span>
                <span style={{ fontSize: '14px', color: '#495057', fontWeight: '500' }}>Гарантия возврата</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
