# Production Deployment Checklist

## ✅ Completed

- [x] Development database working
- [x] Code changes committed and pushed
- [x] Email recipients feature implemented
- [x] Database schema updated

## ⏳ To Verify After Deployment

### 1. Production Database Initialization

The production database may still be provisioning. Once Vercel deploys, it will try to connect. If you see database errors:

**Initialize production database manually:**
```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck
DATABASE_URL=your_production_connection_string node db/init.js
```

Wait a few minutes if you get connection errors - the database is still provisioning.

### 2. Verify Vercel Environment Variable

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `DATABASE_URL` is set to production:
   ```
   postgresql://user:password@ep-production-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Monitor Deployment

1. Go to Vercel Dashboard → Deployments
2. Watch for the new deployment
3. Check build logs for any errors
4. Wait for deployment to complete

### 4. Test Production

After deployment completes:

1. **Visit your production URL**
2. **Try adding a person** - should work if database is initialized
3. **Verify separation:**
   - Add test person in local dev → Should NOT appear in production
   - Add person in production → Should NOT appear in local dev

### 5. If Production Shows Errors

**Database connection error:**
- Wait 2-5 minutes for database to finish provisioning
- Then initialize it with the command above
- Redeploy if needed

**"Failed to add person" error:**
- Check Vercel deployment logs
- Verify `DATABASE_URL` is correct
- Verify database is initialized

## Current Configuration

| Environment | Database | Status |
|------------|----------|--------|
| **Local Dev** | `ep-little-bonus-ahbkxxum` | ✅ Working |
| **Vercel Production** | `ep-hidden-frost-ahjo8ydp` | ⏳ Deploying |

## Next Steps

1. Wait for Vercel deployment to complete
2. Check production site
3. If database errors, wait a few minutes and initialize production database
4. Test that dev and production are separate
