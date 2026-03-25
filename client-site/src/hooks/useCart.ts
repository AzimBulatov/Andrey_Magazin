import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'http://backend:3000';

export function useCart() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await axios.get(`${API_URL}/cart/${user.id}`);
      return res.data;
    },
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: cartTotal } = useQuery({
    queryKey: ['cart-total', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, count: 0, items: [] };
      const res = await axios.get(`${API_URL}/cart/${user.id}/total`);
      return res.data;
    },
    enabled: isAuthenticated && !!user?.id,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: number; quantity?: number }) => {
      if (!user?.id) throw new Error('Необходимо войти в систему');
      const res = await axios.post(`${API_URL}/cart/${user.id}/add`, { productId, quantity });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['cart-total', user?.id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка при добавлении в корзину';
      alert(message);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      if (!user?.id) throw new Error('Необходимо войти в систему');
      const res = await axios.patch(`${API_URL}/cart/${user.id}/update`, { productId, quantity });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['cart-total', user?.id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка при обновлении количества';
      alert(message);
      // Перезагрузить корзину, чтобы показать актуальные данные
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!user?.id) throw new Error('Необходимо войти в систему');
      const res = await axios.delete(`${API_URL}/cart/${user.id}/remove/${productId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['cart-total', user?.id] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Необходимо войти в систему');
      const res = await axios.delete(`${API_URL}/cart/${user.id}/clear`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['cart-total', user?.id] });
    },
  });

  return {
    cart: cart || [],
    cartTotal: cartTotal || { total: 0, count: 0, items: [] },
    isLoading,
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
  };
}
