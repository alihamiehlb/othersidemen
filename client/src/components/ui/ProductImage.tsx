import { useState } from 'react'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'
import { resolveProductImageSrc } from '@/utils/productImageUrl'

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
  const resolved = resolveProductImageSrc(src)

  if (!resolved || failed) {
    return (
      <div className={containerClassName}>
        <ImagePlaceholder alt={alt} />
      </div>
    )
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
    />
  )
}
