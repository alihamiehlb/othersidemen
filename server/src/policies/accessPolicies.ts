import { randomUUID } from 'crypto'

/**
 * ACCESS CONTROL POLICIES — MongoDB equivalent of PostgreSQL RLS
 *
 * MongoDB does not have native Row Level Security. These policies are enforced
 * at the application layer on EVERY database query. Never query without scoping.
 *
 * ┌─────────────────┬──────────┬────────────────────────────────────────────┐
 * │ Resource        │ Role     │ Policy                                     │
 * ├─────────────────┼──────────┼────────────────────────────────────────────┤
 * │ users           │ user     │ READ own record only (via /api/auth/me)    │
 * │ users           │ admin    │ READ/WRITE all users (admin routes only)   │
 * │ orders          │ user     │ READ/CREATE own orders (userId filter)     │
 * │ orders          │ admin    │ READ/UPDATE all orders (admin routes)      │
 * │ products        │ public   │ READ active men's products only            │
 * │ products        │ admin    │ READ/WRITE all products (admin routes)     │
 * │ cart            │ guest    │ READ/WRITE own cart (cartId cookie only)   │
 * │ cart            │ user     │ READ/WRITE own cart (userId key only)      │
 * └─────────────────┴──────────┴────────────────────────────────────────────┘
 */

import type { IOrder } from '../models/Order.js'
import type { IUser } from '../models/User.js'

type DbFilter<T> = Partial<Record<keyof T | '_id' | 'userId', unknown>> & Record<string, unknown>

export type Role = 'user' | 'admin' | 'guest'

export interface PolicyContext {
  userId?: string
  role: Role
}

/** Users — only admins may list or modify other users */
export function userListFilter(_ctx: PolicyContext): DbFilter<IUser> {
  return {}
}

export function userReadFilter(ctx: PolicyContext, targetUserId: string): DbFilter<IUser> | null {
  if (ctx.role === 'admin') return { _id: targetUserId }
  if (ctx.userId === targetUserId) return { _id: targetUserId }
  return null
}

/** Orders — users see only their own orders */
export function orderListFilter(ctx: PolicyContext): DbFilter<IOrder> {
  if (ctx.role === 'admin') return {}
  if (!ctx.userId) throw new PolicyError('Authentication required')
  return { userId: ctx.userId }
}

export function orderReadFilter(ctx: PolicyContext, orderId: string): DbFilter<IOrder> {
  if (ctx.role === 'admin') return { _id: orderId }
  if (!ctx.userId) throw new PolicyError('Authentication required')
  return { _id: orderId, userId: ctx.userId }
}

export function orderCreateScope(ctx: PolicyContext): { userId: string } {
  if (!ctx.userId) throw new PolicyError('Authentication required')
  return { userId: ctx.userId }
}

/** Products — public sees active men's only */
export function productPublicFilter(): Record<string, unknown> {
  return { isActive: true, gender: 'men' }
}

/** Cart — deterministic key prevents IDOR */
export function cartKeyFor(ctx: PolicyContext, cookieCartId?: string): string {
  if (ctx.userId) return `user:${ctx.userId}`
  if (cookieCartId && isValidCartToken(cookieCartId)) return `guest:${cookieCartId}`
  return `guest:${generateGuestCartToken()}`
}

export function canAccessCart(ctx: PolicyContext, cartKey: string): boolean {
  if (ctx.userId) return cartKey === `user:${ctx.userId}`
  return cartKey.startsWith('guest:')
}

export function policyContextFromAuth(userId?: string, role?: string): PolicyContext {
  if (!userId) return { role: 'guest' }
  return { userId, role: role === 'admin' ? 'admin' : 'user' }
}

export class PolicyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PolicyError'
  }
}

const CART_TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidCartToken(id: string): boolean {
  return CART_TOKEN_RE.test(id)
}

function generateGuestCartToken(): string {
  return randomUUID()
}
