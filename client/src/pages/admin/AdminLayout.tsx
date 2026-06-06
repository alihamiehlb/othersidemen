import { Navigate, Outlet } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { SeoHead } from '@/components/seo/SeoHead'
import { useAuth } from '@/contexts/AuthContext'

export function AdminLayout() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen message="Loading admin" />
  if (!user) return <Navigate to="/login?redirect=/admin" replace />
  if (user.role !== 'admin') return <Navigate to="/account" replace />

  return (
    <>
      <SeoHead title="Admin" noindex canonicalPath="/admin" />
    <div className="min-h-screen bg-brand-black text-brand-white">
      <div className="lg:flex">
        <AdminSidebar />
        <main className="min-h-screen flex-1 lg:pl-64">
          <div className="border-b border-theme-border px-6 py-4 lg:hidden">
            <p className="text-[10px] uppercase tracking-widest text-brand-muted">
              Signed in as {user.email}
            </p>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
    </>
  )
}
