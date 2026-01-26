# Simplified Database Setup

Since you have no users and minimal data, here's the simplest approach:

## Current Situation

- **Old Database** (`ep-young-queen-ahgnq1bm`): Currently in Vercel production
- **New Database** (`ep-aged-pine-ah06q9tt`): Set up as development in `server/.env`

## Recommended Approach: Keep Both, Use Properly

You don't need to delete anything! Just make sure:

1. **Vercel Production** → Uses old database (`ep-young-queen-ahgnq1bm`)
2. **Local Development** → Uses new database (`ep-aged-pine-ah06q9tt`) via `server/.env`

## Step 1: Verify Vercel Environment Variable

In Vercel Dashboard → Settings → Environment Variables:

1. Find `DATABASE_URL`
2. **Delete it** (if you can't restrict environments)
3. **Add it again** with:
   - **Value**: Your production database (old one)
     ```
     postgresql://user:password@ep-production-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
   - **Environment**: Select "Production" only (or "All Environments" if that's the only option)

## Step 2: Verify Local .env

Your `server/.env` should have the development database (new one):
```
DATABASE_URL=postgresql://dev_user:dev_password@ep-dev-instance-pooler.us-east-1.aws.neon.tech/dev_db?sslmode=require
```

## Step 3: Initialize Development Database

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck
node db/init.js
```

## Alternative: If You Really Want to Start Fresh

If you prefer to delete and recreate:

1. **Delete the old database** in Neon dashboard
2. **Keep the new database** (`ep-aged-pine-ah06q9tt`)
3. **Use it for both**:
   - Update Vercel `DATABASE_URL` to point to the new database
   - Keep `server/.env` pointing to the new database
   - Later, create a separate dev database when you need it

But this isn't necessary - having separate databases now is better practice!

## Why Keep Both?

- ✅ Production stays stable
- ✅ You can test locally without affecting production
- ✅ When you do have users, you won't accidentally delete their data
- ✅ Better development workflow

## Quick Check

After setup, verify:

**Local:**
```bash
cd server
node check-db-connection.js
# Should show: ep-aged-pine-ah06q9tt (development)
```

**Vercel:**
- Check the deployed app
- It should use: ep-young-queen-ahgnq1bm (production)
