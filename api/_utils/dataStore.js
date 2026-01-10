// For Vercel, we'll use Vercel KV or a simple JSON blob storage
// For now, we'll use environment variable to store data or fall back to in-memory

let inMemoryData = {
  people: []
};

// In production, you'd use Vercel KV, Upstash, or another database
// For demo purposes, this uses in-memory storage (resets on cold start)

export async function readData() {
  // Try to read from environment or use in-memory
  if (process.env.PEOPLE_DATA) {
    try {
      return JSON.parse(process.env.PEOPLE_DATA);
    } catch (e) {
      console.error('Failed to parse PEOPLE_DATA');
    }
  }
  return inMemoryData;
}

export async function writeData(data) {
  // In serverless, we can't persist to filesystem
  // This is a limitation - for production, use a database
  inMemoryData = data;
  return data;
}
