export type OutfitCategory = 'tops' | 'bottoms' | 'outerwear' | 'footwear' | 'accessories'

export type OutfitView = 'front' | 'side' | 'back'

export interface NavLink {
  label: string
  href: string
}

export interface StyleDnaCard {
  id: string
  title: string
  description: string
  imageKey: string
}

export interface OutfitItem {
  id: string
  category: OutfitCategory
  name: string
  imageKey: string
}

export interface LookbookCard {
  id: string
  title: string
  imageKey: string
}

export interface Product {
  id: string
  name: string
  price: number
  imageKey: string
}

export interface ValueProp {
  id: string
  icon: string
  title: string
  description: string
}

export interface FooterLinkGroup {
  title: string
  links: { label: string; href: string }[]
}
