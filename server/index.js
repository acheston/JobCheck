import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables FIRST before any other imports
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes after dotenv.config() so database client can read env vars
import peopleRoutes from './routes/people.js';
import searchRoutes from './routes/search.js';
import jobCheckRoutes from './routes/jobCheck.js';
import { startScheduler } from './services/jobChecker.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Routes
app.use('/api/people', peopleRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/job-check', jobCheckRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Start the weekly job checker scheduler
  startScheduler();
});
