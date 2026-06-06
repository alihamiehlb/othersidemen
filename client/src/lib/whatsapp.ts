interface WhatsAppOrder {
  name: string
  price: number
  size: string
  color: string
  slug: string
}

export function getWhatsAppNumber(): string | null {
  const raw = import.meta.env.VITE_WHATSAPP_NUMBER?.trim()
  if (!raw) return null
  return raw.replace(/\D/g, '')
}

export function buildWhatsAppOrderUrl(order: WhatsAppOrder): string | null {
  const phone = getWhatsAppNumber()
  if (!phone) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const message = [
    'Hi OTHER SIDE, I would like to order:',
    '',
    `*${order.name}*`,
    `Size: ${order.size}`,
    `Color: ${order.color}`,
    `Price: $${order.price.toFixed(2)}`,
    origin ? `Link: ${origin}/product/${order.slug}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
