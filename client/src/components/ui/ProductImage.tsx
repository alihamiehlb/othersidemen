import { useCallback, useState } from 'react'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'
import { productImageOriginCount, resolveProductImageSrc } from '@/utils/productImageUrl'

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
  const [originIndex, setOriginIndex] = useState(0)
  const maxOrigins = productImageOriginCount(src)
  const failed = originIndex >= maxOrigins
  const resolved = resolveProductImageSrc(src, originIndex)

  const handleError = useCallback(() => {
    setOriginIndex((prev) => prev + 1)
  }, [])

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
      onError={handleError}
      className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
    />
  )
}
