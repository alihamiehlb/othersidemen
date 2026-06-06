import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface SectionHeaderProps {
  eyebrow: string
  title: string
  description?: string
  linkTo?: string
  linkLabel?: string
  id?: string
}

export function SectionHeader({ eyebrow, title, description, linkTo, linkLabel, id }: SectionHeaderProps) {
  let link: ReactNode = null
  if (linkTo && linkLabel) {
    link = (
      <Link to={linkTo} className="section-link inline-flex min-h-[44px] items-center gap-2 self-start sm:self-auto">
        {linkLabel}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    )
  }

  return (
    <div className="section-header mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between lg:mb-12">
      <div className="max-w-xl">
        <p className="section-eyebrow">{eyebrow}</p>
        <h2 id={id} className="section-title">
          {title}
        </h2>
        {description && <p className="section-desc">{description}</p>}
      </div>
      {link}
    </div>
  )
}
