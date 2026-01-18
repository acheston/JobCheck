import { getAllPeople, addPerson } from './_utils/dataStore.js';
import { downloadImage } from './_utils/serper.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const people = await getAllPeople();
      return res.status(200).json(people);
    }

    if (req.method === 'POST') {
      const { name, company, role, imageUrl } = req.body;
      
      if (!name || !company) {
        return res.status(400).json({ error: 'Name and company are required' });
      }

      // Download image if it's an external URL (in serverless, this just returns the URL)
      let localImageUrl = imageUrl;
      if (imageUrl && imageUrl.startsWith('http')) {
        const downloaded = await downloadImage(imageUrl, name);
        if (downloaded) {
          localImageUrl = downloaded;
        }
      }

      const newPerson = await addPerson({
        name,
        company,
        role,
        imageUrl: localImageUrl
      });
      
      return res.status(201).json(newPerson);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    console.error('Error stack:', error.stack);
    // Send more detailed error in development/debugging
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : `Error: ${error.message}`;
    return res.status(500).json({ error: errorMessage, details: error.message });
  }
}
