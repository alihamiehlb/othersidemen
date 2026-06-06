import type {
  FooterLinkGroup,
  LookbookCard,
  NavLink,
  OutfitItem,
  Product,
  StyleDnaCard,
  ValueProp,
} from '@/types'

export const NAV_LINKS: NavLink[] = [
  { label: 'NEW IN', href: '#new-in' },
  { label: 'COLLECTION', href: '/shop' },
  { label: 'LOOKBOOK', href: '#lookbook' },
  { label: 'SALE', href: '/shop' },
]

export const STYLE_DNA_CARDS: StyleDnaCard[] = [
  { id: 'minimal', title: 'MINIMAL', description: 'Clean. Simple. Timeless.', imageKey: 'styleDna.minimal' },
  { id: 'street', title: 'STREET', description: 'Bold. Urban. Effortless.', imageKey: 'styleDna.street' },
  { id: 'creative', title: 'CREATIVE', description: 'Unique. Expressive. You.', imageKey: 'styleDna.creative' },
  { id: 'classic', title: 'CLASSIC', description: 'Sharp. Refined. Always.', imageKey: 'styleDna.classic' },
  { id: 'tech', title: 'TECH', description: 'Functional. Modern. Futuristic.', imageKey: 'styleDna.tech' },
]

export const OUTFIT_CATEGORIES = [
  { id: 'tops' as const, label: 'TOPS' },
  { id: 'bottoms' as const, label: 'BOTTOMS' },
  { id: 'outerwear' as const, label: 'OUTERWEAR' },
  { id: 'footwear' as const, label: 'FOOTWEAR' },
  { id: 'accessories' as const, label: 'ACCESSORIES' },
]

export const OUTFIT_ITEMS: OutfitItem[] = [
  { id: 'top-1', category: 'tops', name: 'Essential Tee', imageKey: 'outfitBuilder.items.top-1' },
  { id: 'top-2', category: 'tops', name: 'Oversized Hoodie', imageKey: 'outfitBuilder.items.top-2' },
  { id: 'top-3', category: 'tops', name: 'Crew Sweatshirt', imageKey: 'outfitBuilder.items.top-3' },
  { id: 'top-4', category: 'tops', name: 'Polo Shirt', imageKey: 'outfitBuilder.items.top-4' },
  { id: 'bottom-1', category: 'bottoms', name: 'Cargo Pants', imageKey: 'outfitBuilder.items.bottom-1' },
  { id: 'bottom-2', category: 'bottoms', name: 'Slim Jeans', imageKey: 'outfitBuilder.items.bottom-2' },
  { id: 'bottom-3', category: 'bottoms', name: 'Wide Leg Trousers', imageKey: 'outfitBuilder.items.bottom-3' },
  { id: 'bottom-4', category: 'bottoms', name: 'Joggers', imageKey: 'outfitBuilder.items.bottom-4' },
  { id: 'outer-1', category: 'outerwear', name: 'Puffer Jacket', imageKey: 'outfitBuilder.items.outer-1' },
  { id: 'outer-2', category: 'outerwear', name: 'Bomber Jacket', imageKey: 'outfitBuilder.items.outer-2' },
  { id: 'outer-3', category: 'outerwear', name: 'Trench Coat', imageKey: 'outfitBuilder.items.outer-3' },
  { id: 'outer-4', category: 'outerwear', name: 'Denim Jacket', imageKey: 'outfitBuilder.items.outer-4' },
  { id: 'foot-1', category: 'footwear', name: 'High Tops', imageKey: 'outfitBuilder.items.foot-1' },
  { id: 'foot-2', category: 'footwear', name: 'Running Sneakers', imageKey: 'outfitBuilder.items.foot-2' },
  { id: 'foot-3', category: 'footwear', name: 'Chelsea Boots', imageKey: 'outfitBuilder.items.foot-3' },
  { id: 'foot-4', category: 'footwear', name: 'Slides', imageKey: 'outfitBuilder.items.foot-4' },
]

export const LOOKBOOK_CARDS: LookbookCard[] = [
  { id: 'winter', title: 'WINTER LAYERS', imageKey: 'lookbook.winterLayers' },
  { id: 'city', title: 'CITY ESSENTIALS', imageKey: 'lookbook.cityEssentials' },
  { id: 'off-duty', title: 'OFF DUTY LOOKS', imageKey: 'lookbook.offDutyLooks' },
  { id: 'evening', title: 'EVENING REFINED', imageKey: 'lookbook.eveningRefined' },
  { id: 'weekend', title: 'WEEKEND ESCAPE', imageKey: 'lookbook.weekendEscape' },
]

export const NEW_IN_PRODUCTS: Product[] = [
  { id: 'p1', name: 'UTILITY PUFFER JACKET', price: 129.0, imageKey: 'products.p1' },
  { id: 'p2', name: 'OVERSIZED HOODIE', price: 79.0, imageKey: 'products.p2' },
  { id: 'p3', name: 'CARGO PANTS', price: 89.0, imageKey: 'products.p3' },
  { id: 'p4', name: 'HIGH TOP SNEAKERS', price: 119.0, imageKey: 'products.p4' },
  { id: 'p5', name: 'BOMBER JACKET', price: 149.0, imageKey: 'products.p5' },
  { id: 'p6', name: 'CROSSBODY BAG', price: 59.0, imageKey: 'products.p6' },
]

export const VALUE_PROPS: ValueProp[] = [
  { id: 'shipping', icon: 'globe', title: 'WORLDWIDE SHIPPING', description: 'We deliver globally. No limits.' },
  { id: 'quality', icon: 'shield', title: 'PREMIUM QUALITY', description: 'Built to last. Always.' },
  { id: 'returns', icon: 'refresh', title: 'EASY RETURNS', description: "Not your fit? We've got you." },
  { id: 'payment', icon: 'lock', title: 'SECURE PAYMENT', description: '100% safe & encrypted.' },
  { id: 'support', icon: 'headphones', title: 'STYLE SUPPORT', description: "We're here for you. Anytime." },
]

export const FOOTER_LINKS: FooterLinkGroup[] = [
  {
    title: 'SHOP',
    links: [
      { label: 'New In', href: '/#new-in' },
      { label: 'All Products', href: '/shop' },
      { label: 'Looks', href: '/shop?category=looks' },
      { label: 'Outerwear', href: '/shop?category=outerwear' },
      { label: 'Footwear', href: '/shop?category=footwear' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Shipping & Returns', href: '/shipping' },
      { label: 'Payment Methods', href: '/payment' },
    ],
  },
  {
    title: 'SUPPORT',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Returns', href: '/returns' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Security', href: '/security-policy' },
    ],
  },
]
