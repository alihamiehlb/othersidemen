/** Production site URL — update when custom domain is connected */
export const SITE_URL = 'https://twoside-store.pages.dev'

/** Same-origin `/api` in production (Pages proxy). Override with VITE_API_URL for local/dev. */
export const API_URL = import.meta.env.VITE_API_URL ?? ''
