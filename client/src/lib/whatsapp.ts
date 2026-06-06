interface WhatsAppOrder {
  name: string
  price: number
  size: string
  color: string
  slug: string
}

/** Same-origin API redirect → server builds wa.me URL (phone in Worker secrets). */
export function buildWhatsAppOrderUrl(order: WhatsAppOrder): string {
  const params = new URLSearchParams({
    name: order.name,
    price: order.price.toFixed(2),
    size: order.size,
    color: order.color,
    slug: order.slug,
  })
  return `/api/whatsapp/order?${params.toString()}`
}
