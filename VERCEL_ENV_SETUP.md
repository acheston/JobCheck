# Vercel Environment Variables Setup Guide

## The Problem

If you set `DATABASE_URL` for "All Environments" in Vercel, it will be used for:
- ✅ Production deployments (correct - should use production DB)
- ❌ Preview deployments (might want dev DB for testing)
- ❌ Local `vercel dev` (should use your local .env file)

## The Solution

Set environment variables **per environment** in Vercel:

### Step 1: Go to Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project (job-check-two)
3. Go to **Settings** → **Environment Variables**

### Step 2: Configure DATABASE_URL

You should see your `DATABASE_URL` variable. Check which environments it's set for:

**Option A: Production Only (Recommended)**

1. Click on `DATABASE_URL` to edit it
2. **Uncheck** "Preview" and "Development" 
3. **Keep checked** only "Production"
4. Value should be your **production database**:
   ```
   postgresql://neondb_owner:npg_hUJ6kfKZTut8@ep-young-queen-ahgnq1bm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

**Option B: Separate Databases for Each Environment**

If you want different databases for previews:

1. **Production Environment**:
   - Environment: ✅ Production only
   - Value: Production database URL

2. **Preview Environment** (optional):
   - Environment: ✅ Preview only  
   - Value: Development database URL (for testing PRs)

3. **Development Environment**:
   - Environment: ✅ Development only
   - Value: Development database URL
   - **Note**: This is only used with `vercel dev` command locally

### Step 3: Verify Your Local Setup

Your local development (when running `npm run dev` in the server directory) uses:
- `server/.env` file
- Should point to your **development database**

This is **separate** from Vercel's environment variables.

## Current Setup Summary

| Environment | Database Source | Database |
|------------|----------------|----------|
| **Local Dev** (`npm run dev`) | `server/.env` | Development DB (`ep-aged-pine-ah06q9tt`) |
| **Vercel Production** | Vercel Env Vars → Production | Production DB (`ep-young-queen-ahgnq1bm`) |
| **Vercel Preview** | Vercel Env Vars → Preview | (Same as Production if not set separately) |
| **Vercel Dev** (`vercel dev`) | Vercel Env Vars → Development | (Uses local .env if not set) |

## How to Check Current Settings

In Vercel Dashboard → Settings → Environment Variables:

Look at the "Environments" column for `DATABASE_URL`:
- If it shows "Production, Preview, Development" → It's set for all (this might be the problem)
- If it shows only "Production" → Good! Only production uses it
- You can click on the variable to see/edit which environments it applies to

## Quick Fix

**If `DATABASE_URL` is set for "All Environments":**

1. Click on `DATABASE_URL` in Vercel
2. Change it to **Production only**
3. Save
4. Redeploy your production site

This ensures:
- ✅ Production uses production database
- ✅ Local dev uses `server/.env` (development database)
- ✅ No mixing of data

## Other Environment Variables

For other variables like `SERPER_API_KEY` and `RESEND_API_KEY`, you can set them for "All Environments" since they're the same for dev and production.
