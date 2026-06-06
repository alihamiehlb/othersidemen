import { cacheDel, cacheGet, cacheSet, getRedisClient } from '../config/redis.js'

import { canAccessCart, cartKeyFor, type PolicyContext } from '../policies/accessPolicies.js'



export interface CartItem {

  productId: string

  name: string

  price: number

  quantity: number

  size: string

  color: string

  image?: string

}



export interface Cart {

  items: CartItem[]

  ownerKey: string

  updatedAt: string

}



const CART_TTL = 60 * 60 * 24 * 7



/** In-memory fallback when Redis is unavailable (local dev without Docker) */

const memoryCarts = new Map<string, Cart>()



function redisKey(cartKey: string): string {

  return `cart:${cartKey}`

}



export function resolveCartKey(ctx: PolicyContext, cookieCartId?: string): string {

  return cartKeyFor(ctx, cookieCartId)

}



export async function getCart(cartKey: string, ctx: PolicyContext): Promise<Cart> {

  if (!canAccessCart(ctx, cartKey)) {

    return { items: [], ownerKey: cartKey, updatedAt: new Date().toISOString() }

  }



  const cached = await cacheGet<Cart>(redisKey(cartKey))

  if (cached) return cached



  const memory = memoryCarts.get(cartKey)

  return memory ?? { items: [], ownerKey: cartKey, updatedAt: new Date().toISOString() }

}



export async function saveCart(cartKey: string, cart: Cart, ctx: PolicyContext): Promise<void> {

  if (!canAccessCart(ctx, cartKey)) return



  const updated: Cart = { ...cart, ownerKey: cartKey, updatedAt: new Date().toISOString() }



  if (getRedisClient()) {

    await cacheSet(redisKey(cartKey), updated, CART_TTL)

  } else {

    memoryCarts.set(cartKey, updated)

  }

}



export async function clearCart(cartKey: string, ctx: PolicyContext): Promise<void> {

  if (!canAccessCart(ctx, cartKey)) return

  await cacheDel(redisKey(cartKey))

  memoryCarts.delete(cartKey)

}



export function cartTotal(items: CartItem[]): number {

  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)

}

