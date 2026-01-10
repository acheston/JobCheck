import { searchPerson } from './_utils/serper.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, company } = req.body;
    
    if (!name || !company) {
      return res.status(400).json({ error: 'Name and company are required' });
    }

    const results = await searchPerson(name, company);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Search error:', error);
    
    if (error.message.includes('SERPER_API_KEY')) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    return res.status(500).json({ error: 'Search failed' });
  }
}
