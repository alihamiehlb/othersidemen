import mongoose, { type Document, Schema } from 'mongoose'

export interface IProduct extends Document {
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number
  category: string
  gender: 'men'
  images: string[]
  sizes: string[]
  colors: string[]
  stock: number
  isActive: boolean
  isFeatured: boolean
  tags: string[]
  instagramUrl?: string
  sourceId?: string
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    category: { type: String, required: true },
    gender: { type: String, enum: ['men'], default: 'men' },
    images: [{ type: String }],
    sizes: [{ type: String }],
    colors: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String }],
    instagramUrl: { type: String },
    sourceId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
)

productSchema.index({ category: 1, isActive: 1 })
productSchema.index({ isFeatured: 1 })
productSchema.index({ name: 'text', description: 'text' })

export const Product = mongoose.model<IProduct>('Product', productSchema)
