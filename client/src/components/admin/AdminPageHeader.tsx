import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-[10px] uppercase tracking-widest text-brand-muted">{description}</p>
        )}
      </div>
      {actions}
    </div>
  )
}
