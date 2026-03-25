import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'http://backend:3000';

interface Transaction {
  id: number;
  amount: number;
  type: string;
  status: string;
  description: string;
  paymentMethod: string;
  createdAt: string;
}

interface Wallet {
  balance: number;
  totalDeposited: number;
  totalSpent: number;
}

export default function Finance() {
  const { user, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'methods'>('overview');
  
  // Модальные окна
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'card' | 'sbp'>('card');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Проверяем, вернулись ли мы после оплаты
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      
      if (paymentStatus === 'success') {
        // Очищаем URL СРАЗУ, чтобы не вызывать повторно
        window.history.replaceState({}, '', '/finance');
        
        // Проверяем статус последнего платежа ОДИН раз
        checkLastPayment();
      } else {
        loadWalletData();
        loadTransactions();
      }
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const checkLastPayment = async () => {
    try {
      // Проверяем последний платеж
      await axios.get(`${API_URL}/payments/last-payment/${user?.id}`);
      
      // Обновляем данные
      await loadWalletData();
      await loadTransactions();
      
      // Показываем уведомление
      alert('✅ Платеж успешно обработан! Баланс пополнен.');
    } catch (error) {
      console.error('Error checking payment:', error);
      loadWalletData();
      loadTransactions();
    }
  };

  const loadWalletData = async () => {
    try {
      const res = await axios.get(`${API_URL}/payments/wallet/${user?.id}`);
      setWallet(res.data);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await axios.get(`${API_URL}/payments/transactions/${user?.id}`);
      setTransactions(res.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    
    if (!amount || amount <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    if (amount < 10) {
      alert('Минимальная сумма пополнения: 10 ₽');
      return;
    }

    setProcessing(true);

    try {
      const res = await axios.post(`${API_URL}/payments/deposit`, {
        userId: user?.id,
        amount,
        paymentMethod: depositMethod,
      });

      // Если есть URL для перенаправления
      if (res.data.confirmationUrl) {
        window.location.href = res.data.confirmationUrl;
      } else {
        // Баланс уже пополнен
        alert(res.data.message || 'Баланс успешно пополнен!');
        setShowDepositModal(false);
        setDepositAmount('');
        setProcessing(false);
        // Обновляем данные
        await loadWalletData();
        await loadTransactions();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка создания платежа');
      setProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="empty-state">
        <div className="empty-icon">💰</div>
        <h2>Войдите в систему</h2>
        <p>Чтобы просматривать финансовую информацию, необходимо войти в систему</p>
        <Link to="/profile" className="btn btn-primary">
          Войти
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div style={{ fontSize: '18px', color: '#6c757d' }}>Загрузка...</div>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return '💰';
      case 'PAYMENT': return '🛒';
      case 'REFUND': return '↩️';
      case 'WITHDRAWAL': return '💸';
      default: return '💳';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'Пополнение';
      case 'PAYMENT': return 'Оплата';
      case 'REFUND': return 'Возврат';
      case 'WITHDRAWAL': return 'Вывод';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Ожидает', className: 'status-pending' },
      COMPLETED: { label: 'Завершено', className: 'status-paid' },
      FAILED: { label: 'Ошибка', className: 'status-failed' },
      CANCELLED: { label: 'Отменено', className: 'status-refunded' },
    };
    const info = statusMap[status] || { label: status, className: '' };
    return <span className={`status-badge ${info.className}`}>{info.label}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">💰 Финансы</h1>
      </div>

      {/* Tabs */}
      <div className="finance-tabs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`finance-tab ${activeTab === 'overview' ? 'active' : ''}`}
        >
          📊 Обзор
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`finance-tab ${activeTab === 'history' ? 'active' : ''}`}
        >
          📜 История транзакций
        </button>
        <button
          onClick={() => setActiveTab('methods')}
          className={`finance-tab ${activeTab === 'methods' ? 'active' : ''}`}
        >
          💳 Пополнение баланса
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="finance-content">
          <div className="finance-stats">
            <div className="stat-card stat-primary">
              <div className="stat-icon">💵</div>
              <div className="stat-info">
                <div className="stat-label">Баланс кошелька</div>
                <div className="stat-value">{wallet?.balance.toLocaleString('ru-RU') || 0} ₽</div>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">📥</div>
              <div className="stat-info">
                <div className="stat-label">Всего пополнено</div>
                <div className="stat-value">{wallet?.totalDeposited.toLocaleString('ru-RU') || 0} ₽</div>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">📤</div>
              <div className="stat-info">
                <div className="stat-label">Всего потрачено</div>
                <div className="stat-value">{wallet?.totalSpent.toLocaleString('ru-RU') || 0} ₽</div>
              </div>
            </div>

            <div className="stat-card stat-info">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-label">Транзакций</div>
                <div className="stat-value">{transactions.length}</div>
              </div>
            </div>
          </div>

          <div className="finance-actions" style={{ marginBottom: '32px' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowDepositModal(true)}
              style={{ padding: '16px 32px', fontSize: '16px' }}
            >
              💰 Пополнить баланс
            </button>
          </div>

          <div className="finance-section">
            <h3>Последние транзакции</h3>
            {transactions.length > 0 ? (
              <div className="transactions-list">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="transaction-card">
                    <div className="transaction-icon">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-title">
                        {getTransactionLabel(transaction.type)}
                      </div>
                      <div className="transaction-date">
                        {new Date(transaction.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {transaction.description && (
                        <div className="transaction-description">{transaction.description}</div>
                      )}
                    </div>
                    <div className="transaction-status">
                      {getStatusBadge(transaction.status)}
                    </div>
                    <div className={`transaction-amount ${transaction.type === 'DEPOSIT' || transaction.type === 'REFUND' ? 'positive' : 'negative'}`}>
                      {transaction.type === 'DEPOSIT' || transaction.type === 'REFUND' ? '+' : '-'}
                      {Number(transaction.amount).toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-transactions">
                <p>Пока нет транзакций</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="finance-content">
          <div className="finance-section">
            <h3>История всех транзакций</h3>
            {transactions.length > 0 ? (
              <div className="history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Тип</th>
                      <th>Описание</th>
                      <th>Статус</th>
                      <th>Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          {new Date(transaction.createdAt).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getTransactionIcon(transaction.type)}
                            {getTransactionLabel(transaction.type)}
                          </span>
                        </td>
                        <td>{transaction.description || '-'}</td>
                        <td>{getStatusBadge(transaction.status)}</td>
                        <td className={`amount-cell ${transaction.type === 'DEPOSIT' || transaction.type === 'REFUND' ? 'positive' : 'negative'}`}>
                          {transaction.type === 'DEPOSIT' || transaction.type === 'REFUND' ? '+' : '-'}
                          {Number(transaction.amount).toLocaleString('ru-RU')} ₽
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-transactions">
                <div className="empty-icon">📜</div>
                <p>История транзакций пуста</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'methods' && (
        <div className="finance-content">
          <div className="finance-section">
            <h3>Пополнение баланса</h3>
            <p style={{ color: '#6c757d', marginBottom: '32px' }}>
              Выберите удобный способ пополнения вашего кошелька
            </p>

            <div className="payment-methods">
              <div className="payment-method-card" onClick={() => { setDepositMethod('card'); setShowDepositModal(true); }}>
                <div className="payment-method-icon">💳</div>
                <div className="payment-method-info">
                  <h4>Банковская карта</h4>
                  <p>Visa, Mastercard, МИР</p>
                  <p style={{ fontSize: '12px', color: '#22c55e', marginTop: '8px' }}>✓ Мгновенное зачисление</p>
                </div>
                <button className="btn btn-primary">Пополнить</button>
              </div>

              <div className="payment-method-card disabled">
                <div className="payment-method-icon">📱</div>
                <div className="payment-method-info">
                  <h4>СБП</h4>
                  <p>Система быстрых платежей</p>
                  <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>⏱ Скоро</p>
                </div>
                <button className="btn btn-secondary" disabled>Скоро</button>
              </div>

              <div className="payment-method-card disabled">
                <div className="payment-method-icon">🏦</div>
                <div className="payment-method-info">
                  <h4>Банковский перевод</h4>
                  <p>Перевод на расчетный счет</p>
                  <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>⏱ 1-3 рабочих дня</p>
                </div>
                <button className="btn btn-secondary" disabled>Скоро</button>
              </div>
            </div>

            <div className="payment-info-box">
              <h4>🔒 Безопасность платежей</h4>
              <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                <li>Все платежи защищены протоколом SSL/TLS</li>
                <li>Мы не храним данные ваших банковских карт</li>
                <li>Платежи обрабатываются через защищенный шлюз</li>
                <li>Возврат средств в течение 24 часов</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '24px' }}>💰 Пополнение баланса</h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Способ оплаты
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setDepositMethod('card')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    border: depositMethod === 'card' ? '3px solid #667eea' : '2px solid #e9ecef',
                    borderRadius: '12px',
                    background: depositMethod === 'card' ? '#f8f9ff' : 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  💳 Карта
                </button>
                <button
                  onClick={() => setDepositMethod('sbp')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    border: depositMethod === 'sbp' ? '3px solid #667eea' : '2px solid #e9ecef',
                    borderRadius: '12px',
                    background: depositMethod === 'sbp' ? '#f8f9ff' : 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  📱 СБП
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Сумма пополнения (₽)
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Минимум 10 ₽"
                min="10"
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '16px',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {[100, 500, 1000, 5000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(String(amount))}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {amount} ₽
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>К пополнению:</span>
                <span style={{ fontWeight: '700', fontSize: '18px' }}>
                  {depositAmount || '0'} ₽
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Комиссия: 0 ₽
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDeposit}
                disabled={processing || !depositAmount}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {processing ? 'Обработка...' : 'Пополнить'}
              </button>
              <button
                onClick={() => setShowDepositModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
