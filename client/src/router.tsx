import { Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { RouteErrorScreen } from '@/components/branding/RouteErrorScreen'
import { HomePage } from '@/pages/HomePage'
import { lazyWithRetry, lazyWithRetryProps } from '@/lib/lazyWithRetry'

const ShopPage = lazyWithRetry(() => import('@/pages/ShopPage').then((m) => ({ default: m.ShopPage })))
const ProductPage = lazyWithRetry(() => import('@/pages/ProductPage').then((m) => ({ default: m.ProductPage })))
const CartPage = lazyWithRetry(() => import('@/pages/CartPage').then((m) => ({ default: m.CartPage })))
const LoginPage = lazyWithRetry(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazyWithRetry(() =>
  import('@/pages/LoginPage').then((m) => ({
    default: function SignupPageRoute() {
      return <m.LoginPage initialMode="signup" />
    },
  })),
)
const AccountPage = lazyWithRetry(() => import('@/pages/AccountPage').then((m) => ({ default: m.AccountPage })))
const OrderSuccessPage = lazyWithRetry(() => import('@/pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })))
const OrderFailedPage = lazyWithRetry(() => import('@/pages/OrderFailedPage').then((m) => ({ default: m.OrderFailedPage })))
const NotFoundPage = lazyWithRetry(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const PolicyRoute = lazyWithRetryProps<{ slug: string }>(() =>
  import('@/pages/legal/PolicyRoute').then((m) => ({ default: m.PolicyRoute })),
)
const AdminLayout = lazyWithRetry(() => import('@/pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const AdminDashboard = lazyWithRetry(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const AdminUsers = lazyWithRetry(() => import('@/pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })))
const AdminProducts = lazyWithRetry(() => import('@/pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })))
const AdminOrders = lazyWithRetry(() => import('@/pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })))
const AdminPhotos = lazyWithRetry(() => import('@/pages/admin/AdminPhotos').then((m) => ({ default: m.AdminPhotos })))

function lazyPage(element: ReactNode) {
  return <Suspense fallback={<LoadingScreen />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorScreen />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: lazyPage(<ShopPage />) },
      { path: 'product/:slug', element: lazyPage(<ProductPage />) },
      { path: 'cart', element: lazyPage(<CartPage />) },
      { path: 'order/success', element: lazyPage(<OrderSuccessPage />) },
      { path: 'order/failed', element: lazyPage(<OrderFailedPage />) },
      { path: 'login', element: lazyPage(<LoginPage />) },
      { path: 'signup', element: lazyPage(<SignupPage />) },
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
    errorElement: <RouteErrorScreen />,
    children: [
      { index: true, element: lazyPage(<AdminDashboard />) },
      { path: 'users', element: lazyPage(<AdminUsers />) },
      { path: 'products', element: lazyPage(<AdminProducts />) },
      { path: 'photos', element: lazyPage(<AdminPhotos />) },
      { path: 'orders', element: lazyPage(<AdminOrders />) },
    ],
  },
])
