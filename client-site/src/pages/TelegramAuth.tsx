import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'http://backend:3000';

export default function TelegramAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Авторизация...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Токен не найден');
      return;
    }

    // Валидируем токен и получаем JWT
    axios
      .post(`${API_URL}/auth/telegram/validate-token`, { token })
      .then((res) => {
        const { access_token, user } = res.data;

        // Сохраняем токен и данные пользователя
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        setStatus('success');
        setMessage('Успешная авторизация! Перенаправление...');

        // Перенаправляем на главную через 1 секунду
        setTimeout(() => {
          navigate('/');
          window.location.reload(); // Перезагружаем для обновления контекста
        }, 1000);
      })
      .catch((error) => {
        console.error('Auth error:', error);
        setStatus('error');
        
        if (error.response?.status === 401) {
          setMessage(error.response.data.message || 'Токен недействителен или истек');
        } else {
          setMessage('Ошибка авторизации. Попробуйте снова.');
        }
      });
  }, [searchParams, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '60px 80px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%',
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              fontSize: '80px',
              marginBottom: '24px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              ⏳
            </div>
            <h1 style={{
              fontSize: '32px',
              marginBottom: '16px',
              color: '#212529',
            }}>
              Авторизация
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#6c757d',
            }}>
              Подождите, идет проверка...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              fontSize: '80px',
              marginBottom: '24px',
            }}>
              ✅
            </div>
            <h1 style={{
              fontSize: '32px',
              marginBottom: '16px',
              color: '#28a745',
            }}>
              Успешно!
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#6c757d',
            }}>
              {message}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              fontSize: '80px',
              marginBottom: '24px',
            }}>
              ❌
            </div>
            <h1 style={{
              fontSize: '32px',
              marginBottom: '16px',
              color: '#dc3545',
            }}>
              Ошибка
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#6c757d',
              marginBottom: '32px',
            }}>
              {message}
            </p>
            <button
              onClick={() => navigate('/profile')}
              style={{
                padding: '16px 48px',
                fontSize: '16px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Вернуться к входу
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
