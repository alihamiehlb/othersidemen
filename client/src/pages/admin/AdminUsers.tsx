import { useCallback, useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
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

  if (loading && users.length === 0) return <LoadingScreen message="Loading users" />

  return (
    <div className="px-6 py-10 lg:px-10">
      <AdminPageHeader title="Users" description={`${total} registered accounts`} />

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search email or name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="min-w-[200px] flex-1 border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded border border-theme-subtle">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-brand-dark/60">
            <tr className="text-[10px] uppercase tracking-widest text-brand-muted">
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
                <td className="px-4 py-3 text-brand-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={u._id === currentUser?.id}
                    onChange={(e) => patchUser(u._id, { role: e.target.value })}
                    className="border border-theme-subtle bg-theme-input-bg px-2 py-1 text-xs capitalize"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-[10px] text-brand-muted">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={u.isActive ? 'text-green-500' : 'text-red-400'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u._id !== currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => patchUser(u._id, { isActive: !u.isActive })}
                      className="text-[10px] uppercase tracking-widest text-brand-muted hover:text-brand-white"
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} total={total} limit={20} onPageChange={setPage} />
    </div>
  )
}
