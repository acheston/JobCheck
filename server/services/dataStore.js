import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'people.json');

/**
 * Read all people from the JSON file
 * @returns {Promise<Array>} Array of people objects
 */
export async function getAllPeople() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.people || [];
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
  const people = await getAllPeople();
  return people.find(p => p.id === id) || null;
}

/**
 * Add a new person to the monitoring list
 * @param {Object} personData - Person data from search results
 * @returns {Promise<Object>} The created person object
 */
export async function addPerson(personData) {
  const people = await getAllPeople();
  
  const newPerson = {
    id: uuidv4(),
    name: personData.name,
    imageUrl: personData.imageUrl || null,
    lastChecked: formatDate(new Date()),
    currentJob: {
      company: personData.company,
      role: personData.role || 'Unknown',
      startDate: formatDate(new Date())
    },
    jobHistory: []
  };

  people.push(newPerson);
  await savePeople(people);
  
  return newPerson;
}

/**
 * Update a person's information (e.g., after detecting a job change)
 * @param {string} id - Person's UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated person or null if not found
 */
export async function updatePerson(id, updates) {
  const people = await getAllPeople();
  const index = people.findIndex(p => p.id === id);
  
  if (index === -1) return null;

  // If job has changed, move current job to history
  if (updates.currentJob && 
      (updates.currentJob.company !== people[index].currentJob.company ||
       updates.currentJob.role !== people[index].currentJob.role)) {
    
    const oldJob = {
      ...people[index].currentJob,
      endDate: formatDate(new Date())
    };
    people[index].jobHistory.unshift(oldJob);
  }

  people[index] = {
    ...people[index],
    ...updates,
    lastChecked: formatDate(new Date())
  };

  await savePeople(people);
  return people[index];
}

/**
 * Delete a person from the monitoring list
 * @param {string} id - Person's UUID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function deletePerson(id) {
  const people = await getAllPeople();
  const index = people.findIndex(p => p.id === id);
  
  if (index === -1) return false;

  people.splice(index, 1);
  await savePeople(people);
  
  return true;
}

/**
 * Save people array to JSON file
 * @param {Array} people - Array of people objects
 */
async function savePeople(people) {
  const data = JSON.stringify({ people }, null, 2);
  await fs.writeFile(DATA_FILE, data, 'utf-8');
}

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

export default {
  getAllPeople,
  getPersonById,
  addPerson,
  updatePerson,
  deletePerson
};
