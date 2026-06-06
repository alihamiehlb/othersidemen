import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { AccountPage } from '@/pages/AccountPage'
import { CartPage } from '@/pages/CartPage'
import { ShopPage } from '@/pages/ShopPage'
import { ProductPage } from '@/pages/ProductPage'
import { OrderSuccessPage } from '@/pages/OrderSuccessPage'
import { OrderFailedPage } from '@/pages/OrderFailedPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PolicyRoute } from '@/pages/legal/PolicyRoute'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { AdminProducts } from '@/pages/admin/AdminProducts'
import { AdminOrders } from '@/pages/admin/AdminOrders'
import { AdminPhotos } from '@/pages/admin/AdminPhotos'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'product/:slug', element: <ProductPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'order/success', element: <OrderSuccessPage /> },
      { path: 'order/failed', element: <OrderFailedPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <LoginPage initialMode="signup" /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'privacy', element: <PolicyRoute slug="privacy" /> },
      { path: 'terms', element: <PolicyRoute slug="terms" /> },
      { path: 'cookies', element: <PolicyRoute slug="cookies" /> },
      { path: 'security-policy', element: <PolicyRoute slug="security-policy" /> },
      { path: 'shipping', element: <PolicyRoute slug="shipping" /> },
      { path: 'returns', element: <PolicyRoute slug="returns" /> },
      { path: 'contact', element: <PolicyRoute slug="contact" /> },
      { path: 'faq', element: <PolicyRoute slug="faq" /> },
      { path: 'about', element: <PolicyRoute slug="about" /> },
      { path: 'payment', element: <PolicyRoute slug="payment" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'products', element: <AdminProducts /> },
      { path: 'photos', element: <AdminPhotos /> },
      { path: 'orders', element: <AdminOrders /> },
    ],
  },
])
