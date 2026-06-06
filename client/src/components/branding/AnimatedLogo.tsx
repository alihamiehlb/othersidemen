import { Logo } from '@/components/ui/Logo'

interface AnimatedLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = {
  sm: 'h-10 w-[86px]',
  md: 'h-14 w-[120px]',
  lg: 'h-16 w-[140px]',
}

export function AnimatedLogo({ className = '', size = 'md' }: AnimatedLogoProps) {
  return (
    <div className={`logo-reveal ${sizeClass[size]} ${className}`} aria-hidden="true">
      <Logo className="h-full w-full" />
    </div>
  )
}
