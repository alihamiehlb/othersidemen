# Access Control Policies

MongoDB does **not** support PostgreSQL-style Row Level Security (RLS).  
This project implements equivalent protection in `server/src/policies/accessPolicies.ts`.

## Policy Matrix

| Resource | Actor | Action | Rule | Enforced in |
|----------|-------|--------|------|-------------|
| **User** | user | read | Own profile only | `/api/auth/me` |
| **User** | admin | read/write | All users | `/api/admin/users` |
| **User** | admin | demote | Cannot demote last admin | `admin/users/:id` |
| **User** | admin | self | Cannot demote/deactivate self | `admin/users/:id` |
| **Order** | user | list | `userId = currentUser` | `orderListFilter()` |
| **Order** | user | read | `userId = currentUser AND _id = :id` | `orderReadFilter()` |
| **Order** | user | create | `userId` forced to currentUser | `orderCreateScope()` |
| **Order** | admin | read/update | All orders | Admin routes only |
| **Product** | public | read | `isActive=true, gender=men` | `productPublicFilter()` |
| **Product** | admin | write | All products | Admin routes only |
| **Cart** | guest | read/write | Own `guest:{uuid}` cookie only | `cartKeyFor()` |
| **Cart** | user | read/write | Own `user:{userId}` only | `cartKeyFor()` |

## IDOR Protections

| Attack | Mitigation |
|--------|------------|
| Access another user's order by ID | `orderReadFilter` always includes `userId` |
| Access another user's cart via cookie swap | Logged-in users always use `user:{userId}` key |
| Guess MongoDB ObjectIds | `validateObjectId()` middleware on all `:id` routes |
| Access inactive/hidden products | `productPublicFilter()` on all public product queries |
| Non-admin accessing admin routes | `requireAdmin` middleware |
| User escalating to admin | Role changes only via admin panel |
| Slug vs ObjectId confusion | Product slug route rejects valid ObjectId patterns |

## How to add a new resource

1. Add policy functions to `accessPolicies.ts`
2. Use policy filter in **every** database query — never query without scoping
3. Add `validateObjectId()` on any `:id` route parameter
4. Document the rule in this file

## What we cannot do in MongoDB

- Database-enforced RLS (use app layer + Atlas VPC restrictions)
- Automatic policy on direct DB access (restrict Atlas user permissions to `readWrite` on one DB only)

## Atlas hardening (recommended)

1. Database user: `readWrite` on `twoside-store` only (not `readWriteAnyDatabase`)
2. Network: VPC peering, no public `0.0.0.0/0` in production
3. Enable Atlas audit logs
4. Enable encryption at rest (default on Atlas)
