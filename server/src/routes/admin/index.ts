import { Router } from 'express'

import bcrypt from 'bcryptjs'
import { z } from 'zod'

import type { AuthRequest } from '../../middleware/auth.js'

import { requireAdmin } from '../../middleware/auth.js'

import { adminLimiter } from '../../middleware/rateLimit.js'

import { Order } from '../../models/Order.js'

import { Product } from '../../models/Product.js'

import { User } from '../../models/User.js'

import { validateObjectId } from '../../middleware/validateObjectId.js'

import { sendError, sendSuccess } from '../../utils/apiResponse.js'

import { asyncHandler } from '../../utils/asyncHandler.js'

import { invalidateProductCache } from '../../utils/invalidateProductCache.js'
import { escapeRegex } from '../../utils/escapeRegex.js'
import { lookGroupKey, lookGroupSlugPrefix } from '../../utils/lookGroup.js'



export const adminRouter = Router()



adminRouter.use(adminLimiter)

adminRouter.use(asyncHandler(requireAdmin as (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<void>))



const imagePathSchema = z.string().min(1).max(500).refine(

  (val) => val.startsWith('/images/') || val.startsWith('https://'),

  { message: 'Image must be a local /images/ path or https URL' },

)



const productSchema = z.object({

  name: z.string().min(1).max(200),

  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),

  description: z.string().max(2000).default(''),

  price: z.number().min(0).max(100000),

  compareAtPrice: z.number().min(0).max(100000).optional(),

  category: z.enum(['looks', 'tops', 'bottoms', 'outerwear', 'footwear', 'accessories']),

  images: z.array(imagePathSchema).max(10).default([]),

  sizes: z.array(z.string().max(20)).max(20).default([]),

  colors: z.array(z.string().max(50)).max(20).default([]),

  stock: z.number().int().min(0).max(100000).default(0),

  isActive: z.boolean().default(true),

  isFeatured: z.boolean().default(false),

  tags: z.array(z.string().max(50)).max(30).default([]),

  instagramUrl: z.string().url().max(500).optional().or(z.literal('')),

})



function paymentStatusForOrderStatus(status: string): string {

  if (status === 'paid' || status === 'shipped' || status === 'delivered') return 'paid'

  if (status === 'cancelled') return 'failed'

  return 'pending'

}

function parsePageLimit(req: { query: Record<string, unknown> }, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(req.query.limit ?? defaultLimit), 10) || defaultLimit))
  return { page, limit }
}



adminRouter.get('/stats', async (_req, res) => {

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)



  const [totalUsers, activeUsers, totalProducts, totalOrders, revenue, recentOrders, newUsers] = await Promise.all([

    User.countDocuments(),

    User.countDocuments({ isActive: true }),

    Product.countDocuments({ isActive: true }),

    Order.countDocuments(),

    Order.aggregate([

      { $match: { status: { $in: ['paid', 'shipped', 'delivered'] } } },

      { $group: { _id: null, total: { $sum: '$total' } } },

    ]),

    Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

  ])



  sendSuccess(res, {

    totalUsers,

    activeUsers,

    totalProducts,

    totalOrders,

    revenue: revenue[0]?.total ?? 0,

    recentOrders,

    newUsers,

  })

})



adminRouter.get('/users', async (req, res) => {

  const { page, limit } = parsePageLimit(req)

  const search = (req.query.search as string)?.trim()

  const role = req.query.role as string | undefined



  const filter: Record<string, unknown> = {}

  if (role === 'user' || role === 'admin') filter.role = role

  if (search) {

    const safe = escapeRegex(search)

    filter.$or = [

      { email: { $regex: safe, $options: 'i' } },

      { name: { $regex: safe, $options: 'i' } },

    ]

  }



  const [users, total] = await Promise.all([

    User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),

    User.countDocuments(filter),

  ])

  sendSuccess(res, users, 200, { total, page, limit })

})



adminRouter.patch('/users/:id', validateObjectId(), async (req: AuthRequest, res) => {

  const schema = z.object({

    role: z.enum(['user', 'admin']).optional(),

    isActive: z.boolean().optional(),

  })

  const parsed = schema.safeParse(req.body)

  if (!parsed.success) {

    sendError(res, 'Invalid input', 400)

    return

  }



  if (req.params.id === req.userId) {

    if (parsed.data.role === 'user') {

      sendError(res, 'Cannot demote yourself', 400)

      return

    }

    if (parsed.data.isActive === false) {

      sendError(res, 'Cannot deactivate yourself', 400)

      return

    }

  }



  if (parsed.data.role === 'user') {

    const adminCount = await User.countDocuments({ role: 'admin', isActive: true })

    const target = await User.findById(req.params.id)

    if (target?.role === 'admin' && adminCount <= 1) {

      sendError(res, 'Cannot demote the last admin', 400)

      return

    }

  }



  const user = await User.findByIdAndUpdate(req.params.id, parsed.data, { new: true }).select('-passwordHash')

  if (!user) {

    sendError(res, 'User not found', 404)

    return

  }

  sendSuccess(res, user)

})

adminRouter.patch('/users/:id/password', validateObjectId(), async (req: AuthRequest, res) => {
  const schema = z.object({ password: z.string().min(8).max(128) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, 'Password must be 8–128 characters', 400)
    return
  }

  const user = await User.findById(req.params.id)
  if (!user) {
    sendError(res, 'User not found', 404)
    return
  }

  user.passwordHash = await bcrypt.hash(parsed.data.password, 12)
  await user.save()
  sendSuccess(res, { message: 'Password updated' })
})

adminRouter.delete('/users/:id', validateObjectId(), async (req: AuthRequest, res) => {
  if (req.params.id === req.userId) {
    sendError(res, 'Cannot delete yourself', 400)
    return
  }

  const target = await User.findById(req.params.id)
  if (!target) {
    sendError(res, 'User not found', 404)
    return
  }

  if (target.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin', isActive: true })
    if (adminCount <= 1) {
      sendError(res, 'Cannot delete the last admin', 400)
      return
    }
  }

  await User.findByIdAndDelete(req.params.id)
  sendSuccess(res, { message: 'User deleted' })
})



adminRouter.get('/products', async (req, res) => {

  const { page, limit } = parsePageLimit(req, 50, 100)

  const search = (req.query.search as string)?.trim()

  const category = req.query.category as string | undefined



  const filter: Record<string, unknown> = {}

  if (category) filter.category = category

  if (search) {

    const safe = escapeRegex(search)

    filter.$or = [

      { name: { $regex: safe, $options: 'i' } },

      { slug: { $regex: safe, $options: 'i' } },

    ]

  }



  const [products, total] = await Promise.all([

    Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),

    Product.countDocuments(filter),

  ])

  sendSuccess(res, products, 200, { total, page, limit })

})



adminRouter.get('/products/:id', validateObjectId(), async (req, res) => {

  const product = await Product.findById(req.params.id).lean()

  if (!product) {

    sendError(res, 'Product not found', 404)

    return

  }

  sendSuccess(res, product)

})



adminRouter.post('/products', async (req, res) => {

  const parsed = productSchema.safeParse(req.body)

  if (!parsed.success) {

    sendError(res, parsed.error.issues[0]?.message ?? 'Invalid input', 400)

    return

  }

  const data = {

    ...parsed.data,

    gender: 'men' as const,

    instagramUrl: parsed.data.instagramUrl || undefined,

  }

  const product = await Product.create(data)

  await invalidateProductCache()

  sendSuccess(res, product, 201)

})



adminRouter.patch('/products/:id', validateObjectId(), async (req, res) => {

  const parsed = productSchema.partial().safeParse(req.body)

  if (!parsed.success) {

    sendError(res, parsed.error.issues[0]?.message ?? 'Invalid input', 400)

    return

  }

  const update = {

    ...parsed.data,

    ...(parsed.data.instagramUrl === '' ? { instagramUrl: undefined } : {}),

  }

  const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true })

  if (!product) {

    sendError(res, 'Product not found', 404)

    return

  }

  await invalidateProductCache(product.slug)

  sendSuccess(res, product)

})



adminRouter.delete('/products/:id', validateObjectId(), async (req, res) => {

  const permanent = req.query.permanent === 'true'

  if (permanent) {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      sendError(res, 'Product not found', 404)
      return
    }
    await invalidateProductCache(product.slug)
    sendSuccess(res, { message: 'Product permanently deleted' })
    return
  }

  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })

  if (!product) {

    sendError(res, 'Product not found', 404)

    return

  }

  await invalidateProductCache(product.slug)

  sendSuccess(res, { message: 'Product deactivated' })

})

adminRouter.get('/look-groups', async (req, res) => {
  const { page, limit } = parsePageLimit(req, 24, 48)
  const category = req.query.category as string | undefined
  const search = (req.query.search as string)?.trim()

  const filter: Record<string, unknown> = {}
  if (category) filter.category = category
  if (search) {
    const safe = escapeRegex(search)
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { slug: { $regex: safe, $options: 'i' } },
    ]
  }

  const products = await Product.find(filter)
    .select('name slug price category images isActive tags description')
    .sort({ createdAt: -1 })
    .lean()

  type GroupRow = {
    key: string
    primaryId: string
    primarySlug: string
    name: string
    description: string
    category: string
    price: number
    tags: string[]
    isActive: boolean
    images: string[]
    slugs: string[]
    productIds: string[]
  }

  const groupsMap = new Map<string, GroupRow>()
  for (const p of products) {
    const key = lookGroupKey(p.slug)
    const existing = groupsMap.get(key)
    if (!existing) {
      groupsMap.set(key, {
        key,
        primaryId: String(p._id),
        primarySlug: p.slug,
        name: p.name,
        description: p.description ?? '',
        category: p.category,
        price: p.price,
        tags: p.tags ?? [],
        isActive: p.isActive,
        images: [...(p.images ?? [])],
        slugs: [p.slug],
        productIds: [String(p._id)],
      })
      continue
    }
    existing.slugs.push(p.slug)
    existing.productIds.push(String(p._id))
    for (const img of p.images ?? []) {
      if (img && !existing.images.includes(img)) existing.images.push(img)
    }
  }

  const groups = Array.from(groupsMap.values())
  const total = groups.length
  const slice = groups.slice((page - 1) * limit, page * limit)
  sendSuccess(res, slice, 200, { total, page, limit })
})

adminRouter.post('/look-groups/:key/merge', async (req, res) => {
  const key = req.params.key
  const prefix = lookGroupSlugPrefix(key)
  const siblings = await Product.find({ slug: { $regex: prefix } }).sort({ slug: 1 }).lean()
  if (siblings.length === 0) {
    sendError(res, 'Look group not found', 404)
    return
  }

  const primary = siblings[0]
  const mergedImages = [...(primary.images ?? [])]
  for (const s of siblings.slice(1)) {
    for (const img of s.images ?? []) {
      if (img && !mergedImages.includes(img)) mergedImages.push(img)
    }
  }

  await Product.findByIdAndUpdate(primary._id, { images: mergedImages })
  await invalidateProductCache(primary.slug)
  sendSuccess(res, { primarySlug: primary.slug, images: mergedImages, mergedCount: siblings.length })
})



adminRouter.get('/orders', async (req, res) => {

  const { page, limit } = parsePageLimit(req)

  const status = req.query.status as string | undefined



  const filter: Record<string, unknown> = {}

  if (status && ['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {

    filter.status = status

  }



  const [orders, total] = await Promise.all([

    Order.find(filter).populate('userId', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),

    Order.countDocuments(filter),

  ])

  sendSuccess(res, orders, 200, { total, page, limit })

})



adminRouter.get('/orders/:id', validateObjectId(), async (req, res) => {

  const order = await Order.findById(req.params.id).populate('userId', 'name email').lean()

  if (!order) {

    sendError(res, 'Order not found', 404)

    return

  }

  sendSuccess(res, order)

})



adminRouter.patch('/orders/:id/status', validateObjectId(), async (req, res) => {

  const schema = z.object({ status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']) })

  const parsed = schema.safeParse(req.body)

  if (!parsed.success) {

    sendError(res, 'Invalid status', 400)

    return

  }



  const paymentStatus = paymentStatusForOrderStatus(parsed.data.status)

  const order = await Order.findByIdAndUpdate(

    req.params.id,

    { status: parsed.data.status, paymentStatus },

    { new: true },

  ).populate('userId', 'name email')



  if (!order) {

    sendError(res, 'Order not found', 404)

    return

  }

  sendSuccess(res, order)

})

adminRouter.delete('/orders/:id', validateObjectId(), async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id)
  if (!order) {
    sendError(res, 'Order not found', 404)
    return
  }
  sendSuccess(res, { message: 'Order deleted' })
})

