import 'dotenv/config'
import { connectDB } from '../config/db.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import bcrypt from 'bcryptjs'

const PRODUCTS = [
  {
    name: 'Utility Puffer Jacket',
    slug: 'utility-puffer-jacket',
    description: 'Insulated puffer jacket built for urban winters. Water-resistant shell, lightweight fill.',
    price: 129,
    category: 'outerwear',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Charcoal'],
    stock: 45,
    isFeatured: true,
    tags: ['new', 'winter'],
  },
  {
    name: 'Oversized Hoodie',
    slug: 'oversized-hoodie',
    description: 'Premium cotton blend hoodie with relaxed fit and minimal branding.',
    price: 79,
    category: 'tops',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Grey', 'Off-White'],
    stock: 80,
    isFeatured: true,
    tags: ['new'],
  },
  {
    name: 'Cargo Pants',
    slug: 'cargo-pants',
    description: 'Technical cargo pants with multiple pockets and tapered leg.',
    price: 89,
    category: 'bottoms',
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Black', 'Olive', 'Charcoal'],
    stock: 60,
    isFeatured: true,
    tags: ['new'],
  },
  {
    name: 'High Top Sneakers',
    slug: 'high-top-sneakers',
    description: 'Clean leather high tops with cushioned sole. Everyday staple.',
    price: 119,
    category: 'footwear',
    sizes: ['7', '8', '9', '10', '11', '12'],
    colors: ['White', 'Black'],
    stock: 35,
    isFeatured: true,
    tags: ['new'],
  },
  {
    name: 'Bomber Jacket',
    slug: 'bomber-jacket',
    description: 'Classic bomber silhouette in matte nylon with ribbed cuffs.',
    price: 149,
    category: 'outerwear',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy'],
    stock: 25,
    isFeatured: false,
    tags: [],
  },
  {
    name: 'Crossbody Bag',
    slug: 'crossbody-bag',
    description: 'Compact crossbody in water-resistant nylon. Adjustable strap.',
    price: 59,
    category: 'accessories',
    sizes: ['One Size'],
    colors: ['Black'],
    stock: 50,
    isFeatured: false,
    tags: [],
  },
]

async function seed() {
  await connectDB()

  for (const p of PRODUCTS) {
    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        ...p,
        gender: 'men',
        isActive: true,
        images: [`/images/products/${p.slug}.webp`],
      },
      { upsert: true, returnDocument: 'after' },
    )
  }
  console.log(`[seed] ${PRODUCTS.length} products seeded`)

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@otherside.com'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!Change'
  const hash = await bcrypt.hash(adminPassword, 12)

  await User.findOneAndUpdate(
    { email: adminEmail },
    { email: adminEmail, name: 'Admin', passwordHash: hash, role: 'admin', isActive: true },
    { upsert: true, returnDocument: 'after' },
  )
  console.log(`[seed] Admin user: ${adminEmail}`)

  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
