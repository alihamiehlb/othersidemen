import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true)

  try {
    await mongoose.connect(env.MONGODB_URI, {
      // Connection pool — reuses DB connections instead of opening one per request
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30_000,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
    })
    console.log('[mongodb] Connected')
  } catch (err) {
    console.error('[mongodb] Connection failed.')
    console.error('[mongodb] Check Atlas: Network Access must include your current public IP, and Database Access user must exist.')
    console.error('[mongodb] Tip: Atlas → Network Access → Add Current IP Address (IPs can change on home networks).')
    throw err
  }
}

mongoose.connection.on('error', (err) => {
  console.error('[mongodb] Error:', err.message)
})

function isMongoConnected(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected
}

/** Wait for or restore MongoDB before handling data routes (container cold starts). */
export async function ensureDbConnected(): Promise<boolean> {
  if (isMongoConnected()) return true

  if (mongoose.connection.readyState === mongoose.ConnectionStates.connecting) {
    await new Promise((resolve) => setTimeout(resolve, 750))
    if (isMongoConnected()) return true
  }

  try {
    await connectDB()
    return isMongoConnected()
  } catch {
    return false
  }
}
