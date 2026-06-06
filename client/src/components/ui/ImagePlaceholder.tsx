import { resolveImage } from '@/utils/resolveImage'

interface ImagePlaceholderProps {
  imageKey?: string
  src?: string | null
  alt: string
  className?: string
  aspectRatio?: string
  label?: string
}

export function ImagePlaceholder({
  imageKey,
  src,
  alt,
  className = '',
  aspectRatio,
  label,
}: ImagePlaceholderProps) {
  const resolvedSrc = src ?? (imageKey ? resolveImage(imageKey) : null)

  const style = aspectRatio ? { aspectRatio } : undefined

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
        style={style}
        loading="lazy"
      />
    )
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-brand-gray ${className}`}
      style={style}
      role="img"
      aria-label={`${alt} — image placeholder`}
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-brand-gray via-[#222] to-brand-gray" />
      <div className="relative z-10 flex flex-col items-center gap-2 px-4 text-center">
        <svg
          className="h-8 w-8 text-brand-muted/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {label && (
          <span className="text-[10px] font-medium uppercase tracking-widest text-brand-muted/60">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
