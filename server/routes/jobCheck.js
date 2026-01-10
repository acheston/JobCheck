import express from 'express';
import { runJobCheck, getStatus } from '../services/jobChecker.js';

const router = express.Router();

/**
 * GET /api/job-check/status
 * Get the status of the job checker
 */
router.get('/status', (req, res) => {
  const status = getStatus();
  res.json(status);
});

/**
 * POST /api/job-check/run
 * Manually trigger a job check for all people
 */
router.post('/run', async (req, res) => {
  try {
    const result = await runJobCheck();
    res.json(result);
  } catch (error) {
    console.error('Error running job check:', error);
    res.status(500).json({ error: 'Failed to run job check' });
  }
});

export default router;
