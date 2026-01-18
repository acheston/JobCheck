import { getPersonById, updatePerson, deletePerson } from '../_utils/dataStore.js';

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
    if (req.method === 'GET') {
      const person = await getPersonById(id);
      if (!person) {
        return res.status(404).json({ error: 'Person not found' });
      }
      return res.status(200).json(person);
    }

    if (req.method === 'PUT') {
      const updates = req.body;
      const updated = await updatePerson(id, updates);
      
      if (!updated) {
        return res.status(404).json({ error: 'Person not found' });
      }

      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const deleted = await deletePerson(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Person not found' });
      }

      return res.status(200).json({ message: 'Person deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
