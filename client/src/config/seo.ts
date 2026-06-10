import { SITE_URL } from '@/config/site'

export const SITE_NAME = 'OTHER SIDE'
export const SITE_TAGLINE = 'Two sides. One identity.'

export const DEFAULT_DESCRIPTION =
  "OTHER SIDE Men — Premium men's streetwear in Lebanon and worldwide. Shop 791+ curated looks: jackets, hoodies, sneakers, and accessories."

export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/hero.webp`

/** Geographic and business entity facts for SEO + GEO */
export const BUSINESS = {
  legalName: 'OTHER SIDE',
  tagline: SITE_TAGLINE,
  email: 'support@otherside.com',
  locality: 'Baabda',
  region: 'Mount Lebanon',
  country: 'Lebanon',
  countryCode: 'LB',
  currency: 'USD',
  languages: ['en', 'ar'],
  instagram: 'https://instagram.com/othersidemen',
  catalogSize: 791,
  categories: ['looks', 'outerwear', 'tops', 'bottoms', 'footwear', 'accessories'] as const,
  payments: ['Cash on Delivery (COD)', 'WhatsApp order confirmation', 'Whish Pay (Lebanon)'],
}
