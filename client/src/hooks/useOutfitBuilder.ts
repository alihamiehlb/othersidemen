import { useCallback, useMemo, useState } from 'react'
import { OUTFIT_ITEMS } from '@/data/mockData'
import { resolveImage } from '@/utils/resolveImage'
import type { OutfitCategory, OutfitView } from '@/types'

interface OutfitSelection {
  tops: string | null
  bottoms: string | null
  outerwear: string | null
  footwear: string | null
  accessories: string | null
}

const EMPTY_SELECTION: OutfitSelection = {
  tops: null,
  bottoms: null,
  outerwear: null,
  footwear: null,
  accessories: null,
}

export function useOutfitBuilder() {
  const [activeCategory, setActiveCategory] = useState<OutfitCategory>('tops')
  const [activeView, setActiveView] = useState<OutfitView>('front')
  const [selection, setSelection] = useState<OutfitSelection>(EMPTY_SELECTION)

  const categoryItems = useMemo(
    () => OUTFIT_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory],
  )

  const selectItem = useCallback(
    (itemId: string) => {
      setSelection((prev) => ({
        ...prev,
        [activeCategory]: prev[activeCategory] === itemId ? null : itemId,
      }))
    },
    [activeCategory],
  )

  const selectedCount = useMemo(
    () => Object.values(selection).filter(Boolean).length,
    [selection],
  )

  const previewSrc = useMemo(() => {
    const priority: OutfitCategory[] = ['outerwear', 'tops', 'bottoms', 'footwear', 'accessories']
    for (const category of priority) {
      const itemId = selection[category]
      if (!itemId) continue
      const item = OUTFIT_ITEMS.find((entry) => entry.id === itemId)
      if (item) {
        const src = resolveImage(item.imageKey)
        if (src) return src
      }
    }
    return resolveImage('outfitBuilder.preview')
  }, [selection])

  return {
    activeCategory,
    setActiveCategory,
    activeView,
    setActiveView,
    selection,
    categoryItems,
    selectItem,
    selectedCount,
    previewSrc,
  }
}
