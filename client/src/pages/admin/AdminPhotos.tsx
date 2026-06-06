import { useCallback, useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { LookGroupCard, type LookGroupRow } from '@/components/admin/LookGroupCard'
import { ProductEditor } from '@/components/admin/ProductEditor'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { api } from '@/lib/api'

export function AdminPhotos() {
  const [groups, setGroups] = useState<LookGroupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [editorId, setEditorId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '24' })
    if (category) params.set('category', category)
    if (search) params.set('search', search)
    api<LookGroupRow[]>(`/api/admin/look-groups?${params}`).then((res) => {
      if (res.success && res.data) setGroups(res.data)
      setTotal(Number(res.meta?.total ?? 0))
      setLoading(false)
    })
  }, [page, category, search])

  useEffect(() => { load() }, [load])

  async function mergeGroup(key: string) {
    if (!window.confirm('Merge all shots in this look into the primary product gallery?')) return
    const res = await api(`/api/admin/look-groups/${encodeURIComponent(key)}/merge`, { method: 'POST' })
    if (res.success) load()
    else alert(res.error ?? 'Merge failed')
  }

  if (loading && groups.length === 0) return <LoadingScreen message="Loading photos" />

  return (
    <div className="page-enter px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Photos"
        description={`${total} look groups · same outfit, different shots in slides`}
        actions={
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="admin-field border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {['looks', 'tops', 'bottoms', 'outerwear', 'footwear', 'accessories'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        }
      />

      <div className="mb-6">
        <input
          type="search"
          placeholder="Search looks..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="admin-field w-full max-w-md border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-6">
        {groups.map((g) => (
          <LookGroupCard
            key={g.key}
            group={g}
            onEdit={setEditorId}
            onMerge={mergeGroup}
          />
        ))}
      </div>

      {groups.length === 0 && (
        <p className="mt-8 text-sm text-theme-secondary">No look groups in this category.</p>
      )}

      <AdminPagination page={page} total={total} limit={24} onPageChange={setPage} />

      {editorId && (
        <ProductEditor
          productId={editorId}
          onClose={() => setEditorId(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
