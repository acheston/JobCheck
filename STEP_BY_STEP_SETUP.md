# Step-by-Step: Development & Production Database Setup

## Part 1: Development Database Setup

### Step 1.1: Verify Development Database Exists

1. Go to https://console.neon.tech
2. Check if you have a database with connection string containing: `ep-aged-pine-ah06q9tt`
3. If it doesn't exist, create a new project/database for development

### Step 1.2: Update Local .env (Already Done ✅)

Your `server/.env` is already configured with:
```
DATABASE_URL=postgresql://neondb_owner:npg_Na94uXrdpSTj@ep-aged-pine-ah06q9tt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Step 1.3: Initialize Development Database

Once the database is accessible, run:

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck
node db/init.js
```

Expected output:
```
Connected to database
Database schema created successfully!
```

If you get connection errors:
- Wait a few minutes (database might still be provisioning)
- Verify the database exists in Neon dashboard
- Check the connection string is correct

### Step 1.4: Verify Development Database

```bash
cd server
node check-db-connection.js
```

Should show:
- Host: `ep-aged-pine-ah06q9tt-pooler.c-3.us-east-1.aws.neon.tech`
- Database: `neondb`
- ✅ Successfully connected

### Step 1.5: Test Local Development

```bash
cd server
npm run dev
```

Add a test person - it should only appear in your dev database.

---

## Part 2: Production Database Setup

### Step 2.1: Create Production Database in Neon

1. Go to https://console.neon.tech
2. Click **"Create Project"** (or use existing project)
3. Name it: **"JobCheck Production"**
4. Choose region (same as dev for consistency)
5. Click **"Create Project"**

### Step 2.2: Get Production Connection String

1. In your new production project, go to **"Connection Details"**
2. Copy the **pooled connection string** (recommended)
3. It will look like:
   ```
   postgresql://user:password@ep-production-pooler.us-east-1.aws.neon.tech/prod_db?sslmode=require
   ```

### Step 2.3: Initialize Production Database

Run the init script with the production connection string:

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck
DATABASE_URL=your_production_connection_string node db/init.js
```

Replace `your_production_connection_string` with the actual string from Neon.

### Step 2.4: Configure Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` (or create it)
5. Set value to your **production database** connection string
6. Set for **All Environments** (or Production if you can restrict)
7. **Save**

### Step 2.5: Redeploy Production

1. Go to **Deployments** tab
2. Click **three dots** (⋯) on latest deployment
3. Click **Redeploy**

---

## Final Configuration Summary

| Environment | Configuration | Database |
|------------|--------------|----------|
| **Local Dev** | `server/.env` → `DATABASE_URL` | Development (`ep-aged-pine-ah06q9tt`) |
| **Vercel Production** | Vercel Env Vars → `DATABASE_URL` | Production (new database) |

## Verification

✅ **Development:**
- Local dev connects to dev database
- Test data stays in dev database
- Production app not affected

✅ **Production:**
- Vercel uses production database
- Real user data in production
- Dev testing doesn't affect production

## Troubleshooting

**Connection Errors:**
- Wait a few minutes for database provisioning
- Verify database exists in Neon dashboard
- Check connection string is correct
- Ensure `sslmode=require` is in connection string

**Wrong Database:**
- Check `server/.env` for local dev
- Check Vercel environment variables for production
- Use `node check-db-connection.js` to verify local
