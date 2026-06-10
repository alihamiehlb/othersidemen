import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  canAccessCart,
  orderReadFilter,
  orderListFilter,
  productPublicFilter,
  policyContextFromAuth,
} from '../policies/accessPolicies.js'

describe('accessPolicies', () => {
  it('blocks guest from accessing another guest cart', () => {
    const ctx = policyContextFromAuth(undefined, undefined)
    const victimKey = 'guest:11111111-1111-4111-8111-111111111111'
    const attackerCookie = '22222222-2222-4222-8222-222222222222'
    assert.equal(canAccessCart(ctx, victimKey, attackerCookie), false)
  })

  it('allows guest to access own cart', () => {
    const cartId = '33333333-3333-4333-8333-333333333333'
    const ctx = policyContextFromAuth(undefined, undefined)
    assert.equal(canAccessCart(ctx, `guest:${cartId}`, cartId), true)
  })

  it('scopes orders to authenticated user', () => {
    const filter = orderListFilter({ userId: 'user-a', role: 'user' })
    assert.deepEqual(filter, { userId: 'user-a' })
  })

  it('prevents cross-user order reads', () => {
    const filter = orderReadFilter({ userId: 'user-a', role: 'user' }, 'order-1')
    assert.equal(filter.userId, 'user-a')
    assert.equal(filter._id, 'order-1')
  })

  it('public product filter requires active mens products', () => {
    assert.deepEqual(productPublicFilter(), { isActive: true, gender: 'men' })
  })
})
