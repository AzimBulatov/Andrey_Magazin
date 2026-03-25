import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : '';

interface WishlistItem {
  id: number;
  productId: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    stock: number;
    category: { id: number; name: string };
    averageRating: number;
    reviewCount: number;
  };
}

export default function Wishlist() {
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadWishlist();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadWishlist = async () => {
    try {
      const res = await axios.get(`${API_URL}/wishlist/user/${user?.id}`);
      setWishlist(res.data);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    try {
      await axios.delete(`${API_URL}/wishlist`, {
        data: { userId: user?.id, productId }
      });
      setWishlist(wishlist.filter(item => item.productId !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleAddToCart = (productId: number) => {
    addToCart({ productId, quantity: 1 });
  };

  const toggleSelectItem = (productId: number) => {
    setSelectedItems(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    setSelectedItems(wishlist.map(item => item.productId));
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  const removeSelectedItems = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      await Promise.all(
        selectedItems.map(productId => 
          axios.delete(`${API_URL}/wishlist`, {
            data: { userId: user?.id, productId }
          })
        )
      );
      setWishlist(wishlist.filter(item => !selectedItems.includes(item.productId)));
      setSelectedItems([]);
      setSelectMode(false);
    } catch (error) {
      console.error('Error removing items:', error);
    }
  };

  const addSelectedToCart = () => {
    if (selectedItems.length === 0) return;
    
    selectedItems.forEach(productId => {
      addToCart({ productId, quantity: 1 });
    });
    
    alert(`${selectedItems.length} товаров добавлено в корзину`);
  };

  if (!isAuthenticated) {
    return (
      <div className="empty-state">
        <div className="empty-icon">❤️</div>
        <h2>Войдите в систему</h2>
        <p>Чтобы использовать избранное, необходимо войти в систему</p>
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

  return (
    <div>
      <div className="page-header" style={{ 
        background: 'white', 
        padding: '32px', 
        borderRadius: '20px', 
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        marginBottom: '24px'
      }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '40px' }}>❤️</span>
            Избранное
          </h1>
          <p className="page-subtitle" style={{ marginTop: '8px' }}>
            {wishlist.length} {wishlist.length === 1 ? 'товар' : 'товаров'}
            {selectedItems.length > 0 && (
              <span style={{ 
                marginLeft: '12px', 
                padding: '4px 12px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Выбрано: {selectedItems.length}
              </span>
            )}
          </p>
        </div>
        {wishlist.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {!selectMode ? (
              <button 
                onClick={() => setSelectMode(true)}
                className="btn btn-secondary"
                style={{ padding: '12px 24px' }}
              >
                ✓ Выбрать товары
              </button>
            ) : (
              <>
                <button 
                  onClick={selectAll}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '14px' }}
                >
                  Выбрать все
                </button>
                <button 
                  onClick={deselectAll}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '14px' }}
                >
                  Снять выбор
                </button>
                <button 
                  onClick={addSelectedToCart}
                  disabled={selectedItems.length === 0}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: '14px' }}
                >
                  🛒 В корзину ({selectedItems.length})
                </button>
                <button 
                  onClick={removeSelectedItems}
                  disabled={selectedItems.length === 0}
                  className="btn btn-danger"
                  style={{ padding: '10px 20px', fontSize: '14px' }}
                >
                  🗑️ Удалить ({selectedItems.length})
                </button>
                <button 
                  onClick={() => {
                    setSelectMode(false);
                    setSelectedItems([]);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '14px' }}
                >
                  Отмена
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="empty-state" style={{
          background: 'white',
          borderRadius: '20px',
          padding: '80px 40px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
        }}>
          <div className="empty-icon" style={{ fontSize: '100px', marginBottom: '24px' }}>❤️</div>
          <h2 style={{ fontSize: '32px', marginBottom: '16px', color: '#212529' }}>Избранное пусто</h2>
          <p style={{ fontSize: '18px', color: '#6c757d', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            Добавляйте понравившиеся товары в избранное, чтобы не потерять их
          </p>
          <Link to="/" className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '16px' }}>
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((item) => (
            <div 
              key={item.id} 
              className={`wishlist-card ${selectMode && selectedItems.includes(item.productId) ? 'selected' : ''}`}
            >
              {selectMode && (
                <div className="wishlist-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.productId)}
                    onChange={() => toggleSelectItem(item.productId)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {!selectMode && (
                <button
                  onClick={() => removeFromWishlist(item.productId)}
                  className="wishlist-remove-btn"
                  title="Удалить из избранного"
                >
                  ❤️
                </button>
              )}

              <Link to={`/product/${item.product.id}`} className="wishlist-card-link">
                {item.product.image ? (
                  <img
                    src={`${API_URL}/${item.product.image}`}
                    alt={item.product.name}
                    className="wishlist-card-image"
                  />
                ) : (
                  <div className="wishlist-card-placeholder">
                    <span style={{ fontSize: '64px' }}>📦</span>
                  </div>
                )}

                <div className="wishlist-card-content">
                  <div className="wishlist-card-category">
                    {item.product.category?.name}
                  </div>
                  <h3 className="wishlist-card-title">{item.product.name}</h3>
                  <p className="wishlist-card-description">
                    {item.product.description}
                  </p>

                  {item.product.averageRating > 0 && (
                    <div className="wishlist-card-rating">
                      <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`star ${star <= item.product.averageRating ? 'filled' : ''}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="rating-count">
                        ({item.product.reviewCount})
                      </span>
                    </div>
                  )}

                  <div className="wishlist-card-footer">
                    <div className="wishlist-card-price">
                      {item.product.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <div
                      className={`wishlist-card-stock ${item.product.stock === 0 ? 'out' : ''}`}
                    >
                      {item.product.stock === 0
                        ? '❌ Нет в наличии'
                        : `✓ В наличии`}
                    </div>
                  </div>
                </div>
              </Link>

              {!selectMode && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart(item.product.id);
                  }}
                  disabled={item.product.stock === 0}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  {item.product.stock === 0 ? '❌ Нет в наличии' : '🛒 В корзину'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
