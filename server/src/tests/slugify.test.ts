import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

describe('slugifyName', () => {
  it('lowercases and hyphenates', () => {
    assert.equal(slugifyName('Winter Puffer Jacket'), 'winter-puffer-jacket')
  })

  it('strips invalid characters', () => {
    assert.equal(slugifyName('OS Look #12!!!'), 'os-look-12')
  })
})
