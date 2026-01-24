import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, queryMany } from '../../db/client.js';

/**
 * Format date as DD/MM/YYYY
 * @param {Date} date 
 * @returns {string}
 */
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Convert database row to person object format
 */
function rowToPerson(row) {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    lastChecked: row.last_checked,
    currentJob: row.current_job,
    jobHistory: row.job_history || [],
    emailRecipients: row.email_recipients || []
  };
}

/**
 * Read all people from the database
 * @returns {Promise<Array>} Array of people objects
 */
export async function getAllPeople() {
  try {
    const rows = await queryMany(
      'SELECT * FROM people ORDER BY created_at DESC'
    );
    return rows.map(rowToPerson);
  } catch (error) {
    console.error('Error reading people data:', error);
    return [];
  }
}

/**
 * Get a single person by ID
 * @param {string} id - Person's UUID
 * @returns {Promise<Object|null>} Person object or null
 */
export async function getPersonById(id) {
  try {
    const row = await queryOne(
      'SELECT * FROM people WHERE id = $1',
      [id]
    );
    return row ? rowToPerson(row) : null;
  } catch (error) {
    console.error('Error getting person by ID:', error);
    return null;
  }
}

/**
 * Add a new person to the monitoring list
 * @param {Object} personData - Person data from search results
 * @returns {Promise<Object>} The created person object
 */
export async function addPerson(personData) {
  const id = uuidv4();
  const lastChecked = formatDate(new Date());
  const currentJob = {
    company: personData.company,
    role: personData.role || 'Unknown',
    startDate: lastChecked
  };
  const jobHistory = [];
  
  // Parse email recipients from comma-separated string or array
  let emailRecipients = [];
  if (personData.emailRecipients) {
    if (Array.isArray(personData.emailRecipients)) {
      emailRecipients = personData.emailRecipients.filter(email => email && email.trim().includes('@'));
    } else if (typeof personData.emailRecipients === 'string') {
      emailRecipients = personData.emailRecipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));
    }
  }

  try {
    await query(
      `INSERT INTO people (id, name, image_url, last_checked, current_job, job_history, email_recipients)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, personData.name, personData.imageUrl || null, lastChecked, JSON.stringify(currentJob), JSON.stringify(jobHistory), emailRecipients]
    );

    return {
      id,
      name: personData.name,
      imageUrl: personData.imageUrl || null,
      lastChecked,
      currentJob,
      jobHistory,
      emailRecipients
    };
  } catch (error) {
    console.error('Error adding person:', error);
    throw error;
  }
}

/**
 * Update a person's information (e.g., after detecting a job change)
 * @param {string} id - Person's UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated person or null if not found
 */
export async function updatePerson(id, updates) {
  try {
    // Get current person
    const current = await getPersonById(id);
    if (!current) return null;

    // Build update object
    const updatedPerson = { ...current, ...updates };
    const lastChecked = formatDate(new Date());

    // If job has changed, move current job to history
    if (updates.currentJob && 
        (updates.currentJob.company !== current.currentJob?.company ||
         updates.currentJob.role !== current.currentJob?.role)) {
      
      const oldJob = {
        ...current.currentJob,
        endDate: lastChecked
      };
      updatedPerson.jobHistory = [oldJob, ...(current.jobHistory || [])];
    }

    updatedPerson.lastChecked = lastChecked;

    // Handle email recipients update if provided
    if (updates.emailRecipients !== undefined) {
      let emailRecipients = [];
      if (Array.isArray(updates.emailRecipients)) {
        emailRecipients = updates.emailRecipients.filter(email => email && email.trim().includes('@'));
      } else if (typeof updates.emailRecipients === 'string') {
        emailRecipients = updates.emailRecipients
          .split(',')
          .map(email => email.trim())
          .filter(email => email && email.includes('@'));
      }
      updatedPerson.emailRecipients = emailRecipients;
    }

    // Update database
    await query(
      `UPDATE people 
       SET name = $1, image_url = $2, last_checked = $3, 
           current_job = $4, job_history = $5, email_recipients = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [
        updatedPerson.name,
        updatedPerson.imageUrl,
        updatedPerson.lastChecked,
        JSON.stringify(updatedPerson.currentJob),
        JSON.stringify(updatedPerson.jobHistory || []),
        updatedPerson.emailRecipients || [],
        id
      ]
    );

    return updatedPerson;
  } catch (error) {
    console.error('Error updating person:', error);
    return null;
  }
}

/**
 * Delete a person from the monitoring list
 * @param {string} id - Person's UUID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function deletePerson(id) {
  try {
    const result = await query(
      'DELETE FROM people WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting person:', error);
    return false;
  }
}

export default {
  getAllPeople,
  getPersonById,
  addPerson,
  updatePerson,
  deletePerson
};
