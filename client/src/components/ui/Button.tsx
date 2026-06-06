import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'solid' | 'outline' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  solid: 'bg-brand-white text-brand-black hover:bg-brand-light',
  outline: 'border border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black',
  ghost: 'text-brand-white hover:text-brand-light',
}

export function Button({
  variant = 'solid',
  children,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        btn-press inline-flex min-h-[48px] items-center justify-center rounded-2xl px-6 py-3
        text-xs font-semibold uppercase tracking-widest
        transition-all duration-200 sm:rounded-full sm:px-8
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
