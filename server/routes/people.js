import express from 'express';
import { 
  getAllPeople, 
  getPersonById, 
  addPerson, 
  updatePerson, 
  deletePerson 
} from '../services/dataStore.js';
import { downloadImage } from '../services/serper.js';

const router = express.Router();

/**
 * GET /api/people
 * Get all monitored people
 */
router.get('/', async (req, res) => {
  try {
    const people = await getAllPeople();
    res.json(people);
  } catch (error) {
    console.error('Error fetching people:', error);
    res.status(500).json({ error: 'Failed to fetch people' });
  }
});

/**
 * GET /api/people/:id
 * Get a single person by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const person = await getPersonById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    res.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({ error: 'Failed to fetch person' });
  }
});

/**
 * POST /api/people
 * Add a new person to monitoring list
 * Body: { name, company, role, imageUrl }
 * imageUrl can be an external URL - it will be downloaded and stored locally
 */
router.post('/', async (req, res) => {
  try {
    const { name, company, role, imageUrl } = req.body;
    
    if (!name || !company) {
      return res.status(400).json({ error: 'Name and company are required' });
    }

    // Download the image if it's an external URL
    let localImageUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith('http')) {
      const downloaded = await downloadImage(imageUrl, name);
      if (downloaded) {
        localImageUrl = downloaded;
      }
    }

    const person = await addPerson({ name, company, role, imageUrl: localImageUrl });
    res.status(201).json(person);
  } catch (error) {
    console.error('Error adding person:', error);
    console.error('Error stack:', error.stack);
    // Send more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to add person: ${error.message}` 
      : 'Failed to add person';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * PUT /api/people/:id
 * Update a person's information
 * Body: { currentJob: { company, role } }
 */
router.put('/:id', async (req, res) => {
  try {
    const person = await updatePerson(req.params.id, req.body);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    res.json(person);
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ error: 'Failed to update person' });
  }
});

/**
 * DELETE /api/people/:id
 * Remove a person from monitoring list
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deletePerson(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Person not found' });
    }
    res.json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ error: 'Failed to delete person' });
  }
});

export default router;
