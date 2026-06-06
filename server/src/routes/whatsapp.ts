import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { Product } from '../models/Product.js'
import { sendError } from '../utils/apiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const whatsappRouter = Router()

const orderQuerySchema = z.object({
  name: z.string().min(1).max(200),
  price: z.coerce.number().positive().max(1_000_000),
  size: z.string().min(1).max(50),
  color: z.string().min(1).max(50),
  slug: z.string().min(1).max(200),
})

function whatsAppPhone(): string | null {
  const raw = env.WHATSAPP_NUMBER?.trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 8 ? digits : null
}

function buildMessage(input: z.infer<typeof orderQuerySchema>, productUrl: string): string {
  return [
    'Hi OTHER SIDE, I would like to order:',
    '',
    `*${input.name}*`,
    `Size: ${input.size}`,
    `Color: ${input.color}`,
    `Price: $${input.price.toFixed(2)}`,
    `Link: ${productUrl}`,
  ].join('\n')
}

/** Server-side redirect to WhatsApp (phone stays in Worker secrets, not client bundle). */
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

    const productUrl = `${env.CLIENT_URL}/product/${parsed.data.slug}`
    const text = buildMessage(parsed.data, productUrl)
    res.redirect(302, `https://wa.me/${phone}?text=${encodeURIComponent(text)}`)
  }),
)

/** Cart checkout summary → WhatsApp */
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

    const products = await Product.find({ _id: { $in: ids } }).select('name price slug').lean()
    if (products.length === 0) {
      sendError(res, 'Products not found', 404)
      return
    }

    const lines = products.map((p) => `• ${p.name} — $${p.price.toFixed(2)} (${env.CLIENT_URL}/product/${p.slug})`)
    const text = ['Hi OTHER SIDE, I would like to order:', '', ...lines].join('\n')
    res.redirect(302, `https://wa.me/${phone}?text=${encodeURIComponent(text)}`)
  }),
)
