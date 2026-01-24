# Fix: Port 3001 Already in Use

## The Error

```
Error: listen EADDRINUSE: address already in use :::3001
```

This means another process is already using port 3001.

## Quick Fix

Run this command to kill the process using port 3001:

```bash
lsof -ti:3001 | xargs kill -9
```

Then restart your server:

```bash
cd /Users/ariccheston/.cursor/Projects/JobCheck/server
npm run dev
```

## Alternative: Use a Different Port

If you want to use a different port temporarily, you can set the PORT environment variable:

```bash
PORT=3002 npm run dev
```

Then update your frontend config to use port 3002, or just kill the process on 3001 and use the default.

## Why This Happens

- You might have another server instance running
- A previous server process didn't shut down properly
- Another application is using port 3001

## Prevention

Always stop your server with `Ctrl+C` before starting a new one, or use the kill command above.
