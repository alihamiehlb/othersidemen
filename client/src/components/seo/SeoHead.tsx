import { useEffect } from 'react'
import { SITE_URL } from '@/config/site'
import { absoluteAssetUrl } from '@/utils/productImageUrl'

export interface SeoHeadProps {
  title: string
  description?: string
  /** Path only, e.g. `/shop` — combined with SITE_URL for canonical/og:url */
  canonicalPath?: string
  ogImage?: string
  ogType?: 'website' | 'product' | 'article'
  noindex?: boolean
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

const DEFAULT_DESCRIPTION =
  "OTHER SIDE Men — Premium men's streetwear. Two sides. One identity. Shop jackets, hoodies, sneakers and more."
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/hero.webp`

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  const id = 'seo-json-ld'
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function removeJsonLd() {
  document.getElementById('seo-json-ld')?.remove()
}

export function SeoHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = '/',
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  jsonLd,
}: SeoHeadProps) {
  useEffect(() => {
    const canonical = `${SITE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
    const fullTitle = title.includes('OTHER SIDE') ? title : `${title} | OTHER SIDE`

    document.title = fullTitle
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', ogType)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', absoluteAssetUrl(ogImage))
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', absoluteAssetUrl(ogImage))
    upsertLink('canonical', canonical)

    if (jsonLd) {
      upsertJsonLd(jsonLd)
    } else {
      removeJsonLd()
    }

    return () => {
      removeJsonLd()
    }
  }, [title, description, canonicalPath, ogImage, ogType, noindex, jsonLd ? JSON.stringify(jsonLd) : ''])

  return null
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'OTHER SIDE',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon-32.png`,
    description: DEFAULT_DESCRIPTION,
  }
}

export function buildProductJsonLd(product: {
  name: string
  slug: string
  description?: string
  price: number
  images?: string[]
  category?: string
}) {
  const image = product.images?.[0]
  const imageUrl = absoluteAssetUrl(image)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? product.name,
    image: imageUrl,
    url: `${SITE_URL}/product/${product.slug}`,
    brand: { '@type': 'Brand', name: 'OTHER SIDE' },
    ...(product.category ? { category: product.category } : {}),
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/product/${product.slug}`,
    },
  }
}
