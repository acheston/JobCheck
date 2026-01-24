# Final Setup Steps - New Databases

## What We Need

1. **Development Database Connection String** (for local `.env`)
2. **Production Database Connection String** (already in Vercel)

## Step 1: Get Your Database Connection Strings

From Neon Dashboard, copy the connection strings for both databases:

1. **Development Database** - Copy the connection string
2. **Production Database** - Copy the connection string (should already be in Vercel)

## Step 2: Update Local .env File

Update `server/.env` with your **development** database connection string:

```env
DATABASE_URL=your_development_database_connection_string_here
```

## Step 3: Initialize Both Databases

### Initialize Development Database:
```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck
node db/init.js
```
(This uses DATABASE_URL from server/.env)

### Initialize Production Database:
```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck
DATABASE_URL=your_production_connection_string node db/init.js
```

## Step 4: Verify Setup

### Check Local Dev:
```bash
cd server
node check-db-connection.js
```
Should show your development database.

### Check Vercel:
- Verify `DATABASE_URL` in Vercel points to production database
- Redeploy if needed
- Test the production site

## Final Configuration

| Environment | Database Source | Database |
|------------|----------------|----------|
| **Local Dev** | `server/.env` → `DATABASE_URL` | Development DB |
| **Vercel Production** | Vercel Env Vars → `DATABASE_URL` | Production DB |
