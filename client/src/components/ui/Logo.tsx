interface LogoProps {
  className?: string
  variant?: 'full' | 'compact'
  color?: 'white' | 'black'
}

export function Logo({ className = '', variant = 'full', color = 'white' }: LogoProps) {
  const fill = color === 'white' ? '#ffffff' : '#000000'

  if (variant === 'compact') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="16" fill={color === 'white' ? '#000' : '#fff'} />
        <rect x="9" y="7" width="14" height="2.5" fill={fill} />
        <text x="16" y="15.5" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="900" fontSize="4.5" fill={fill}>OTHER</text>
        <text x="16" y="20.5" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="900" fontSize="4.5" fill={fill}>SIDE</text>
      </svg>
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 72"
      fill="none"
      className={className}
      role="img"
      aria-label="OTHER SIDE"
      preserveAspectRatio="xMinYMid meet"
    >
      <rect x="18" y="0" width="52" height="8" fill={fill} />
      <text x="18" y="28" fontFamily="Inter, system-ui, sans-serif" fontWeight="900" fontSize="16" fill={fill} letterSpacing="0.5">OTHER</text>
      <text x="18" y="48" fontFamily="Inter, system-ui, sans-serif" fontWeight="900" fontSize="16" fill={fill} letterSpacing="0.5">SIDE</text>
    </svg>
  )
}
