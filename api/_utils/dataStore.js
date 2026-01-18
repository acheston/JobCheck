import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, queryMany } from '../../../db/client.js';

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
    jobHistory: row.job_history || []
  };
}

/**
 * Read all people from the database
 * @returns {Promise<Array>} Array of people objects
 */
export async function readData() {
  try {
    const rows = await queryMany(
      'SELECT * FROM people ORDER BY created_at DESC'
    );
    return { people: rows.map(rowToPerson) };
  } catch (error) {
    console.error('Error reading people data:', error);
    return { people: [] };
  }
}

/**
 * Write data (kept for backward compatibility, but not used in database version)
 */
export async function writeData(data) {
  // This is a no-op in database version
  // Data is written through specific functions (addPerson, updatePerson, etc.)
  return data;
}

/**
 * Get all people
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
 * Add a new person
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

  try {
    await query(
      `INSERT INTO people (id, name, image_url, last_checked, current_job, job_history)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, personData.name, personData.imageUrl || null, lastChecked, JSON.stringify(currentJob), JSON.stringify(jobHistory)]
    );

    return {
      id,
      name: personData.name,
      imageUrl: personData.imageUrl || null,
      lastChecked,
      currentJob,
      jobHistory
    };
  } catch (error) {
    console.error('Error adding person:', error);
    throw error;
  }
}

/**
 * Update a person
 */
export async function updatePerson(id, updates) {
  try {
    const current = await getPersonById(id);
    if (!current) return null;

    const updatedPerson = { ...current, ...updates };
    const lastChecked = formatDate(new Date());

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

    await query(
      `UPDATE people 
       SET name = $1, image_url = $2, last_checked = $3, 
           current_job = $4, job_history = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [
        updatedPerson.name,
        updatedPerson.imageUrl,
        updatedPerson.lastChecked,
        JSON.stringify(updatedPerson.currentJob),
        JSON.stringify(updatedPerson.jobHistory || []),
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
 * Delete a person
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
