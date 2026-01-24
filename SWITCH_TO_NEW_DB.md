# Switch to New Database for Production

## Step 1: Update Vercel Environment Variable

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your project (job-check-two)
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` and click to edit it (or delete and recreate if needed)
5. Set the value to your new database:
   ```
   postgresql://neondb_owner:npg_Na94uXrdpSTj@ep-aged-pine-ah06q9tt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
6. Set it for **All Environments** (or Production if you can restrict it)
7. **Save**

## Step 2: Initialize the Database Schema

The new database needs the schema. Run:

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck
node db/init.js
```

You should see:
```
Connected to database
Database schema created successfully!
```

## Step 3: Redeploy on Vercel

After updating the environment variable:

1. Go to **Deployments** tab in Vercel
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a commit to trigger a new deployment

## Step 4: Verify Everything Works

**Check Local:**
```bash
cd server
node check-db-connection.js
```
Should show: `ep-aged-pine-ah06q9tt`

**Check Production:**
- Visit your production URL
- The app should work normally
- Any data you add will be in the new database

## Current Setup

After this, both environments use the same database:
- ✅ **Local dev** (`server/.env`) → New database
- ✅ **Vercel Production** → New database

This is fine for now since you have no data. Later, when you need separation, you can create a dev database and update `server/.env`.
