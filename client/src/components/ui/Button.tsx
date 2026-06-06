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
        inline-flex items-center justify-center px-8 py-3
        text-xs font-semibold uppercase tracking-widest
        transition-colors duration-200
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
