# Troubleshooting: Failed to Add Person Error

## The Problem

You're getting "failed to add person" because the database connection is failing. The error shows:
```
ENOTFOUND ep-little-bonus-ahbkxxum-pooler.c-3.us-east-1.aws.neon.tech
```

## Root Cause

The development database is either:
1. **Still provisioning** (most likely - Neon databases can take 2-5 minutes)
2. **Doesn't exist** in Neon dashboard
3. **Not initialized** (schema not created)

## Solution Steps

### Step 1: Verify Database Exists

1. Go to https://console.neon.tech
2. Check if database `ep-little-bonus-ahbkxxum` exists
3. If it doesn't exist, create it

### Step 2: Wait for Provisioning

If the database was just created, wait 2-5 minutes for it to finish provisioning.

### Step 3: Test Connection

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck/server
node check-db-connection.js
```

If it works, you'll see:
```
✅ Successfully connected to database!
```

### Step 4: Initialize Database Schema

Once connection works:

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck
node db/init.js
```

You should see:
```
Connected to database
Database schema created successfully!
```

### Step 5: Restart Your Dev Server

After initializing:

1. Stop your dev server (Ctrl+C)
2. Restart it:
   ```bash
   cd server
   npm run dev
   ```

### Step 6: Try Adding a Person Again

Now try adding a person in the UI - it should work!

## Quick Check Commands

**Check if database is accessible:**
```bash
cd server && node check-db-connection.js
```

**Initialize database:**
```bash
cd .. && node db/init.js
```

**Check server is running:**
```bash
curl http://localhost:3001/api/health
```

## Common Issues

**"ENOTFOUND" error:**
- Database still provisioning → Wait 2-5 minutes
- Database doesn't exist → Create it in Neon
- Wrong connection string → Check `server/.env`

**"relation 'people' does not exist":**
- Schema not initialized → Run `node db/init.js`

**"column 'email_recipients' does not exist":**
- Migration not run → Run `node server/migrate-email-recipients.js`
