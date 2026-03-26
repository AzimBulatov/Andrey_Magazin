import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : '';

export default function Profile() {
  const { user, login, register, logout, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authFormData, setAuthFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Profile editing
  const [activeTab, setActiveTab] = useState<'personal' | 'addresses' | 'notifications' | 'security'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    birthDate: '',
    gender: '',
    bio: '',
  });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressForm, setAddressForm] = useState({
    title: '',
    fullAddress: '',
    city: '',
    street: '',
    house: '',
    apartment: '',
    entrance: '',
    floor: '',
    intercom: '',
    comment: '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    orderUpdates: true,
    promotions: false,
    newsletter: false,
  });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
      loadUserStats();
    }
  }, [isAuthenticated, user]);

  const loadUserData = async () => {
    try {
      // Если это админ, загружаем данные из admins
      if (user?.role === 'admin') {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const userData = res.data;
        setProfileData({
          firstName: userData.name || userData.email?.split('@')[0] || '',
          lastName: '',
          middleName: '',
          phone: '',
          birthDate: '',
          gender: '',
          bio: '',
        });
        setAddresses([]);
      } else {
        // Для обычных пользователей загружаем из users
        const res = await axios.get(`${API_URL}/users/${user?.id}`);
        const userData = res.data;
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          middleName: userData.middleName || '',
          phone: userData.phone || '',
          birthDate: userData.birthDate ? userData.birthDate.split('T')[0] : '',
          gender: userData.gender || '',
          bio: userData.bio || '',
        });
        setAddresses(userData.addresses || []);
        setNotifications(userData.notificationSettings || notifications);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const loadUserStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/${user?.id}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(authFormData.email, authFormData.password);
      } else {
        await register(authFormData.email, authFormData.password, authFormData.firstName, authFormData.lastName);
      }
      setShowAuthModal(false);
      setAuthFormData({ email: '', password: '', firstName: '', lastName: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await axios.patch(`${API_URL}/users/${user?.id}/profile`, profileData);
      setIsEditing(false);
      alert('Профиль успешно обновлен');
      await loadUserData();
    } catch (err) {
      alert('Ошибка при сохранении профиля');
    }
  };

  const handleSaveAddress = async () => {
    try {
      if (editingAddress) {
        await axios.patch(`${API_URL}/users/${user?.id}/addresses/${editingAddress.id}`, addressForm);
      } else {
        await axios.post(`${API_URL}/users/${user?.id}/addresses`, addressForm);
      }
      await loadUserData();
      setShowAddressModal(false);
      setEditingAddress(null);
      setAddressForm({
        title: '',
        fullAddress: '',
        city: '',
        street: '',
        house: '',
        apartment: '',
        entrance: '',
        floor: '',
        intercom: '',
        comment: '',
      });
    } catch (err) {
      alert('Ошибка при сохранении адреса');
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (confirm('Удалить этот адрес?')) {
      try {
        await axios.delete(`${API_URL}/users/${user?.id}/addresses/${addressId}`);
        await loadUserData();
      } catch (err) {
        alert('Ошибка при удалении адреса');
      }
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await axios.patch(`${API_URL}/users/${user?.id}/notifications`, notifications);
      alert('Настройки уведомлений сохранены');
    } catch (err) {
      alert('Ошибка при сохранении настроек');
    }
  };

  if (!isAuthenticated) {
    return (
      <div>
        <div className="profile-card">
          <div className="profile-icon">👤</div>
          <h2>Вы не авторизованы</h2>
          <p>
            Войдите в систему, чтобы оформлять заказы,<br/>
            отслеживать их статус и получать персональные предложения
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAuthModal(true)}
            style={{ padding: '16px 48px', fontSize: '16px' }}
          >
            Войти в систему
          </button>
        </div>

        {showAuthModal && (
          <div 
            className="modal-overlay"
            onClick={() => setShowAuthModal(false)}
          >
            <div 
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{isLogin ? 'Вход в систему' : 'Регистрация'}</h2>

              {error && (
                <div style={{
                  padding: '12px',
                  background: '#f8d7da',
                  color: '#721c24',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <input
                    type="email"
                    placeholder="Email"
                    className="form-input"
                    value={authFormData.email}
                    onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    placeholder="Пароль"
                    className="form-input"
                    value={authFormData.password}
                    onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                    required
                  />
                </div>
                
                {!isLogin && (
                  <>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Имя"
                        className="form-input"
                        value={authFormData.firstName}
                        onChange={(e) => setAuthFormData({ ...authFormData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Фамилия"
                        className="form-input"
                        value={authFormData.lastName}
                        onChange={(e) => setAuthFormData({ ...authFormData, lastName: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
                </button>
              </form>

              <div className="form-footer">
                {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                {' '}
                <button className="link-btn" onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar-large">
            {profileData.firstName?.[0] || user?.email?.[0] || '👤'}
          </div>
          <div className="profile-header-info">
            <h1 className="profile-header-name">
              {profileData.firstName || profileData.lastName 
                ? `${profileData.firstName} ${profileData.lastName}`.trim()
                : user?.email}
            </h1>
            <p className="profile-header-email">{user?.email}</p>
            {stats && (
              <div className="profile-stats-mini">
                <span>🛍️ {stats.totalOrders} заказов</span>
                <span>•</span>
                <span>💰 {stats.totalSpent.toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
          </div>
        </div>
        <button className="btn btn-danger" onClick={logout}>
          Выйти
        </button>
      </div>

      {stats && (
        <div className="profile-stats-cards">
          <div className="stat-card-mini">
            <div className="stat-icon-mini">📦</div>
            <div className="stat-info-mini">
              <div className="stat-value-mini">{stats.totalOrders}</div>
              <div className="stat-label-mini">Всего заказов</div>
            </div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-icon-mini">💰</div>
            <div className="stat-info-mini">
              <div className="stat-value-mini">{stats.totalSpent.toLocaleString('ru-RU')} ₽</div>
              <div className="stat-label-mini">Потрачено</div>
            </div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-icon-mini">🚚</div>
            <div className="stat-info-mini">
              <div className="stat-value-mini">{stats.activeOrders}</div>
              <div className="stat-label-mini">Активных</div>
            </div>
          </div>
        </div>
      )}

      <div className="profile-tabs">
        <button
          onClick={() => setActiveTab('personal')}
          className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`}
        >
          👤 Личные данные
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`profile-tab ${activeTab === 'addresses' ? 'active' : ''}`}
        >
          📍 Адреса доставки
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`profile-tab ${activeTab === 'notifications' ? 'active' : ''}`}
        >
          🔔 Уведомления
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
        >
          🔒 Безопасность
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'personal' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Личная информация</h2>
              {!isEditing ? (
                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                  Редактировать
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={handleSaveProfile}>
                    Сохранить
                  </button>
                  <button className="btn btn-secondary" onClick={() => {
                    setIsEditing(false);
                    loadUserData();
                  }}>
                    Отмена
                  </button>
                </div>
              )}
            </div>

            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Имя</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-group">
                  <label>Фамилия</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Отчество</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileData.middleName}
                  onChange={(e) => setProfileData({ ...profileData, middleName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Телефон</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>
                <div className="form-group">
                  <label>Дата рождения</label>
                  <input
                    type="date"
                    className="form-input"
                    value={profileData.birthDate}
                    onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Пол</label>
                <select
                  className="form-input"
                  value={profileData.gender}
                  onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                  disabled={!isEditing}
                >
                  <option value="">Не указан</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                  <option value="other">Другой</option>
                </select>
              </div>

              <div className="form-group">
                <label>О себе</label>
                <textarea
                  className="form-input"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Расскажите немного о себе..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Адреса доставки</h2>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingAddress(null);
                  setAddressForm({
                    title: '',
                    fullAddress: '',
                    city: '',
                    street: '',
                    house: '',
                    apartment: '',
                    entrance: '',
                    floor: '',
                    intercom: '',
                    comment: '',
                  });
                  setShowAddressModal(true);
                }}
              >
                + Добавить адрес
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="empty-state-small">
                <p>У вас пока нет сохраненных адресов</p>
              </div>
            ) : (
              <div className="addresses-grid">
                {addresses.map((address) => (
                  <div key={address.id} className="address-card">
                    <div className="address-card-header">
                      <h3>{address.title || 'Адрес'}</h3>
                      {address.isDefault && (
                        <span className="badge-default">По умолчанию</span>
                      )}
                    </div>
                    <p className="address-text">{address.fullAddress}</p>
                    <div className="address-details">
                      {address.apartment && <span>Кв. {address.apartment}</span>}
                      {address.entrance && <span>Подъезд {address.entrance}</span>}
                      {address.floor && <span>Этаж {address.floor}</span>}
                    </div>
                    {address.comment && (
                      <p className="address-comment">{address.comment}</p>
                    )}
                    <div className="address-actions">
                      <button
                        className="btn-link"
                        onClick={() => {
                          setEditingAddress(address);
                          setAddressForm(address);
                          setShowAddressModal(true);
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        className="btn-link text-danger"
                        onClick={() => handleDeleteAddress(address.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddressModal && (
              <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                  <h2>{editingAddress ? 'Редактировать адрес' : 'Новый адрес'}</h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                      <label>Название адреса</label>
                      <input
                        type="text"
                        className="form-input"
                        value={addressForm.title}
                        onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                        placeholder="Дом, Работа, и т.д."
                      />
                    </div>

                    <div className="form-group">
                      <label>Полный адрес</label>
                      <input
                        type="text"
                        className="form-input"
                        value={addressForm.fullAddress}
                        onChange={(e) => setAddressForm({ ...addressForm, fullAddress: e.target.value })}
                        placeholder="Город, улица, дом"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Квартира</label>
                        <input
                          type="text"
                          className="form-input"
                          value={addressForm.apartment}
                          onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Подъезд</label>
                        <input
                          type="text"
                          className="form-input"
                          value={addressForm.entrance}
                          onChange={(e) => setAddressForm({ ...addressForm, entrance: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Этаж</label>
                        <input
                          type="text"
                          className="form-input"
                          value={addressForm.floor}
                          onChange={(e) => setAddressForm({ ...addressForm, floor: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Домофон</label>
                      <input
                        type="text"
                        className="form-input"
                        value={addressForm.intercom}
                        onChange={(e) => setAddressForm({ ...addressForm, intercom: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Комментарий для курьера</label>
                      <textarea
                        className="form-input"
                        value={addressForm.comment}
                        onChange={(e) => setAddressForm({ ...addressForm, comment: e.target.value })}
                        rows={3}
                        placeholder="Дополнительная информация..."
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn btn-primary" onClick={handleSaveAddress} style={{ flex: 1 }}>
                        Сохранить
                      </button>
                      <button className="btn btn-secondary" onClick={() => setShowAddressModal(false)} style={{ flex: 1 }}>
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Настройки уведомлений</h2>
              <button className="btn btn-primary" onClick={handleSaveNotifications}>
                Сохранить
              </button>
            </div>

            <div className="notifications-settings">
              <div className="notification-group">
                <h3>Способы получения</h3>
                <label className="notification-item">
                  <div>
                    <div className="notification-title">📧 Email уведомления</div>
                    <div className="notification-desc">Получать уведомления на почту</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={notifications.email}
                    onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                  />
                </label>
                <label className="notification-item">
                  <div>
                    <div className="notification-title">📱 SMS уведомления</div>
                    <div className="notification-desc">Получать SMS на телефон</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={notifications.sms}
                    onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                  />
                </label>
                <label className="notification-item">
                  <div>
                    <div className="notification-title">🔔 Push уведомления</div>
                    <div className="notification-desc">Получать уведомления в браузере</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={notifications.push}
                    onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                  />
                </label>
              </div>

              <div className="notification-group">
                <h3>Типы уведомлений</h3>
                <label className="notification-item">
                  <div>
                    <div className="notification-title">📦 Обновления заказов</div>
                    <div className="notification-desc">Статус заказа, доставка</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={notifications.orderUpdates}
                    onChange={(e) => setNotifications({ ...notifications, orderUpdates: e.target.checked })}
                  />
                </label>
                <label className="notification-item">
                  <div>
                    <div className="notification-title">🎁 Акции и скидки</div>
                    <div className="notification-desc">Специальные предложения</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={notifications.promotions}
                    onChange={(e) => setNotifications({ ...notifications, promotions: e.target.checked })}
                  />
                </label>
                <label className="notification-item">
                  <div>
                    <div className="notification-title">📰 Новостная рассылка</div>
                    <div className="notification-desc">Новости и обновления магазина</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={notifications.newsletter}
                    onChange={(e) => setNotifications({ ...notifications, newsletter: e.target.checked })}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Безопасность</h2>
            </div>

            <div className="security-section">
              <div className="security-item">
                <div>
                  <h3>Пароль</h3>
                  <p>Последнее изменение: никогда</p>
                </div>
                <button className="btn btn-secondary">Изменить пароль</button>
              </div>

              <div className="security-item">
                <div>
                  <h3>Двухфакторная аутентификация</h3>
                  <p>Дополнительная защита вашего аккаунта</p>
                </div>
                <button className="btn btn-secondary">Настроить</button>
              </div>

              <div className="security-item">
                <div>
                  <h3>Активные сеансы</h3>
                  <p>Управление устройствами с доступом к аккаунту</p>
                </div>
                <button className="btn btn-secondary">Просмотреть</button>
              </div>

              <div className="security-item danger">
                <div>
                  <h3>Удаление аккаунта</h3>
                  <p>Безвозвратное удаление всех данных</p>
                </div>
                <button className="btn btn-danger">Удалить аккаунт</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
