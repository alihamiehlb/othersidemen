import { useState } from 'react'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'

interface ProductImageProps {
  src?: string
  alt: string
  className?: string
  containerClassName?: string
  fit?: 'cover' | 'contain'
}

export function ProductImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  fit = 'cover',
}: ProductImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={containerClassName}>
        <ImagePlaceholder alt={alt} label={alt} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
    />
  )
}
