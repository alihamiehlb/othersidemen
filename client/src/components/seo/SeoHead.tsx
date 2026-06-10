import { useEffect } from 'react'
import { SITE_URL } from '@/config/site'
import { BUSINESS, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME } from '@/config/seo'
import { absoluteAssetUrl } from '@/utils/productImageUrl'

export {
  buildBreadcrumbJsonLd,
  buildClothingStoreJsonLd,
  buildFaqJsonLd,
  buildItemListJsonLd,
  buildOrganizationJsonLd,
  buildProductJsonLd,
  buildWebSiteJsonLd,
} from '@/lib/seoStructuredData'

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
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`

    document.title = fullTitle
    document.documentElement.lang = 'en'

    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
    upsertMeta('name', 'geo.region', BUSINESS.countryCode)
    upsertMeta('name', 'geo.placename', `${BUSINESS.locality}, ${BUSINESS.country}`)
    upsertMeta('name', 'geo.position', '33.8339;35.5444')
    upsertMeta('name', 'ICBM', '33.8339, 35.5444')

    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', ogType)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', absoluteAssetUrl(ogImage))
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:locale', 'en_US')

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
