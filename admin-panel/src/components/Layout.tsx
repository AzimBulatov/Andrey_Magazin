import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold" style={{ color: 'white' }}>
            🛍️ Админ-панель
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Telegram Shop
          </p>
        </div>

        <nav className="mt-6">
          <Link
            to="/dashboard"
            className={`flex items-center px-6 py-3 hover:bg-gray-800 transition ${
              isActive('/dashboard') ? 'bg-gray-800 border-l-4 border-blue-500' : ''
            }`}
            style={{ color: 'white', textDecoration: 'none' }}
          >
            <span className="mr-3">📊</span>
            Главная
          </Link>

          <Link
            to="/products"
            className={`flex items-center px-6 py-3 hover:bg-gray-800 transition ${
              isActive('/products') ? 'bg-gray-800 border-l-4 border-blue-500' : ''
            }`}
            style={{ color: 'white', textDecoration: 'none' }}
          >
            <span className="mr-3">📦</span>
            Товары
          </Link>

          <Link
            to="/categories"
            className={`flex items-center px-6 py-3 hover:bg-gray-800 transition ${
              isActive('/categories') ? 'bg-gray-800 border-l-4 border-blue-500' : ''
            }`}
            style={{ color: 'white', textDecoration: 'none' }}
          >
            <span className="mr-3">🏷️</span>
            Категории
          </Link>

          <Link
            to="/orders"
            className={`flex items-center px-6 py-3 hover:bg-gray-800 transition ${
              isActive('/orders') ? 'bg-gray-800 border-l-4 border-blue-500' : ''
            }`}
            style={{ color: 'white', textDecoration: 'none' }}
          >
            <span className="mr-3">🛒</span>
            Заказы
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
