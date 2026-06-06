import { useCallback, useState } from 'react'
import type { ProductCardData } from '@/components/ui/ProductCard'
import type { ProductDetail } from '@/components/ui/ProductModal'
import { defaultColors, defaultSizes } from '@/lib/productDisplay'
import { api } from '@/lib/api'

function toDetail(product: ProductCardData): ProductDetail {
  return {
    ...product,
    sizes: defaultSizes(product.category, product.sizes),
    colors: defaultColors(product.category, product.colors),
  }
}

export function useProductModal() {
  const [selected, setSelected] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const openProduct = useCallback(async (product: ProductCardData) => {
    setSelected(toDetail(product))
    setLoading(true)
    const res = await api<ProductDetail>(`/api/products/${encodeURIComponent(product.slug)}`, {}, 2)
    setLoading(false)
    if (res.success && res.data) {
      setSelected({
        ...res.data,
        _id: res.data._id ?? product._id,
        sizes: defaultSizes(res.data.category, res.data.sizes),
        colors: defaultColors(res.data.category, res.data.colors),
      })
    }
  }, [])

  const closeProduct = useCallback(() => {
    setSelected(null)
    setLoading(false)
  }, [])

  return { selected, loading, openProduct, closeProduct }
}
