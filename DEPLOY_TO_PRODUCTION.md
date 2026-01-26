# Deploy to Production - Checklist

## Pre-Deployment Checklist

### ✅ 1. Development Database Working
- [x] Local dev can save people
- [x] Dev database initialized

### ⏳ 2. Production Database Setup
- [ ] Production database initialized
- [ ] Vercel `DATABASE_URL` points to production database

### ⏳ 3. Code Changes
- [ ] All changes committed
- [ ] Pushed to GitHub
- [ ] Vercel will auto-deploy

## Steps to Deploy

### Step 1: Initialize Production Database

Make sure the production database schema is created:

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck
DATABASE_URL=your_production_connection_string node db/init.js
```

### Step 2: Verify Vercel Configuration

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `DATABASE_URL` is set to:
   ```
   postgresql://user:password@ep-production-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Commit and Push

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck
git add .
git commit -m "Set up separate dev and production databases"
git push
```

### Step 4: Monitor Deployment

1. Go to Vercel Dashboard → Deployments
2. Watch for the new deployment to complete
3. Check for any errors in the build logs

### Step 5: Test Production

1. Visit your production URL
2. Try adding a person
3. Verify it works
4. Verify data from dev doesn't appear (they should be separate!)

## Verification

After deployment:

**Local Dev:**
- Add a test person → Should only appear in dev database
- Check production site → Test person should NOT appear

**Production:**
- Add a person in production → Should only appear in production database
- Check local dev → Production person should NOT appear

## Troubleshooting

**If production shows errors:**
- Check Vercel deployment logs
- Verify `DATABASE_URL` is correct in Vercel
- Verify production database is initialized

**If production shows dev data:**
- Verify Vercel `DATABASE_URL` points to production database
- Not the dev database!
