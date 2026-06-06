import mongoose, { type Document, Schema } from 'mongoose'

export type UserRole = 'user' | 'admin'

export interface IUser extends Document {
  id: string
  email: string
  name: string
  avatar?: string
  googleId?: string
  passwordHash?: string
  role: UserRole
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
)

userSchema.index({ role: 1 })
userSchema.index({ createdAt: -1 })

export const User = mongoose.model<IUser>('User', userSchema)
