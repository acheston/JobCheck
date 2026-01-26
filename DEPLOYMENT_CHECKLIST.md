# Deployment Checklist

## Pre-Deployment

- [x] Test notification page works locally
- [x] Database connection working with new password
- [x] Test contact creation works
- [x] Test notification triggering works

## Files to Deploy

### New Features
- [x] Notification test page component
- [x] Test API endpoints
- [x] Email service for Vercel

### Modified Files
- [x] App.jsx (added test page navigation)
- [x] API routes (test endpoints)
- [x] Server routes (test endpoints)

## Vercel Environment Variables

**IMPORTANT**: Update these in Vercel dashboard before deploying:

1. **DATABASE_URL** - Update with production password: `npg_R3j1zLVwNgtZ`
   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Find `DATABASE_URL`
   - Update the connection string with the new production password
   - Format: `postgresql://neondb_owner:npg_R3j1zLVwNgtZ@ep-hidden-frost-ahjo8ydp-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`

2. **Other variables** (verify they're set):
   - `SERPER_API_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `EMAIL_RECIPIENTS`

## Deployment Steps

1. Commit changes
2. Push to GitHub
3. Vercel will auto-deploy
4. Verify deployment works
5. Test notification page on production

## Post-Deployment Testing

- [ ] Test page loads on production
- [ ] Can create test contact
- [ ] Can trigger notification
- [ ] Email notifications work
