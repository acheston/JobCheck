# Development vs Production Database Setup

This guide explains how to set up separate databases for development and production to prevent test data from appearing in your production app.

## Overview

- **Development Database**: Used for local development and testing
- **Production Database**: Used by Vercel deployment (your live app)

## Step 1: Create a Development Database in Neon

1. **Log into Neon Dashboard**: https://console.neon.tech
2. **Create a New Project** (or use an existing project):
   - Click "Create Project"
   - Name it something like "JobCheck Dev" or "JobCheck Development"
   - Choose a region (same as production for consistency)
   - Click "Create Project"

3. **Get the Development Connection String**:
   - In your new project, go to "Connection Details"
   - Copy the connection string (it will look like):
     ```
     postgresql://dev_user:dev_password@ep-dev-instance-pooler.us-east-1.aws.neon.tech/dev_db?sslmode=require
     ```

## Step 2: Initialize the Development Database

Run the initialization script with your dev database URL:

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck
DATABASE_URL=your_dev_connection_string node db/init.js
```

Or if you've added it to `server/.env`:

```bash
cd server
node ../db/init.js
```

## Step 3: Update Local Environment Variables

Update `server/.env` to use the development database:

```env
# Development Database (Local)
DATABASE_URL=postgresql://dev_user:dev_password@ep-dev-instance-pooler.us-east-1.aws.neon.tech/dev_db?sslmode=require

# Production Database (for reference only - not used locally)
# DATABASE_URL_PROD=postgresql://prod_user:prod_password@ep-prod-instance-pooler.us-east-1.aws.neon.tech/prod_db?sslmode=require

# API Keys (same for both environments)
SERPER_API_KEY=your_serper_api_key
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=onboarding@resend.dev
EMAIL_RECIPIENTS=your_email@example.com
```

## Step 4: Verify Vercel Uses Production Database

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (job-check-two)
3. **Go to Settings → Environment Variables**
4. **Verify `DATABASE_URL` is set to your PRODUCTION database connection string**

   ⚠️ **Important**: Make sure this is your PRODUCTION database, not the dev one!

5. **Environment-specific variables** (optional but recommended):
   - You can set different values for Production, Preview, and Development
   - For Production: Use your production database
   - For Preview/Development: You could use the dev database if you want

## Step 5: Test the Setup

### Test Local Development:
```bash
cd server
npm run dev
# Add a test person - it should only appear in dev database
```

### Test Production:
- Deploy to Vercel
- Check your production app
- Verify test data from local dev doesn't appear

## Quick Reference

| Environment | Database | Where Configured |
|------------|----------|-----------------|
| **Local Dev** | Development DB | `server/.env` → `DATABASE_URL` |
| **Vercel Production** | Production DB | Vercel Dashboard → Environment Variables → `DATABASE_URL` |

## Migration Scripts

When you need to run migrations:

**For Development:**
```bash
cd server
node migrate-email-recipients.js  # Uses DATABASE_URL from .env
```

**For Production:**
You'll need to run migrations manually via:
- Neon SQL Editor
- Or temporarily set DATABASE_URL to production and run the script
- Or create a migration endpoint in your API (advanced)

## Troubleshooting

### "Data from dev appearing in production"
- Check that `server/.env` has the dev database URL
- Verify Vercel environment variables use the production database URL
- Make sure you're not accidentally using the same database for both

### "Can't connect to database"
- Verify connection strings are correct
- Check that `sslmode=require` is in the connection string
- Ensure your IP is allowed (Neon allows all by default)

### "Migration script affecting wrong database"
- Always check which `DATABASE_URL` is active before running migrations
- Use `echo $DATABASE_URL` to verify before running scripts
