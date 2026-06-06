import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { HomePage } from '@/pages/HomePage'

const ShopPage = lazy(() => import('@/pages/ShopPage').then((m) => ({ default: m.ShopPage })))
const ProductPage = lazy(() => import('@/pages/ProductPage').then((m) => ({ default: m.ProductPage })))
const CartPage = lazy(() => import('@/pages/CartPage').then((m) => ({ default: m.CartPage })))
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const AccountPage = lazy(() => import('@/pages/AccountPage').then((m) => ({ default: m.AccountPage })))
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })))
const OrderFailedPage = lazy(() => import('@/pages/OrderFailedPage').then((m) => ({ default: m.OrderFailedPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const PolicyRoute = lazy(() => import('@/pages/legal/PolicyRoute').then((m) => ({ default: m.PolicyRoute })))
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })))
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })))
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })))
const AdminPhotos = lazy(() => import('@/pages/admin/AdminPhotos').then((m) => ({ default: m.AdminPhotos })))

function lazyPage(element: ReactNode) {
  return <Suspense fallback={<LoadingScreen />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: lazyPage(<ShopPage />) },
      { path: 'product/:slug', element: lazyPage(<ProductPage />) },
      { path: 'cart', element: lazyPage(<CartPage />) },
      { path: 'order/success', element: lazyPage(<OrderSuccessPage />) },
      { path: 'order/failed', element: lazyPage(<OrderFailedPage />) },
      { path: 'login', element: lazyPage(<LoginPage />) },
      { path: 'signup', element: lazyPage(<LoginPage initialMode="signup" />) },
      { path: 'account', element: lazyPage(<AccountPage />) },
      { path: 'privacy', element: lazyPage(<PolicyRoute slug="privacy" />) },
      { path: 'terms', element: lazyPage(<PolicyRoute slug="terms" />) },
      { path: 'cookies', element: lazyPage(<PolicyRoute slug="cookies" />) },
      { path: 'security-policy', element: lazyPage(<PolicyRoute slug="security-policy" />) },
      { path: 'shipping', element: lazyPage(<PolicyRoute slug="shipping" />) },
      { path: 'returns', element: lazyPage(<PolicyRoute slug="returns" />) },
      { path: 'contact', element: lazyPage(<PolicyRoute slug="contact" />) },
      { path: 'faq', element: lazyPage(<PolicyRoute slug="faq" />) },
      { path: 'about', element: lazyPage(<PolicyRoute slug="about" />) },
      { path: 'payment', element: lazyPage(<PolicyRoute slug="payment" />) },
      { path: '*', element: lazyPage(<NotFoundPage />) },
    ],
  },
  {
    path: '/admin',
    element: lazyPage(<AdminLayout />),
    children: [
      { index: true, element: lazyPage(<AdminDashboard />) },
      { path: 'users', element: lazyPage(<AdminUsers />) },
      { path: 'products', element: lazyPage(<AdminProducts />) },
      { path: 'photos', element: lazyPage(<AdminPhotos />) },
      { path: 'orders', element: lazyPage(<AdminOrders />) },
    ],
  },
])
