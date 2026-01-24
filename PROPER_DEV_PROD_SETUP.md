# Proper Development/Production Database Setup

## Goal

- **Development Database**: For local testing (`npm run dev`)
- **Production Database**: For Vercel deployments

## Current Status

- ✅ Local `.env` points to: `ep-aged-pine-ah06q9tt` (this will be DEV)
- ⏳ Need to: Create/configure PRODUCTION database

## Step 1: Set Up Development Database (Current Database)

The database `ep-aged-pine-ah06q9tt` will be your **development database**.

### 1.1 Verify Local Configuration

Your `server/.env` should have:
```env
DATABASE_URL=postgresql://neondb_owner:npg_Na94uXrdpSTj@ep-aged-pine-ah06q9tt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 1.2 Initialize Development Database

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck
node db/init.js
```

This creates the schema in your dev database.

### 1.3 Test Development Database

```bash
cd server
node check-db-connection.js
```

Should show: `ep-aged-pine-ah06q9tt` (development)

## Step 2: Create Production Database

### 2.1 Create New Database in Neon

1. Go to https://console.neon.tech
2. Click **"Create Project"** (or use existing project)
3. Name it: **"JobCheck Production"** (or similar)
4. Copy the **connection string** from Connection Details

It will look like:
```
postgresql://user:password@ep-production-instance-pooler.us-east-1.aws.neon.tech/prod_db?sslmode=require
```

### 2.2 Initialize Production Database

Once you have the production connection string, run:

```bash
DATABASE_URL=your_production_connection_string node db/init.js
```

Or create a temporary file to initialize it.

## Step 3: Configure Vercel for Production

### 3.1 Update Vercel Environment Variable

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `DATABASE_URL` to your **production database** connection string
3. Save

### 3.2 Redeploy

After updating, redeploy your production site.

## Final Configuration

| Environment | Database Source | Database |
|------------|----------------|----------|
| **Local Dev** (`npm run dev`) | `server/.env` | Development (`ep-aged-pine-ah06q9tt`) |
| **Vercel Production** | Vercel Env Vars | Production (new database) |

## Verification Checklist

- [ ] Dev database initialized (`node db/init.js` with dev connection)
- [ ] Local dev connects to dev database (`node check-db-connection.js`)
- [ ] Production database created in Neon
- [ ] Production database initialized
- [ ] Vercel `DATABASE_URL` points to production database
- [ ] Production site redeployed and working
