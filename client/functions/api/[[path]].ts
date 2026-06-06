/**
 * Proxies /api/* to the Cloudflare Workers API (same-origin cookies + OAuth).
 * _redirects alone is unreliable on Pages SPA deploys; Functions run first.
 */
const API_ORIGIN = 'https://twoside-store-api.alihamiehlb.workers.dev'

export async function onRequest(context: { request: Request }): Promise<Response> {
  const url = new URL(context.request.url)
  const target = `${API_ORIGIN}${url.pathname}${url.search}`

  const headers = new Headers(context.request.headers)
  headers.delete('host')

  const init: RequestInit = {
    method: context.request.method,
    headers,
    redirect: 'manual',
  }

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = context.request.body
  }

  return fetch(target, init)
}
