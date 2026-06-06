/** Clean Instagram-imported titles for storefront display */
export function displayProductName(name: string): string {
  const cleaned = name
    .replace(/^["'""]+|["'""]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  if (!cleaned || cleaned.length < 2) return 'Otherside Look'
  if (cleaned.length > 72) return `${cleaned.slice(0, 69)}…`
  return cleaned
}

/** Strip Instagram "Posted:" timestamps and excess hashtags from descriptions */
export function displayProductDescription(description: string): string {
  return description
    .replace(/\s*Posted:\s*\d{4}-\d{2}-\d{2}[\d:\s-]*/gi, '')
    .replace(/#\S+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function defaultSizes(category?: string, sizes?: string[]): string[] {
  if (sizes?.length) return sizes
  if (category === 'footwear') return ['7', '8', '9', '10', '11', '12']
  if (category === 'accessories') return ['One Size']
  if (category === 'looks') return ['One Size']
  return ['S', 'M', 'L', 'XL']
}

export function defaultColors(category?: string, colors?: string[]): string[] {
  if (category === 'looks') return ['As shown']
  if (colors?.length) return colors
  return ['Default']
}
