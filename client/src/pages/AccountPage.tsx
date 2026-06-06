import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { useAuth } from '@/contexts/AuthContext'

export function AccountPage() {
  const { user, loading, logout } = useAuth()

  if (loading) return <LoadingScreen message="Loading account" />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-black uppercase tracking-tight">My Account</h1>
      <p className="mb-10 text-sm text-brand-muted">Welcome back, {user.name}</p>

      <div className="mb-8 border border-white/10 p-6">
        <p className="text-[10px] uppercase tracking-widest text-brand-muted">Email</p>
        <p className="mt-1">{user.email}</p>
        <p className="mt-4 text-[10px] uppercase tracking-widest text-brand-muted">Role</p>
        <p className="mt-1 capitalize">{user.role}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        {user.role === 'admin' && (
          <Link to="/admin">
            <Button variant="solid">Admin Panel</Button>
          </Link>
        )}
        <Button variant="outline" onClick={() => logout()}>Sign Out</Button>
      </div>
    </div>
  )
}
