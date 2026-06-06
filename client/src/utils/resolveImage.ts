import { IMAGES } from '@/config/images'

export function resolveImage(imageKey: string): string | null {
  const parts = imageKey.split('.')
  let current: unknown = IMAGES

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return null
    }
    current = (current as Record<string, unknown>)[part]
  }

  return typeof current === 'string' ? current : null
}
