import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { User } from '../models/User.js'
import { env } from './env.js'

export function configurePassport(): void {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.warn('[auth] Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET')
    return
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value
          if (!email) {
            done(new Error('No email from Google'), undefined)
            return
          }

          let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] })

          if (user) {
            user.googleId = profile.id
            user.name = profile.displayName ?? user.name
            user.avatar = profile.photos?.[0]?.value
            user.lastLoginAt = new Date()
            if (env.ADMIN_EMAIL && email === env.ADMIN_EMAIL) user.role = 'admin'
            await user.save()
          } else {
            user = await User.create({
              email,
              name: profile.displayName ?? email.split('@')[0],
              avatar: profile.photos?.[0]?.value,
              googleId: profile.id,
              role: env.ADMIN_EMAIL && email === env.ADMIN_EMAIL ? 'admin' : 'user',
              lastLoginAt: new Date(),
            })
          }

          done(null, user)
        } catch (err) {
          done(err as Error, undefined)
        }
      },
    ),
  )
}
