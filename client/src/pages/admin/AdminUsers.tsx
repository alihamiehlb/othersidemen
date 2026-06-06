import { useCallback, useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

interface UserRow {
  _id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
}

export function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [passwordUser, setPasswordUser] = useState<UserRow | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)
    api<UserRow[]>(`/api/admin/users?${params}`).then((res) => {
      if (res.success && res.data) setUsers(res.data)
      setTotal(Number(res.meta?.total ?? 0))
      setLoading(false)
    })
  }, [page, search, roleFilter])

  useEffect(() => { load() }, [load])

  async function patchUser(id: string, data: { isActive?: boolean; role?: string }) {
    const res = await api(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    if (res.success) load()
    else alert(res.error ?? 'Update failed')
  }

  async function deleteUser(u: UserRow) {
    if (!window.confirm(`Delete ${u.email}? This cannot be undone.`)) return
    const res = await api(`/api/admin/users/${u._id}`, { method: 'DELETE' })
    if (res.success) load()
    else alert(res.error ?? 'Delete failed')
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordUser) return
    setSavingPassword(true)
    setPasswordError('')
    const res = await api(`/api/admin/users/${passwordUser._id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password: newPassword }),
    })
    setSavingPassword(false)
    if (res.success) {
      setPasswordUser(null)
      setNewPassword('')
    } else {
      setPasswordError(res.error ?? 'Password update failed')
    }
  }

  if (loading && users.length === 0) return <LoadingScreen message="Loading users" />

  return (
    <div className="page-enter px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader title="Users" description={`${total} registered accounts · roles, passwords, delete`} />

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search email or name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="admin-field min-w-[200px] flex-1 border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="admin-field border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="hidden overflow-x-auto rounded border border-theme-subtle lg:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-brand-dark/60">
            <tr className="text-[10px] uppercase tracking-widest text-theme-secondary">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-brand-dark/30">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-theme-secondary">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={u._id === currentUser?.id}
                    onChange={(e) => patchUser(u._id, { role: e.target.value })}
                    className="admin-field border border-theme-subtle bg-theme-input-bg px-2 py-1 text-xs capitalize"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-[10px] text-theme-secondary">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={u.isActive ? 'text-green-500' : 'text-red-400'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {u._id !== currentUser?.id && (
                      <>
                        <button
                          type="button"
                          onClick={() => patchUser(u._id, { isActive: !u.isActive })}
                          className="text-[10px] uppercase tracking-widest text-theme-secondary hover:text-brand-white"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPasswordUser(u); setNewPassword(''); setPasswordError('') }}
                          className="text-[10px] uppercase tracking-widest hover:underline"
                        >
                          Password
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(u)}
                          className="text-[10px] uppercase tracking-widest text-red-400 hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {users.map((u) => (
          <div key={u._id} className="rounded border border-theme-subtle p-4">
            <p className="font-medium">{u.name}</p>
            <p className="text-xs text-theme-secondary">{u.email}</p>
            <p className="mt-2 text-[10px] capitalize text-theme-secondary">{u.role} · {u.isActive ? 'Active' : 'Inactive'}</p>
            {u._id !== currentUser?.id && (
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={() => { setPasswordUser(u); setNewPassword('') }} className="text-[10px] uppercase tracking-widest">Password</button>
                <button type="button" onClick={() => deleteUser(u)} className="text-[10px] uppercase tracking-widest text-red-400">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <AdminPagination page={page} total={total} limit={20} onPageChange={setPage} />

      {passwordUser && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <form
            onSubmit={submitPassword}
            className="w-full max-w-md border border-theme-subtle bg-brand-black p-5 sm:rounded-sm sm:p-6"
          >
            <h3 className="text-sm font-bold uppercase tracking-widest">Change password</h3>
            <p className="mt-1 text-xs text-theme-secondary">{passwordUser.email}</p>
            <input
              type="password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="admin-field mt-4 w-full border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
            />
            {passwordError && <p className="mt-2 text-sm text-red-400">{passwordError}</p>}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={savingPassword} className="w-full sm:w-auto">
                {savingPassword ? 'Saving...' : 'Update password'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setPasswordUser(null)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
