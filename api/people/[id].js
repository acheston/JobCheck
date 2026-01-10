import { readData, writeData } from '../_utils/dataStore.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    const data = await readData();
    const index = data.people.findIndex(p => p.id === id);

    if (req.method === 'GET') {
      if (index === -1) {
        return res.status(404).json({ error: 'Person not found' });
      }
      return res.status(200).json(data.people[index]);
    }

    if (req.method === 'PUT') {
      if (index === -1) {
        return res.status(404).json({ error: 'Person not found' });
      }

      const updates = req.body;
      
      // If job has changed, move current job to history
      if (updates.currentJob && 
          (updates.currentJob.company !== data.people[index].currentJob?.company ||
           updates.currentJob.role !== data.people[index].currentJob?.role)) {
        
        const oldJob = {
          ...data.people[index].currentJob,
          endDate: formatDate(new Date())
        };
        data.people[index].jobHistory.unshift(oldJob);
      }

      data.people[index] = {
        ...data.people[index],
        ...updates,
        lastChecked: formatDate(new Date())
      };

      await writeData(data);
      return res.status(200).json(data.people[index]);
    }

    if (req.method === 'DELETE') {
      if (index === -1) {
        return res.status(404).json({ error: 'Person not found' });
      }

      data.people.splice(index, 1);
      await writeData(data);
      
      return res.status(200).json({ message: 'Person deleted successfully' });
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
