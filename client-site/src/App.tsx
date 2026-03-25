import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useCart } from './hooks/useCart';
import { useWishlist } from './hooks/useWishlist';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminUsers from './pages/AdminUsers';
import AdminOrders from './pages/AdminOrders';
import ProductDetail from './pages/ProductDetail';
import MyOrders from './pages/MyOrders';
import Wishlist from './pages/Wishlist';
import Finance from './pages/Finance';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import TelegramAuth from './pages/TelegramAuth';

const queryClient = new QueryClient();

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'http://backend:3000';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  categoryId: number;
  category: { id: number; name: string };
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  salesCount: number;
}

// Sidebar Navigation Component
function SidebarNav() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { cartTotal } = useCart();

  return (
    <nav className="sidebar-nav">
      <div className="sidebar-logo">
        🛍️ Магазин
      </div>
      
      <div className="sidebar-menu">
        <Link 
          to="/" 
          className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          <span className="sidebar-link-icon">🏠</span>
          <span>Главная</span>
        </Link>
        
        <Link 
          to="/cart" 
          className={`sidebar-link ${location.pathname === '/cart' ? 'active' : ''}`}
        >
          <span className="sidebar-link-icon">🛒</span>
          <span>Корзина</span>
          {cartTotal.count > 0 && (
            <span className="cart-badge">{cartTotal.count}</span>
          )}
        </Link>

        <Link 
          to="/orders" 
          className={`sidebar-link ${location.pathname === '/orders' ? 'active' : ''}`}
        >
          <span className="sidebar-link-icon">📦</span>
          <span>Мои заказы</span>
        </Link>

        <Link 
          to="/wishlist" 
          className={`sidebar-link ${location.pathname === '/wishlist' ? 'active' : ''}`}
        >
          <span className="sidebar-link-icon">❤️</span>
          <span>Избранное</span>
        </Link>

        <Link 
          to="/finance" 
          className={`sidebar-link ${location.pathname === '/finance' ? 'active' : ''}`}
        >
          <span className="sidebar-link-icon">💰</span>
          <span>Финансы</span>
        </Link>
        
        <Link 
          to="/profile" 
          className={`sidebar-link ${location.pathname === '/profile' ? 'active' : ''}`}
        >
          <span className="sidebar-link-icon">👤</span>
          <span>Профиль</span>
        </Link>

        {isAuthenticated && user?.role === 'admin' && (
          <>
            <div style={{ 
              margin: '20px 0', 
              height: '1px', 
              background: 'rgba(255,255,255,0.2)' 
            }}></div>

            <Link 
              to="/admin" 
              className={`sidebar-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">⚙️</span>
              <span>Админ-панель</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  // Filters
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [minRating, setMinRating] = useState(0);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [showDiscountOnly, setShowDiscountOnly] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/categories`).then(res => setCategories(res.data));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.append('categoryId', String(selectedCategory));
    if (searchQuery) params.append('search', searchQuery);
    if (sortBy) params.append('sortBy', sortBy);
    
    axios.get(`${API_URL}/products?${params.toString()}`).then(res => setProducts(res.data));
  }, [selectedCategory, searchQuery, sortBy]);

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      alert('Войдите в систему для добавления товаров в корзину');
      return;
    }
    if (product.stock === 0) {
      alert('Товар отсутствует в наличии');
      return;
    }
    addToCart({ productId: product.id, quantity: 1 });
  };

  const resetFilters = () => {
    setPriceFrom('');
    setPriceTo('');
    setInStockOnly(false);
    setSelectedCategory(null);
    setSearchQuery('');
    setSortBy('newest');
    setMinRating(0);
    setShowNewOnly(false);
    setShowDiscountOnly(false);
  };

  let filteredProducts = products;

  if (priceFrom) {
    filteredProducts = filteredProducts.filter(p => p.price >= Number(priceFrom));
  }
  if (priceTo) {
    filteredProducts = filteredProducts.filter(p => p.price <= Number(priceTo));
  }
  if (inStockOnly) {
    filteredProducts = filteredProducts.filter(p => p.stock > 0);
  }
  if (minRating > 0) {
    filteredProducts = filteredProducts.filter(p => p.averageRating >= minRating);
  }
  if (showNewOnly) {
    // Показываем товары, добавленные за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filteredProducts = filteredProducts.filter(p => {
      // Предполагаем, что у товара есть поле createdAt
      return true; // Пока оставим все товары, т.к. нет даты в интерфейсе
    });
  }
  if (showDiscountOnly) {
    // Фильтр для товаров со скидкой (когда будет добавлено поле discount)
    filteredProducts = filteredProducts.filter(p => {
      // Пока оставим все товары
      return true;
    });
  }

  return (
    <div className="layout-with-filters">
      <div>
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '20px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          marginBottom: '24px'
        }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '40px' }}>🛍️</span>
            {selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name 
              : 'Каталог товаров'}
          </h1>
          <p className="page-subtitle">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'товар' : 'товаров'}
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="🔍 Поиск товаров..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 24px',
              border: '2px solid #e9ecef',
              borderRadius: '16px',
              fontSize: '16px',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e9ecef';
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            }}
          />
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="empty-state" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '80px 40px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}>
            <div className="empty-icon" style={{ fontSize: '100px', marginBottom: '24px' }}>📦</div>
            <h2 style={{ fontSize: '32px', marginBottom: '16px', color: '#212529' }}>Товары не найдены</h2>
            <p style={{ fontSize: '18px', color: '#6c757d', marginBottom: '32px' }}>
              Попробуйте изменить фильтры или выбрать другую категорию
            </p>
            <button onClick={resetFilters} className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '16px' }}>
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="product-card">
                  {product.image ? (
                    <img 
                      src={`${API_URL}/${product.image}`} 
                      alt={product.name}
                      className="product-image"
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '280px', 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '16px 16px 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '64px'
                    }}>
                      📦
                    </div>
                  )}
                  <div className="product-content">
                    <div className="product-category">{product.category?.name}</div>
                    <div className="product-name">{product.name}</div>
                    <p className="product-description">{product.description}</p>
                    
                    {product.averageRating > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} style={{ fontSize: '14px', color: star <= product.averageRating ? '#ffc107' : '#e0e0e0' }}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span style={{ fontSize: '13px', color: '#6c757d' }}>
                          ({product.reviewCount})
                        </span>
                      </div>
                    )}

                    <div className="product-footer">
                      <div>
                        <div className="product-price">{product.price} ₽</div>
                        <div className={`product-stock ${product.stock === 0 ? 'out' : ''}`}>
                          {product.stock === 0 ? '❌ Нет в наличии' : `✓ В наличии: ${product.stock} шт.`}
                        </div>
                      </div>
                    </div>
                    <div className="product-actions-buttons">
                      <button 
                        className={`btn-wishlist ${isInWishlist(product.id) ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!isAuthenticated) {
                            alert('Войдите в систему для добавления в избранное');
                            return;
                          }
                          toggleWishlist(product.id);
                        }}
                        title={isInWishlist(product.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                      >
                        {isInWishlist(product.id) ? '❤️' : '🤍'}
                      </button>
                      <button 
                        className="btn btn-primary btn-add-to-cart"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? '❌ Нет в наличии' : '🛒 В корзину'}
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <aside className="sidebar">
        <div className="sidebar-section">
          <h3>Категории</h3>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`category-btn ${!selectedCategory ? 'active' : ''}`}
          >
            <span>Все товары</span>
            <span className="category-count">{products.length}</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            >
              <span>{cat.name}</span>
              <span className="category-count">
                {products.filter(p => p.categoryId === cat.id).length}
              </span>
            </button>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">
            � Соратировка
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '2px solid #e9ecef',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              background: 'white',
            }}
          >
            <option value="newest">🆕 Новинки</option>
            <option value="price_asc">💰 Цена: по возрастанию</option>
            <option value="price_desc">💰 Цена: по убыванию</option>
            <option value="popular">🔥 Популярные</option>
            <option value="rating">⭐ По рейтингу</option>
          </select>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">
            💰 Цена
          </div>
          <div className="filter-group">
            <div className="price-inputs">
              <input
                type="number"
                placeholder="От"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="price-input"
                min="0"
              />
              <input
                type="number"
                placeholder="До"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="price-input"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">
            ⭐ Рейтинг
          </div>
          <div className="rating-filter">
            {[5, 4, 3, 2, 1].map((rating) => (
              <label key={rating} className="checkbox-label">
                <input
                  type="radio"
                  name="rating"
                  checked={minRating === rating}
                  onChange={() => setMinRating(rating)}
                  className="checkbox-input"
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>От {rating}</span>
                  <span style={{ color: '#ffc107' }}>
                    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                  </span>
                </span>
              </label>
            ))}
            {minRating > 0 && (
              <button
                onClick={() => setMinRating(0)}
                style={{
                  marginTop: '6px',
                  padding: '6px 10px',
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Сбросить рейтинг
              </button>
            )}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">
            🎯 Дополнительно
          </div>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="checkbox-input"
              />
              <span>Только в наличии</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showNewOnly}
                onChange={(e) => setShowNewOnly(e.target.checked)}
                className="checkbox-input"
              />
              <span>🆕 Новинки (30 дней)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showDiscountOnly}
                onChange={(e) => setShowDiscountOnly(e.target.checked)}
                className="checkbox-input"
              />
              <span>🏷️ Со скидкой</span>
            </label>
          </div>
        </div>

        <button onClick={resetFilters} className="reset-btn">
          🔄 Сбросить все фильтры
        </button>
      </aside>
    </div>
  );
}

function Cart() {
  const navigate = useNavigate();
  const { cart, cartTotal, updateQuantity, removeFromCart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleUpdateQuantity = (productId: number, delta: number) => {
    const item = cart.find((i: any) => i.productId === productId);
    if (item) {
      const newQty = item.quantity + delta;
      const maxStock = item.product?.stock || 999;
      
      if (newQty > 0 && newQty <= maxStock) {
        updateQuantity({ productId, quantity: newQty });
      } else if (newQty > maxStock) {
        alert(`Доступно только ${maxStock} шт. этого товара`);
      }
    }
  };

  const handleRemoveItem = (productId: number) => {
    removeFromCart(productId);
    setSelectedItems(selectedItems.filter(id => id !== productId));
  };

  const toggleSelectItem = (productId: number) => {
    setSelectedItems(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.map((item: any) => item.productId));
    }
    setSelectAll(!selectAll);
  };

  const removeSelectedItems = () => {
    if (selectedItems.length === 0) return;
    if (confirm(`Удалить ${selectedItems.length} товаров из корзины?`)) {
      selectedItems.forEach(productId => removeFromCart(productId));
      setSelectedItems([]);
      setSelectAll(false);
    }
  };

  const selectedTotal = cart
    .filter((item: any) => selectedItems.includes(item.productId))
    .reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0);

  const selectedCount = cart
    .filter((item: any) => selectedItems.includes(item.productId))
    .reduce((sum: number, item: any) => sum + item.quantity, 0);

  const handleCheckout = () => {
    // Если есть выбранные товары, передаем только их, иначе все товары из корзины
    const itemsToCheckout = selectedItems.length > 0 
      ? cart.filter((item: any) => selectedItems.includes(item.productId))
      : cart;
    
    navigate('/checkout', { state: { selectedItems: itemsToCheckout } });
  };

  if (!isAuthenticated) {
    return (
      <div className="empty-state" style={{
        background: 'white',
        borderRadius: '20px',
        padding: '80px 40px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
      }}>
        <div className="empty-icon" style={{ fontSize: '100px', marginBottom: '24px' }}>🛒</div>
        <h2 style={{ fontSize: '32px', marginBottom: '16px', color: '#212529' }}>Войдите в систему</h2>
        <p style={{ fontSize: '18px', color: '#6c757d', marginBottom: '32px' }}>
          Чтобы использовать корзину, необходимо войти в систему
        </p>
        <Link to="/profile" className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '16px' }}>
          Войти
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div style={{ fontSize: '20px', color: '#6c757d', fontWeight: '600' }}>Загрузка...</div>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="empty-state" style={{
        background: 'white',
        borderRadius: '20px',
        padding: '80px 40px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
      }}>
        <div className="empty-icon" style={{ fontSize: '100px', marginBottom: '24px' }}>🛒</div>
        <h2 style={{ fontSize: '32px', marginBottom: '16px', color: '#212529' }}>Корзина пуста</h2>
        <p style={{ fontSize: '18px', color: '#6c757d', marginBottom: '32px' }}>
          Добавьте товары из каталога, чтобы оформить заказ
        </p>
        <Link to="/" className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '16px' }}>
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="wb-cart-page">
      <div className="wb-cart-header">
        <h1 className="wb-cart-title">
          <span style={{ fontSize: '40px' }}>🛒</span>
          Корзина
        </h1>
        <div className="wb-cart-header-actions">
          <label className="wb-select-all-label">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="wb-checkbox"
            />
            <span>Выбрать все</span>
          </label>
          {selectedItems.length > 0 && (
            <button onClick={removeSelectedItems} className="wb-action-link">
              Удалить выбранные
            </button>
          )}
        </div>
      </div>

      <div className="wb-cart-layout">
        <div className="wb-cart-items">
          {cart.map((item: any) => (
            <div
              key={item.id}
              className={`wb-cart-item ${selectedItems.includes(item.productId) ? 'wb-selected' : ''}`}
            >
              <div className="wb-item-checkbox">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.productId)}
                  onChange={() => toggleSelectItem(item.productId)}
                  className="wb-checkbox"
                />
              </div>

              <Link to={`/product/${item.product.id}`} className="wb-item-image">
                {item.product.image ? (
                  <img
                    src={`${API_URL}/${item.product.image}`}
                    alt={item.product.name}
                  />
                ) : (
                  <div className="wb-item-image-placeholder">
                    <span>📦</span>
                  </div>
                )}
              </Link>

              <div className="wb-item-info">
                <Link to={`/product/${item.product.id}`} className="wb-item-name">
                  {item.product.name}
                </Link>
                
                <div className="wb-item-category">
                  {item.product.category?.name}
                </div>

                {item.product.stock < 10 && item.product.stock > 0 && (
                  <div className="wb-item-stock-warning">
                    ⚡ Осталось {item.product.stock} шт
                  </div>
                )}

                <div className="wb-item-price">
                  <span className="wb-price-current">
                    {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽
                  </span>
                  {item.quantity > 1 && (
                    <span className="wb-price-per-unit">
                      {item.product.price.toLocaleString('ru-RU')} ₽ / шт
                    </span>
                  )}
                </div>
              </div>

              <div className="wb-item-actions">
                <div className="wb-item-controls">
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="wb-btn-icon wb-btn-delete"
                    title="Удалить"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3V2h4v1h5v2h-1v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5H3V3h5zm6 2H6v11h8V5zM8 7h2v7H8V7zm4 0h2v7h-2V7z"/>
                    </svg>
                  </button>
                  
                  <button className="wb-btn-icon wb-btn-more" title="Ещё">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <circle cx="10" cy="4" r="1.5"/>
                      <circle cx="10" cy="10" r="1.5"/>
                      <circle cx="10" cy="16" r="1.5"/>
                    </svg>
                  </button>
                </div>

                <div className="wb-quantity-controls">
                  <button
                    onClick={() => handleUpdateQuantity(item.productId, -1)}
                    className="wb-qty-btn"
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <span className="wb-qty-value">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.productId, 1)}
                    className="wb-qty-btn"
                    disabled={item.quantity >= item.product.stock}
                  >
                    +
                  </button>
                </div>

                <button className="wb-btn-buy">
                  Купить
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="wb-cart-summary-wrapper">
          <div className="wb-cart-summary">
            <div className="wb-summary-header">
              <div className="wb-summary-icon">🛒</div>
              <div className="wb-summary-count">
                {selectedItems.length > 0 ? selectedCount : cartTotal.count} товар{cartTotal.count === 1 ? '' : (cartTotal.count < 5 ? 'а' : 'ов')}
              </div>
            </div>

            <div className="wb-summary-total">
              <span className="wb-summary-total-label">Итого</span>
              <span className="wb-summary-total-price">
                {(selectedItems.length > 0 ? selectedTotal : cartTotal.total).toLocaleString('ru-RU')} ₽
              </span>
            </div>

            <button className="wb-checkout-btn" onClick={handleCheckout}>
              К оформлению
            </button>

            <div className="wb-summary-info">
              <div className="wb-info-item">
                <span className="wb-info-icon">✓</span>
                <span>Безопасная оплата</span>
              </div>
              <div className="wb-info-item">
                <span className="wb-info-icon">✓</span>
                <span>Гарантия возврата</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminLayout() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/profile');
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div>
      <div style={{ 
        background: 'white', 
        padding: '16px 24px', 
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <Link 
          to="/admin" 
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            background: location.pathname === '/admin' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
            color: location.pathname === '/admin' ? 'white' : '#495057',
            transition: 'all 0.3s'
          }}
        >
          📊 Главная
        </Link>
        <Link 
          to="/admin/products" 
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            background: location.pathname === '/admin/products' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
            color: location.pathname === '/admin/products' ? 'white' : '#495057',
            transition: 'all 0.3s'
          }}
        >
          📦 Товары
        </Link>
        <Link 
          to="/admin/categories" 
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            background: location.pathname === '/admin/categories' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
            color: location.pathname === '/admin/categories' ? 'white' : '#495057',
            transition: 'all 0.3s'
          }}
        >
          🏷️ Категории
        </Link>
        <Link 
          to="/admin/users" 
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            background: location.pathname === '/admin/users' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
            color: location.pathname === '/admin/users' ? 'white' : '#495057',
            transition: 'all 0.3s'
          }}
        >
          👥 Пользователи
        </Link>
        <Link 
          to="/admin/orders" 
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            background: location.pathname === '/admin/orders' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
            color: location.pathname === '/admin/orders' ? 'white' : '#495057',
            transition: 'all 0.3s'
          }}
        >
          🛒 Заказы
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <SidebarNav />
          <div className="main-with-sidebar">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/auth/telegram" element={<TelegramAuth />} />
              <Route path="/admin" element={<><AdminLayout /><AdminDashboard /></>} />
              <Route path="/admin/products" element={<><AdminLayout /><AdminProducts /></>} />
              <Route path="/admin/categories" element={<><AdminLayout /><AdminCategories /></>} />
              <Route path="/admin/users" element={<><AdminLayout /><AdminUsers /></>} />
              <Route path="/admin/orders" element={<><AdminLayout /><AdminOrders /></>} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
