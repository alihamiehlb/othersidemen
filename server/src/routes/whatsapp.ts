import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { productPublicFilter } from '../policies/accessPolicies.js'
import { Product } from '../models/Product.js'
import { sendError } from '../utils/apiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const whatsappRouter = Router()

const orderQuerySchema = z.object({
  slug: z.string().min(1).max(200),
  size: z.string().min(1).max(50),
  color: z.string().min(1).max(50),
})

function whatsAppPhone(): string | null {
  const raw = env.WHATSAPP_NUMBER?.trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 8 ? digits : null
}

function buildMessage(
  product: { name: string; price: number; slug: string },
  size: string,
  color: string,
  productUrl: string,
): string {
  return [
    'Hi OTHER SIDE, I would like to order:',
    '',
    `*${product.name}*`,
    `Size: ${size}`,
    `Color: ${color}`,
    `Price: $${product.price.toFixed(2)}`,
    `Link: ${productUrl}`,
  ].join('\n')
}

/** Server-side redirect to WhatsApp — price/name loaded from DB (not client query). */
whatsappRouter.get(
  '/order',
  asyncHandler(async (req, res) => {
    const phone = whatsAppPhone()
    if (!phone) {
      sendError(res, 'WhatsApp ordering is not configured', 503)
      return
    }

    const parsed = orderQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      sendError(res, 'Invalid order details', 400)
      return
    }

    const product = await Product.findOne({ slug: parsed.data.slug, ...productPublicFilter() })
      .select('name price slug')
      .lean()
    if (!product) {
      sendError(res, 'Product not found', 404)
      return
    }

    const productUrl = `${env.CLIENT_URL}/product/${product.slug}`
    const text = buildMessage(product, parsed.data.size, parsed.data.color, productUrl)
    res.redirect(302, `https://wa.me/${phone}?text=${encodeURIComponent(text)}`)
  }),
)

/** Cart checkout summary → WhatsApp (active products only). */
whatsappRouter.get(
  '/cart',
  asyncHandler(async (req, res) => {
    const phone = whatsAppPhone()
    if (!phone) {
      sendError(res, 'WhatsApp ordering is not configured', 503)
      return
    }

    const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',').filter(Boolean) : []
    if (ids.length === 0) {
      sendError(res, 'No items selected', 400)
      return
    }

    const products = await Product.find({ _id: { $in: ids }, ...productPublicFilter() })
      .select('name price slug')
      .lean()
    if (products.length === 0) {
      sendError(res, 'Products not found', 404)
      return
    }

    const lines = products.map((p) => `• ${p.name} — $${p.price.toFixed(2)} (${env.CLIENT_URL}/product/${p.slug})`)
    const text = ['Hi OTHER SIDE, I would like to order:', '', ...lines].join('\n')
    res.redirect(302, `https://wa.me/${phone}?text=${encodeURIComponent(text)}`)
  }),
)
