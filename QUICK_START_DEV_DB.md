# Quick Start: Set Up Development Database

Your current `server/.env` is pointing to your **production database**. Follow these steps to create a separate dev database:

## Step 1: Create Dev Database in Neon (2 minutes)

1. Go to https://console.neon.tech
2. Click **"Create Project"** (or use existing project)
3. Name it: **"JobCheck Dev"**
4. Copy the **connection string** from Connection Details

## Step 2: Update Local .env (1 minute)

Edit `server/.env` and replace `DATABASE_URL` with your new dev database connection string:

```env
# OLD (Production - currently in use):
# DATABASE_URL=postgresql://neondb_owner:npg_hUJ6kfKZTut8@ep-young-queen-ahgnq1bm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# NEW (Development - replace with your dev connection string):
DATABASE_URL=postgresql://dev_user:dev_password@ep-dev-instance-pooler.us-east-1.aws.neon.tech/dev_db?sslmode=require
```

## Step 3: Initialize Dev Database (30 seconds)

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck/server
node ../db/init.js
```

You should see: `Database schema created successfully!`

## Step 4: Verify Setup (30 seconds)

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck/server
node check-db-connection.js
```

This will show you which database you're connected to.

## Step 5: Verify Vercel Uses Production

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Verify `DATABASE_URL` points to your **production** database (the old one)

## Done! ✅

Now:
- **Local dev** → Uses dev database (test data stays local)
- **Vercel production** → Uses production database (real data)

## Need Help?

See [DEV_PRODUCTION_DB_SETUP.md](./DEV_PRODUCTION_DB_SETUP.md) for detailed instructions.
