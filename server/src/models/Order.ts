import mongoose, { type Document, Schema, type Types } from 'mongoose'

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentMethod = 'cod' | 'whish' | 'whatsapp'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface IOrderItem {
  productId: Types.ObjectId
  name: string
  price: number
  quantity: number
  size: string
  color: string
}

export interface IOrder extends Document {
  userId: Types.ObjectId
  items: IOrderItem[]
  subtotal: number
  shipping: number
  total: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  whishCheckoutUrl?: string
  shippingAddress: {
    fullName: string
    line1: string
    city: string
    country: string
    postalCode: string
    phone?: string
  }
  createdAt: Date
  updatedAt: Date
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, min: 1 },
      size: { type: String, required: true },
      color: { type: String, required: true },
    }],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'whish', 'whatsapp'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    whishCheckoutUrl: { type: String },
    shippingAddress: {
      fullName: { type: String, required: true },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
      phone: { type: String },
    },
  },
  { timestamps: true },
)

orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ status: 1 })

export const Order = mongoose.model<IOrder>('Order', orderSchema)
