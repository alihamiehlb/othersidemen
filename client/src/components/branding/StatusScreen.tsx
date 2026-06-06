import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Info } from 'lucide-react'
import { AnimatedLogo } from '@/components/branding/AnimatedLogo'
import { Button } from '@/components/ui/Button'

type StatusVariant = 'success' | 'error' | 'info'

interface StatusScreenProps {
  variant?: StatusVariant
  title: string
  message: string
  primaryAction?: { label: string; href: string }
  secondaryAction?: { label: string; href: string }
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const accent = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-brand-light',
}

export function StatusScreen({
  variant = 'info',
  title,
  message,
  primaryAction,
  secondaryAction,
}: StatusScreenProps) {
  const Icon = icons[variant]

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 py-20 text-center">
      <AnimatedLogo size="md" className="mb-10" />
      <Icon className={`mb-4 h-10 w-10 ${accent[variant]}`} aria-hidden="true" />
      <h1 className="mb-3 text-2xl font-black uppercase tracking-tight sm:text-3xl">{title}</h1>
      <p className="mb-10 max-w-md text-sm leading-relaxed text-brand-muted">{message}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {primaryAction && (
          <Link to={primaryAction.href}>
            <Button variant="solid">{primaryAction.label}</Button>
          </Link>
        )}
        {secondaryAction && (
          <Link to={secondaryAction.href}>
            <Button variant="outline">{secondaryAction.label}</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
