import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'http://backend:3000';

export function useWishlist() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await axios.get(`${API_URL}/wishlist/user/${user.id}`);
      return res.data;
    },
    enabled: isAuthenticated && !!user?.id,
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!user?.id) throw new Error('Необходимо войти в систему');
      const res = await axios.post(`${API_URL}/wishlist`, { 
        userId: user.id, 
        productId 
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
    },
    onError: (error: any) => {
      console.error('Error adding to wishlist:', error);
      alert(error.response?.data?.message || 'Ошибка при добавлении в избранное');
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!user?.id) throw new Error('Необходимо войти в систему');
      const res = await axios.delete(`${API_URL}/wishlist`, {
        data: { userId: user.id, productId }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
    },
    onError: (error: any) => {
      console.error('Error removing from wishlist:', error);
      alert(error.response?.data?.message || 'Ошибка при удалении из избранного');
    },
  });

  const isInWishlist = (productId: number) => {
    if (!wishlist) return false;
    return wishlist.some((item: any) => item.productId === productId);
  };

  const toggleWishlist = (productId: number) => {
    if (isInWishlist(productId)) {
      removeFromWishlistMutation.mutate(productId);
    } else {
      addToWishlistMutation.mutate(productId);
    }
  };

  return {
    wishlist: wishlist || [],
    isLoading,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    isInWishlist,
    toggleWishlist,
  };
}

