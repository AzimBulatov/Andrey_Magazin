import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : '';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Сначала пробуем войти как пользователь
      let res;
      try {
        res = await axios.post(`${API_URL}/auth/user/login`, { email, password });
      } catch (userError: any) {
        // Если не получилось как пользователь, пробуем как админ
        if (userError.response?.status === 401) {
          res = await axios.post(`${API_URL}/auth/admin/login`, { email, password });
        } else {
          throw userError;
        }
      }

      const { access_token, user: userData } = res.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Ошибка входа');
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName?: string) => {
    try {
      // Создаем обычного пользователя через отдельный endpoint
      const res = await axios.post(`${API_URL}/auth/user/register`, {
        email,
        password,
        firstName,
        lastName,
      });
      const { access_token, user: userData } = res.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Ошибка регистрации');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
