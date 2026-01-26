import { getPersonById, updatePerson } from './_utils/dataStore.js';
import { sendJobChangeAlert } from './_utils/emailService.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { newRole, newCompany, triggerNotification } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Person ID is required as query parameter' });
    }

    if (!triggerNotification) {
      return res.status(400).json({ error: 'This endpoint requires triggerNotification: true' });
    }

    // Get current person
    const currentPerson = await getPersonById(id);
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
    const updatedPerson = await updatePerson(id, updates);
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

    return res.status(200).json({
      updatedPerson,
      notificationResult
    });
  } catch (error) {
    console.error('Error in test update:', error);
    return res.status(500).json({ error: `Failed to update and notify: ${error.message}` });
  }
}
