import express from 'express';
import { 
  getAllPeople, 
  getPersonById, 
  addPerson, 
  updatePerson, 
  deletePerson 
} from '../services/dataStore.js';
import { downloadImage } from '../services/serper.js';
import { sendJobChangeAlert } from '../services/emailService.js';

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
    const { name, company, role, imageUrl, emailRecipients } = req.body;
    
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

    const person = await addPerson({ name, company, role, imageUrl: localImageUrl, emailRecipients });
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
 * POST /api/people/test
 * Create a test person without triggering Serper search
 * Body: { name, company, role, emailRecipients, skipSearch: true }
 */
router.post('/test', async (req, res) => {
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
    
    res.status(201).json(person);
  } catch (error) {
    console.error('Error creating test person:', error);
    res.status(500).json({ error: `Failed to create test person: ${error.message}` });
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
 * PUT /api/people/:id/test-update
 * Update a person and trigger notification (for testing)
 * Body: { newRole, newCompany, triggerNotification: true }
 */
router.put('/:id/test-update', async (req, res) => {
  try {
    const { newRole, newCompany, triggerNotification } = req.body;
    
    if (!triggerNotification) {
      return res.status(400).json({ error: 'This endpoint requires triggerNotification: true' });
    }

    // Get current person
    const currentPerson = await getPersonById(req.params.id);
    if (!currentPerson) {
      return res.status(404).json({ error: 'Person not found' });
    }

    // Build update object
    const updates = {
      currentJob: {
        ...currentPerson.currentJob,
        role: newRole || currentPerson.currentJob?.role,
        company: newCompany || currentPerson.currentJob?.company
      }
    };

    // Check if there's actually a change
    const roleChanged = newRole && newRole !== currentPerson.currentJob?.role;
    const companyChanged = newCompany && newCompany !== currentPerson.currentJob?.company;

    if (!roleChanged && !companyChanged) {
      return res.status(400).json({ 
        error: 'No changes detected. Please provide a new role or company.' 
      });
    }

    // Update the person
    const updatedPerson = await updatePerson(req.params.id, updates);
    if (!updatedPerson) {
      return res.status(500).json({ error: 'Failed to update person' });
    }

    // Trigger notification
    let notificationResult = null;
    try {
      notificationResult = await sendJobChangeAlert({
        personName: updatedPerson.name,
        previousRole: currentPerson.currentJob?.role,
        previousCompany: currentPerson.currentJob?.company,
        newRole: updatedPerson.currentJob?.role,
        newCompany: updatedPerson.currentJob?.company,
        confidence: 100, // 100% confidence for manual test updates
        evidence: [],
        recipients: updatedPerson.emailRecipients || []
      });
    } catch (emailError) {
      console.error('Error sending notification:', emailError);
      notificationResult = {
        success: false,
        error: emailError.message
      };
    }

    res.json({
      updatedPerson,
      notificationResult
    });
  } catch (error) {
    console.error('Error in test update:', error);
    res.status(500).json({ error: `Failed to update and notify: ${error.message}` });
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
