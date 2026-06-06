interface AdminStatCardProps {
  label: string
  value: string | number
  hint?: string
}

export function AdminStatCard({ label, value, hint }: AdminStatCardProps) {
  return (
    <div className="rounded border border-theme-subtle bg-brand-dark/40 p-5">
      <p className="text-[10px] uppercase tracking-widest text-brand-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[10px] text-brand-muted">{hint}</p>}
    </div>
  )
}
