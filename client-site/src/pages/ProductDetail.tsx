import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : '';

type TabType = 'description' | 'characteristics' | 'reviews' | 'questions';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [question, setQuestion] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/products/${id}`);
      return res.data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/reviews/product/${id}`);
      return res.data;
    },
  });

  const addReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post(`${API_URL}/reviews`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      setShowReviewForm(false);
      setComment('');
      setRating(5);
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      alert('Войдите в систему для добавления товаров в корзину');
      return;
    }
    addToCart({ productId: Number(id), quantity });
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      alert('Войдите в систему для написания отзыва');
      return;
    }
    addReviewMutation.mutate({
      userId: user.id,
      productId: Number(id),
      rating,
      comment,
    });
  };

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Войдите в систему для задания вопроса');
      return;
    }
    // TODO: Implement questions API
    setShowQuestionForm(false);
    setQuestion('');
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '18px', color: '#6c757d' }}>Загрузка...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty-state" style={{
        background: 'white',
        borderRadius: '20px',
        padding: '80px 40px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
      }}>
        <div className="empty-icon" style={{ fontSize: '100px', marginBottom: '24px' }}>📦</div>
        <h2 style={{ fontSize: '32px', marginBottom: '16px', color: '#212529' }}>Товар не найден</h2>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '16px' }}>
          Вернуться в каталог
        </button>
      </div>
    );
  }

  // Имитация нескольких изображений (в реальности будет массив)
  const images = product.image ? [product.image] : [];

  return (
    <div className="product-detail-page">
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{
        background: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <button onClick={() => navigate('/')} className="breadcrumb-link">
          Главная
        </button>
        <span className="breadcrumb-separator">/</span>
        <button onClick={() => navigate('/')} className="breadcrumb-link">
          {product.category?.name}
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      {/* Main Product Section */}
      <div className="product-main" style={{
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        {/* Image Gallery */}
        <div className="product-gallery">
          <div className="gallery-main">
            {images.length > 0 ? (
              <img
                src={`${API_URL}/${images[selectedImage]}`}
                alt={product.name}
                className="gallery-main-image"
              />
            ) : (
              <div className="gallery-placeholder">
                <span style={{ fontSize: '120px' }}>📦</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbnails">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`gallery-thumbnail ${selectedImage === idx ? 'active' : ''}`}
                >
                  <img src={`${API_URL}/${img}`} alt={`${product.name} ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          <div className="product-badges">
            {product.stock > 0 && (
              <span className="badge badge-success">В наличии</span>
            )}
            {product.salesCount > 50 && (
              <span className="badge badge-popular">Популярный</span>
            )}
          </div>

          <h1 className="product-title">{product.name}</h1>

          <div className="product-rating-block">
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= product.averageRating ? 'filled' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="rating-text">
              {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'Нет оценок'}
            </span>
            <button
              onClick={() => setActiveTab('reviews')}
              className="reviews-link"
            >
              {product.reviewCount} {product.reviewCount === 1 ? 'отзыв' : 'отзывов'}
            </button>
            <span className="product-views">👁 {product.viewCount} просмотров</span>
          </div>

          <div className="product-price-block">
            <div className="product-price">{product.price.toLocaleString('ru-RU')} ₽</div>
            {/* Можно добавить старую цену если есть скидка */}
          </div>

          <div className="product-stock-info">
            {product.stock > 0 ? (
              <div className="stock-available">
                <span className="stock-icon">✓</span>
                <span>В наличии: {product.stock} шт.</span>
              </div>
            ) : (
              <div className="stock-unavailable">
                <span className="stock-icon">✗</span>
                <span>Нет в наличии</span>
              </div>
            )}
          </div>

          <div className="product-actions">
            <div className="quantity-selector">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="quantity-btn"
                disabled={quantity <= 1}
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
                className="quantity-input"
                min="1"
                max={product.stock}
              />
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="quantity-btn"
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  alert('Войдите в систему для добавления в избранное');
                  return;
                }
                toggleWishlist(Number(id));
              }}
              className={`btn-wishlist-detail ${isInWishlist(Number(id)) ? 'active' : ''}`}
              title={isInWishlist(Number(id)) ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              {isInWishlist(Number(id)) ? '❤️' : '🤍'}
            </button>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn btn-primary btn-add-cart"
            >
              <span>🛒</span>
              <span>Добавить в корзину</span>
            </button>
          </div>

          <div className="product-meta">
            <div className="meta-item">
              <span className="meta-label">Артикул:</span>
              <span className="meta-value">#{product.id}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Категория:</span>
              <span className="meta-value">{product.category?.name}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Продано:</span>
              <span className="meta-value">{product.salesCount} шт.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="product-tabs-section" style={{
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div className="tabs-header">
          <button
            onClick={() => setActiveTab('description')}
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
          >
            Описание
          </button>
          <button
            onClick={() => setActiveTab('characteristics')}
            className={`tab-btn ${activeTab === 'characteristics' ? 'active' : ''}`}
          >
            Характеристики
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          >
            Отзывы ({product.reviewCount})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
          >
            Вопросы (0)
          </button>
        </div>

        <div className="tabs-content">
          {/* Description Tab */}
          {activeTab === 'description' && (
            <div className="tab-panel">
              <h3>Описание товара</h3>
              <p className="product-description">{product.description || 'Описание отсутствует'}</p>
            </div>
          )}

          {/* Characteristics Tab */}
          {activeTab === 'characteristics' && (
            <div className="tab-panel">
              <h3>Характеристики</h3>
              <div className="characteristics-table">
                <div className="char-row">
                  <span className="char-label">Название</span>
                  <span className="char-value">{product.name}</span>
                </div>
                <div className="char-row">
                  <span className="char-label">Артикул</span>
                  <span className="char-value">#{product.id}</span>
                </div>
                <div className="char-row">
                  <span className="char-label">Категория</span>
                  <span className="char-value">{product.category?.name}</span>
                </div>
                <div className="char-row">
                  <span className="char-label">Цена</span>
                  <span className="char-value">{product.price} ₽</span>
                </div>
                <div className="char-row">
                  <span className="char-label">Наличие</span>
                  <span className="char-value">{product.stock > 0 ? `В наличии (${product.stock} шт.)` : 'Нет в наличии'}</span>
                </div>
                <div className="char-row">
                  <span className="char-label">Рейтинг</span>
                  <span className="char-value">{product.averageRating > 0 ? `${product.averageRating.toFixed(1)} / 5` : 'Нет оценок'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="tab-panel">
              <div className="reviews-header">
                <h3>Отзывы покупателей</h3>
                {isAuthenticated && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="btn btn-primary"
                  >
                    {showReviewForm ? 'Отменить' : 'Написать отзыв'}
                  </button>
                )}
              </div>

              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="review-form" style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  border: '2px solid #e9ecef'
                }}>
                  <h4>Ваш отзыв</h4>
                  <div className="form-group">
                    <label>Оценка товара</label>
                    <div className="rating-selector">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`star-btn ${star <= rating ? 'active' : ''}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Комментарий</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Расскажите о своих впечатлениях от товара..."
                      className="form-textarea"
                      rows={5}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Отправить отзыв
                  </button>
                </form>
              )}

              <div className="reviews-list">
                {reviews && reviews.length > 0 ? (
                  reviews.map((review: any) => (
                    <div key={review.id} className="review-card" style={{
                      background: 'white',
                      border: '2px solid #f8f9fa',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#f8f9fa';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
                      <div className="review-header">
                        <div className="review-author">
                          <div className="author-avatar">
                            {review.user?.firstName?.[0] || 'П'}
                          </div>
                          <div className="author-info">
                            <div className="author-name">
                              {review.user?.firstName || 'Пользователь'}
                            </div>
                            <div className="review-date">
                              {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="review-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`star ${star <= review.rating ? 'filled' : ''}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="review-text">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="empty-reviews">
                    <div className="empty-icon">💬</div>
                    <p>Пока нет отзывов</p>
                    <p className="empty-subtitle">Будьте первым, кто оставит отзыв о товаре!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="tab-panel">
              <div className="questions-header">
                <h3>Вопросы о товаре</h3>
                {isAuthenticated && (
                  <button
                    onClick={() => setShowQuestionForm(!showQuestionForm)}
                    className="btn btn-primary"
                  >
                    {showQuestionForm ? 'Отменить' : 'Задать вопрос'}
                  </button>
                )}
              </div>

              {showQuestionForm && (
                <form onSubmit={handleSubmitQuestion} className="question-form" style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  border: '2px solid #e9ecef'
                }}>
                  <h4>Ваш вопрос</h4>
                  <div className="form-group">
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Задайте вопрос о товаре..."
                      className="form-textarea"
                      rows={4}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Отправить вопрос
                  </button>
                </form>
              )}

              <div className="questions-list">
                <div className="empty-questions">
                  <div className="empty-icon">❓</div>
                  <p>Пока нет вопросов</p>
                  <p className="empty-subtitle">Задайте первый вопрос о товаре!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
