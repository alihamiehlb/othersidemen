interface AdminPaginationProps {
  page: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export function AdminPagination({ page, total, limit, onPageChange }: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  if (totalPages <= 1) return null

  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <p className="text-[10px] uppercase tracking-widest text-brand-muted">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="border border-theme-subtle px-3 py-1 text-[10px] uppercase tracking-widest disabled:opacity-40"
        >
          Prev
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="border border-theme-subtle px-3 py-1 text-[10px] uppercase tracking-widest disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}
