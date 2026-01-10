import express from 'express';
import { searchPerson } from '../services/serper.js';

const router = express.Router();

/**
 * POST /api/search
 * Search for a person's professional information
 * Body: { name, company }
 */
router.post('/', async (req, res) => {
  try {
    const { name, company } = req.body;
    
    if (!name || !company) {
      return res.status(400).json({ error: 'Name and company are required' });
    }

    const results = await searchPerson(name, company);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    
    if (error.message.includes('SERPER_API_KEY')) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
