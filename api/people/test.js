import { addPerson } from '../_utils/dataStore.js';

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
    const { name, company, role, emailRecipients, skipSearch } = req.body;
    
    if (!name || !company) {
      return res.status(400).json({ error: 'Name and company are required' });
    }

    if (!skipSearch) {
      return res.status(400).json({ error: 'This endpoint requires skipSearch: true' });
    }

    // Create person directly without Serper search
    const person = await addPerson({ 
      name, 
      company, 
      role: role || 'Unknown', 
      imageUrl: null, 
      emailRecipients 
    });
    
    return res.status(201).json(person);
  } catch (error) {
    console.error('Error creating test person:', error);
    return res.status(500).json({ error: `Failed to create test person: ${error.message}` });
  }
}
