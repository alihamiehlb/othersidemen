import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { sendError, sendSuccess } from '../../utils/apiResponse.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { processAndStoreImage } from '../../services/imageStorage.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif|heic|heif)$/i.test(file.mimetype)
    if (ok) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

const categorySchema = z.enum(['looks', 'tops', 'bottoms', 'outerwear', 'footwear', 'accessories', 'uploads'])

export const adminUploadRouter = Router()

adminUploadRouter.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file?.buffer?.length) {
      sendError(res, 'No image file provided', 400)
      return
    }

    const parsed = categorySchema.safeParse(req.body.category ?? 'uploads')
    if (!parsed.success) {
      sendError(res, 'Invalid category', 400)
      return
    }

    const slugHint = typeof req.body.slug === 'string' ? req.body.slug.slice(0, 80) : undefined

    try {
      const stored = await processAndStoreImage(req.file.buffer, parsed.data, slugHint)
      sendSuccess(res, { url: stored.url, key: stored.key }, 201)
    } catch (err) {
      sendError(res, err instanceof Error ? err.message : 'Upload failed', 400)
    }
  }),
)
