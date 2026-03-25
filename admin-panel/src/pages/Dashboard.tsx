import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export default function Dashboard() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data;
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Главная панель</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Статистика */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Всего товаров</p>
              <p className="text-3xl font-bold mt-2">{products?.length || 0}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Категорий</p>
              <p className="text-3xl font-bold mt-2">{categories?.length || 0}</p>
            </div>
            <div className="text-4xl">🏷️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Заказов</p>
              <p className="text-3xl font-bold mt-2">{orders?.length || 0}</p>
            </div>
            <div className="text-4xl">🛒</div>
          </div>
        </div>
      </div>

      {/* Последние товары */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Последние товары</h2>
        </div>
        <div className="p-6">
          {products && products.length > 0 ? (
            <div className="space-y-4">
              {products.slice(0, 5).map((product: any) => (
                <div key={product.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-4">
                    {product.image ? (
                      <img
                        src={`http://localhost:3000/${product.image}`}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        📦
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{product.price} ₽</p>
                    <p className="text-sm text-gray-500">В наличии: {product.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Товары не найдены</p>
          )}
        </div>
      </div>
    </div>
  );
}
