import { Router } from 'express'
import mongoose from 'mongoose'
import { ensureDbConnected } from '../config/db.js'
import { cacheGet, cacheSet } from '../config/redis.js'
import { Product } from '../models/Product.js'
import { productPublicFilter } from '../policies/accessPolicies.js'
import { sendError, sendSuccess } from '../utils/apiResponse.js'
import { lookGroupKey, lookGroupSlugPrefix } from '../utils/lookGroup.js'

export const productsRouter = Router()

const CACHE_TTL = 300

productsRouter.get('/', async (req, res) => {
  if (!(await ensureDbConnected())) {
    sendError(res, 'Store is starting up. Please try again.', 503)
    return
  }

  const { category, featured, search, page = '1', limit = '20' } = req.query
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
  const limitNum = Math.min(48, Math.max(1, parseInt(limit as string, 10) || 20))
  const cacheKey = `products:${category}:${featured}:${search}:${pageNum}:${limitNum}`

  const cached = await cacheGet<{ products: unknown[]; total: number }>(cacheKey)
  if (cached) {
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    sendSuccess(res, cached.products, 200, { total: cached.total, page: pageNum, limit: limitNum })
    return
  }

  const filter: Record<string, unknown> = { ...productPublicFilter() }
  if (category) filter.category = category
  if (featured === 'true') filter.isFeatured = true
  if (search) filter.$text = { $search: search as string }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter),
  ])

  await cacheSet(cacheKey, { products, total }, CACHE_TTL)
  res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  sendSuccess(res, products, 200, { total, page: pageNum, limit: limitNum })
})

productsRouter.get('/:slug', async (req, res) => {
  if (!(await ensureDbConnected())) {
    sendError(res, 'Store is starting up. Please try again.', 503)
    return
  }

  if (mongoose.Types.ObjectId.isValid(req.params.slug)) {
    sendError(res, 'Product not found', 404)
    return
  }

  const cacheKey = `product:${req.params.slug}`
  const cached = await cacheGet<unknown>(cacheKey)
  if (cached) {
    res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')
    sendSuccess(res, cached)
    return
  }

  const product = await Product.findOne({ slug: req.params.slug, ...productPublicFilter() })
    .select('-__v')
    .lean()

  if (!product) {
    sendError(res, 'Product not found', 404)
    return
  }

  const prefix = lookGroupSlugPrefix(lookGroupKey(product.slug))
  const siblings = await Product.find({ slug: { $regex: prefix }, ...productPublicFilter() })
    .select('images')
    .lean()
  const mergedImages = [...product.images]
  for (const s of siblings) {
    for (const img of s.images ?? []) {
      if (img && !mergedImages.includes(img)) mergedImages.push(img)
    }
  }
  const enriched = mergedImages.length > product.images.length
    ? { ...product, images: mergedImages }
    : product

  await cacheSet(cacheKey, enriched, CACHE_TTL)
  res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')
  sendSuccess(res, enriched)
})
