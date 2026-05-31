# Data Safety & Migration Guide

## Before Running Any Schema Changes

**Always back up your D1 database first.**

### Recommended Backup Method (Cloudflare)

Using Wrangler (recommended):

```bash
# Export the entire database
wrangler d1 export ddsr-dashboard --output=backup-$(date +%Y%m%d-%H%M%S).sql

# Or export specific tables if you want smaller files
wrangler d1 export ddsr-dashboard --table=user --output=user-backup.sql
wrangler d1 export ddsr-dashboard --table=clients --output=clients-backup.sql
wrangler d1 export ddsr-dashboard --table=projects --output=projects-backup.sql
```

You can also use the Cloudflare Dashboard → D1 → your database → "Export" button.

---

## Current Structural Migration (as of now)

We are moving from this legacy model:

- `user.clientSlug` (single string) as the main way to know which client a user belongs to.

To this cleaner model:

- `user_clients` join table as the source of truth for access.
- Internal team bypasses restrictions via `isAdmin` or `@datadrivensr.com` email.

### Step-by-step (when you're ready)

1. **Backup first** (see above).
2. Apply `0017_user_clients.sql`.
3. (Optional but recommended) Run `0017_backfill_user_clients.sql` to give existing users proper membership rows based on their current `clientSlug`.
4. The code has been updated so that:
   - New invites create proper rows in `user_clients`.
   - Admin user management creates proper rows.
   - Authorization now prefers the join table.

---

## Reverting if something goes wrong

You can always restore from the SQL backup:

```bash
wrangler d1 execute ddsr-dashboard --file=backup-XXXXXX.sql
```

D1 does **not** support point-in-time recovery easily, so external backups are important.

---

## Notes

- `clientSlug` on the `user` table is being kept for now (mainly for the invitation flow and some legacy display logic). It is no longer the primary authorization mechanism.
- The goal is a clean multi-organization model where:
  - External users are explicitly granted access to one or more clients via `user_clients`.
  - Internal users bypass client restrictions entirely.
