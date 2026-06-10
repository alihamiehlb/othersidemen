/**
 * Shared product category classifier for catalog import and reclassification.
 */
export const CATEGORY_RULES = [
  {
    category: 'footwear',
    keywords: [
      'sneaker', 'trainer', 'shoe', 'loafer', 'boot', 'footwear', 'slide', 'sandal',
      'mule', 'derby', 'oxford', 'runner', 'air force', 'dunk', 'jordan', 'yeezy',
    ],
  },
  {
    category: 'accessories',
    keywords: [
      'bag', 'crossbody', 'tote', 'backpack', 'belt', 'cap', 'wallet', 'leather bag',
      'hat', 'beanie', 'scarf', 'sunglasses', 'watch', 'jewelry', 'chain', 'ring',
    ],
  },
  {
    category: 'outerwear',
    keywords: [
      'puffer', 'jacket', 'coat', 'blazer', 'bomber', 'outerwear', 'quilted', 'overcoat',
      'overshirt', 'shacket', 'parka', 'vest', 'gilet', 'windbreaker', 'leather jacket',
      'denim jacket', 'varsity', 'cardigan',
    ],
  },
  {
    category: 'bottoms',
    keywords: [
      'cargo', 'pant', 'trouser', 'chino', 'jean', 'denim', 'short', 'jogger', 'sweatpant',
      'bottom', 'skirt', 'wide leg', 'cargo pant', 'track pant', 'bermuda',
    ],
  },
  {
    category: 'tops',
    keywords: [
      'shirt', 'tee', 't-shirt', 'hoodie', 'sweatshirt', 'polo', 'knit', 'top', 'linen',
      'blouse', 'sweater', 'tank', 'crewneck', 'long sleeve', 'short sleeve', 'henley',
      'button down', 'oxford shirt', 'flannel',
    ],
  },
  {
    category: 'looks',
    keywords: [
      'look', 'outfit', 'style', 'collection', 'layer', 'set', 'complete the look',
      'winter collection', 'summer collection', 'new arrival', 'drop', 'editorial',
    ],
  },
]

/** Strong garment signals — if matched, avoid defaulting to looks. */
const GARMENT_CATEGORIES = new Set(['footwear', 'accessories', 'outerwear', 'bottoms', 'tops'])

export function classifyText(text) {
  const lower = (text ?? '').toLowerCase()
  let best = { category: 'looks', score: 0 }

  for (const rule of CATEGORY_RULES) {
    let score = 0
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) score += kw.length > 5 ? 4 : kw.length > 3 ? 3 : 2
    }
    if (score > best.score) best = { category: rule.category, score }
  }

  // Full outfit posts without garment keywords stay as looks
  if (best.category === 'looks' && best.score === 0) {
    const hasGarmentHint = [...GARMENT_CATEGORIES].some((cat) => {
      const rule = CATEGORY_RULES.find((r) => r.category === cat)
      return rule?.keywords.some((kw) => lower.includes(kw))
    })
    if (hasGarmentHint) {
      return classifyText(`${text} shirt jacket pant shoe`)
    }
  }

  return best.category
}
