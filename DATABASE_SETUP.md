# Database Setup Guide

This guide will help you set up the Neon PostgreSQL database for JobCheck.

## Prerequisites

1. A Neon account - Sign up at [neon.tech](https://neon.tech)
2. A Neon database created

## Step 1: Get Your Connection String

1. Log into your Neon dashboard
2. Select your project
3. Go to the "Connection Details" section
4. Copy your connection string (DATABASE_URL)

It will look like:
```
postgresql://neondb_owner:npg_xxxxx@ep-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Step 2: Set Environment Variables

### For Local Development

Add to `server/.env`:
```env
DATABASE_URL=postgresql://neondb_owner:npg_xxxxx@ep-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
SERPER_API_KEY=your_api_key
```

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following:
   - `DATABASE_URL` = your connection string
   - `SERPER_API_KEY` = your Serper API key

## Step 3: Initialize the Database

Run the initialization script to create the database schema:

```bash
# Make sure DATABASE_URL is set in your environment
cd /Users/ariccheston/.cursor/Projects/JobCheck
DATABASE_URL=your_connection_string node db/init.js
```

Or if you have it in your `.env` file:
```bash
cd server
source .env  # or use dotenv
cd ..
node db/init.js
```

You should see:
```
Connected to database
Database schema created successfully!
```

## Step 4: Verify Setup

The database is now ready! The app will automatically use it when you start the server.

## Troubleshooting

### Connection Errors

- Make sure `sslmode=require` is in your connection string
- Check that your IP is allowed (Neon allows all by default)
- Verify your credentials are correct

### Schema Already Exists

The `CREATE TABLE IF NOT EXISTS` statement prevents errors if the schema already exists. You can safely run the init script multiple times.

### Local vs Production

- **Local dev**: Uses `server/.env`
- **Vercel**: Uses environment variables from the dashboard

⚠️ **Important**: For separate dev and production databases, see [DEV_PRODUCTION_DB_SETUP.md](./DEV_PRODUCTION_DB_SETUP.md)

This prevents test data from appearing in your production app.
