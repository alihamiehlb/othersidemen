/** Group key for same-outfit multi-shot slugs like os-2023-11-17-01 → 2023-11-17 */
export function lookGroupKey(slug: string): string {
  const m = String(slug).match(/^os-(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : slug
}

export function lookGroupSlugPrefix(key: string): RegExp {
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return new RegExp(`^os-${key}-`)
  }
  return new RegExp(`^${escapeRegex(key)}$`)
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function collectLookGroupImages(
  slug: string,
  ownImages: string[],
  findSiblings: (slugPrefix: RegExp) => Promise<{ images: string[] }[]>,
): Promise<string[]> {
  const key = lookGroupKey(slug)
  const prefix = lookGroupSlugPrefix(key)
  const siblings = await findSiblings(prefix)
  const merged = [...ownImages]
  for (const s of siblings) {
    for (const img of s.images ?? []) {
      if (img && !merged.includes(img)) merged.push(img)
    }
  }
  return merged
}
