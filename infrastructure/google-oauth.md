# Google OAuth — step-by-step (matches your Cloud Console screen)

You are on **Create OAuth client ID → Web application**. Fill it exactly like this for local dev:

## 1. OAuth consent screen (do this first if you haven't)

1. [Google Cloud Console](https://console.cloud.google.com/) → your project
2. **APIs & Services → OAuth consent screen**
3. User type: **External** (fine for dev)
4. App name: `OTHER SIDE` or `Otherside Men`
5. User support email: your email
6. Developer contact: your email
7. Save — add test users if app is in "Testing" mode (your Gmail + admin email)

## 2. Create OAuth client ID

**APIs & Services → Credentials → Create Credentials → OAuth client ID**

| Field | Value |
|-------|--------|
| Application type | **Web application** |
| Name | `othersidemen` (or any label) |

### Authorized JavaScript origins

Click **+ Add URI** and add:

```
http://localhost:5173
```

Production (same-origin via Pages `/api` proxy):

```
https://twoside-store.pages.dev
```

### Authorized redirect URIs

Dev:

```
http://localhost:3001/api/auth/google/callback
```

Production (**must start with `https://`** — not `//...`):

```
https://twoside-store.pages.dev/api/auth/google/callback
```

Click **Create**. Copy the **Client ID** and **Client secret**.

## 3. Add to `server/.env`

```env
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
ADMIN_EMAIL=your@gmail.com
```

`ADMIN_EMAIL` — Google login with this email gets **admin** automatically.

## 4. Restart

```powershell
npm run dev:fresh
```

## 5. Test

1. Open `http://localhost:5173/login`
2. Click **Continue with Google**
3. You should land on `/account`

## Common errors

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Redirect URI must match **exactly** — use `https://twoside-store.pages.dev/api/auth/google/callback` (include `https://`) |
| `auth_failed` after Google | `oauth_state` cookie must be same-origin — use Pages URL for callback, not `workers.dev` |
| `access_blocked` | Add your email as test user on consent screen |
| Google button hidden | `GOOGLE_CLIENT_ID` / `SECRET` missing in `server/.env` |
| Cookie not set | Use `npm run dev` (client + server), not `dev:client` alone |

## Production checklist

- [ ] HTTPS on both site and API
- [ ] Update JavaScript origins + redirect URIs to production URLs
- [ ] Set `GOOGLE_CALLBACK_URL` to `https://twoside-store.pages.dev/api/auth/google/callback`
- [ ] Set `CLIENT_URL` and `CORS_ORIGIN` to production frontend URL
