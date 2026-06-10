interface WhatsAppOrder {
  size: string
  color: string
  slug: string
}

/** Same-origin API redirect — server loads price/name from DB (not query params). */
export function buildWhatsAppOrderUrl(order: WhatsAppOrder): string {
  const params = new URLSearchParams({
    size: order.size,
    color: order.color,
    slug: order.slug,
  })
  return `/api/whatsapp/order?${params.toString()}`
}
