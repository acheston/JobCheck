# JobCheck

A web application that monitors people for job changes. Track your professional network and get notified when someone changes roles.

## Quick Start

### Prerequisites

- Node.js 18+
- A Serper API key (get one at https://serper.dev)

### Setup

1. **Clone and install dependencies**

   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

2. **Configure your API key**

   Create a `.env` file in the `server` directory:

   ```
   SERPER_API_KEY=your_api_key_here
   ```

3. **Start the application**

   Open two terminal windows:

   ```bash
   # Terminal 1: Start the backend
   cd server
   npm run dev
   ```

   ```bash
   # Terminal 2: Start the frontend
   cd client
   npm run dev
   ```

4. **Open the app**

   Navigate to http://localhost:5173

## Usage

1. Click **"Add Person"** to start monitoring someone
2. Enter their name and current company
3. Click **"Next"** to search for their information
4. Review the results and click **"Add to List"**
5. The person will now appear in your monitoring list

## Project Structure

```
JobCheck/
├── client/          # React frontend
├── server/          # Node.js backend
├── REQUIREMENTS.md  # Detailed requirements & docs
└── README.md        # This file
```

See [REQUIREMENTS.md](./REQUIREMENTS.md) for detailed documentation.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Data**: JSON file storage
- **API**: Serper (Google Search API)

## License

MIT
