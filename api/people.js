import { readData, writeData } from './_utils/dataStore.js';
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
      const data = await readData();
      return res.status(200).json(data.people || []);
    }

    if (req.method === 'POST') {
      const { name, company, role, imageUrl } = req.body;
      
      if (!name || !company) {
        return res.status(400).json({ error: 'Name and company are required' });
      }

      // Download image if it's an external URL
      let localImageUrl = imageUrl;
      if (imageUrl && imageUrl.startsWith('http')) {
        const downloaded = await downloadImage(imageUrl, name);
        if (downloaded) {
          localImageUrl = downloaded;
        }
      }

      const data = await readData();
      const newPerson = {
        id: crypto.randomUUID(),
        name,
        imageUrl: localImageUrl,
        lastChecked: formatDate(new Date()),
        currentJob: {
          company,
          role: role || 'Unknown',
          startDate: formatDate(new Date())
        },
        jobHistory: []
      };

      data.people.push(newPerson);
      await writeData(data);
      
      return res.status(201).json(newPerson);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
