# JobCheck - Job Change Monitoring App

Monitor job changes for people in your network with automated weekly checks and alerts.

## Features

- 🔍 Search and add people to monitor using Serper API
- 📸 Automatic profile image detection with avatar fallback
- 📅 Weekly automated job change detection
- 📊 Job history tracking
- 🎨 Beautiful, modern UI with React

## Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express (local dev) / Vercel Serverless (production)
- **Database**: Neon PostgreSQL
- **APIs**: Serper Search API

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/acheston/JobCheck.git
cd JobCheck
```

2. Install dependencies:

```bash
# Backend dependencies
cd server && npm install

# Frontend dependencies
cd ../client && npm install
```

3. Set up environment variables:

Create `server/.env`:
```env
SERPER_API_KEY=your_serper_api_key
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

For Vercel deployment, add these as environment variables in the Vercel dashboard.

4. Initialize the database:

```bash
# Make sure DATABASE_URL is set in your environment
DATABASE_URL=your_database_url node db/init.js
```

5. Start the development servers:

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

The app will be available at `http://localhost:5173`

## Database Setup

The app uses Neon PostgreSQL. To set up:

1. Create a Neon database at [neon.tech](https://neon.tech)
2. Copy your connection string (DATABASE_URL)
3. Add it to your `.env` file
4. Run the initialization script: `node db/init.js`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel:
   - `SERPER_API_KEY`
   - `DATABASE_URL` (or `POSTGRES_URL`)
4. Deploy!

The Vercel deployment uses serverless functions in the `/api` directory.

## Project Structure

```
JobCheck/
├── api/              # Vercel serverless functions
├── client/           # React frontend
├── server/           # Express backend (local dev)
├── db/               # Database schema and utilities
└── README.md
```

## License

MIT
