# Production Database Setup - Next Steps

## ✅ What We've Done

1. ✅ Created production database in Neon
2. ✅ Initialized production database schema
3. ✅ Updated local .env with production DB reference

## 🔧 What You Need to Do in Vercel

### Step 1: Update Vercel Environment Variable

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your project (job-check-two)
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` and click to edit it
5. Update the value to your **production database**:
   ```
   postgresql://user:password@ep-production-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
6. **Save** the changes

### Step 2: Redeploy Production

After updating the environment variable:

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 3: Verify Separation

After redeploy:

1. **Test Local Dev:**
   - Add a test person in local dev (http://localhost:5173)
   - This should only appear in dev database

2. **Check Production:**
   - Visit your production site
   - The test person from dev should **NOT** appear
   - Production should have its own separate data

## Final Configuration

| Environment | Database Source | Database |
|------------|----------------|----------|
| **Local Dev** | `server/.env` | Development (`ep-aged-pine-ah06q9tt`) |
| **Vercel Production** | Vercel Env Vars | Production (`ep-wandering-cloud-ahiuzsig`) |

## Troubleshooting

**If production still shows dev data:**
- Make sure you saved the Vercel environment variable
- Make sure you redeployed after updating
- Check Vercel deployment logs for any errors

**If production shows no data:**
- This is expected if the production database is empty
- Add data through production to populate it
- Dev data won't appear (that's correct!)
