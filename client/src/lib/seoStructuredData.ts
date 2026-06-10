import { SITE_URL } from '@/config/site'
import { BUSINESS, DEFAULT_DESCRIPTION } from '@/config/seo'
import { absoluteAssetUrl } from '@/utils/productImageUrl'

export interface BreadcrumbItem {
  name: string
  path: string
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BUSINESS.legalName,
    alternateName: 'OTHER SIDE Men',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon-32.png`,
    description: DEFAULT_DESCRIPTION,
    email: BUSINESS.email,
    sameAs: [BUSINESS.instagram],
    address: {
      '@type': 'PostalAddress',
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.countryCode,
    },
  }
}

export function buildClothingStoreJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: BUSINESS.legalName,
    url: SITE_URL,
    image: `${SITE_URL}/images/hero.webp`,
    description: DEFAULT_DESCRIPTION,
    priceRange: '$$',
    currenciesAccepted: BUSINESS.currency,
    paymentAccepted: BUSINESS.payments.join(', '),
    address: {
      '@type': 'PostalAddress',
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.countryCode,
    },
    sameAs: [BUSINESS.instagram],
  }
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BUSINESS.legalName,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@type': 'Organization', name: BUSINESS.legalName },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/shop?category={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
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
  const imageUrl = absoluteAssetUrl(product.images?.[0])

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? product.name,
    image: imageUrl,
    url: `${SITE_URL}/product/${product.slug}`,
    brand: { '@type': 'Brand', name: BUSINESS.legalName },
    ...(product.category ? { category: product.category } : {}),
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: BUSINESS.currency,
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/product/${product.slug}`,
      seller: { '@type': 'Organization', name: BUSINESS.legalName },
    },
  }
}

export function buildItemListJsonLd(
  items: { name: string; slug: string }[],
  listName = "OTHER SIDE Men's Collection",
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/product/${item.slug}`,
      name: item.name,
    })),
  }
}

export function buildFaqJsonLd(sections: { heading: string; body: string[] }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sections.map((section) => ({
      '@type': 'Question',
      name: section.heading,
      acceptedAnswer: {
        '@type': 'Answer',
        text: section.body.join(' '),
      },
    })),
  }
}
