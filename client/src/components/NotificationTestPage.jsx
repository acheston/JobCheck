import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './NotificationTestPage.css';

function NotificationTestPage() {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notificationResult, setNotificationResult] = useState(null);

  // Form state for creating test contact
  const [createForm, setCreateForm] = useState({
    name: '',
    role: '',
    company: '',
    emailRecipients: ''
  });

  // Form state for updating contact
  const [updateForm, setUpdateForm] = useState({
    newRole: '',
    newCompany: ''
  });

  // Fetch all contacts on mount and after updates
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const response = await fetch(`${API_URL}/people`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setContacts(data);
      
      // If we had a selected contact, update it with fresh data
      if (selectedContact) {
        const updated = data.find(c => c.id === selectedContact.id);
        if (updated) {
          setSelectedContact(updated);
        }
      }
    } catch (err) {
      setError('Failed to load contacts: ' + err.message);
      console.error('Fetch contacts error:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setUpdateForm({
      newRole: '',
      newCompany: ''
    });
    setNotificationResult(null);
    setError('');
    setSuccess('');
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setNotificationResult(null);

    try {
      const emailRecipients = createForm.emailRecipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const response = await fetch(`${API_URL}/people/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: createForm.name,
          role: createForm.role,
          company: createForm.company,
          emailRecipients: emailRecipients,
          skipSearch: true // Don't trigger Serper search
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create test contact');
      }

      const data = await response.json();
      setSuccess('Test contact created successfully!');
      
      // Reset create form
      setCreateForm({
        name: '',
        role: '',
        company: '',
        emailRecipients: ''
      });

      // Refresh contacts list and select the new contact
      await fetchContacts();
      setSelectedContact(data);
    } catch (err) {
      setError(err.message);
      console.error('Create error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerNotification = async (e) => {
    e.preventDefault();
    if (!selectedContact) {
      setError('Please select a contact first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setNotificationResult(null);

    try {
      const response = await fetch(`${API_URL}/people-test-update?id=${selectedContact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newRole: updateForm.newRole,
          newCompany: updateForm.newCompany,
          triggerNotification: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger notification');
      }

      const data = await response.json();
      setNotificationResult(data.notificationResult);
      setSuccess('Notification triggered successfully!');
      
      // Reset update form
      setUpdateForm({
        newRole: '',
        newCompany: ''
      });

      // Refresh contacts list to get updated data
      await fetchContacts();
    } catch (err) {
      setError(err.message);
      console.error('Notification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedContact(null);
    setNotificationResult(null);
    setError('');
    setSuccess('');
    setUpdateForm({
      newRole: '',
      newCompany: ''
    });
  };

  return (
    <div className="notification-test-page">
      <div className="test-page-header">
        <h1>🧪 Job Change Notification Test</h1>
        <p>Test the job change notification system without triggering Serper searches</p>
      </div>

      <div className="test-page-content">
        {error && (
          <div className="test-error">
            <strong>Error:</strong> {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {success && (
          <div className="test-success">
            {success}
            <button onClick={() => setSuccess('')}>×</button>
          </div>
        )}

        {/* Contacts List Section */}
        <div className="test-section">
          <h2>1. All Contacts</h2>
          <p className="section-description">
            Select a contact to edit and trigger notifications, or create a new test contact.
          </p>
          
          {loadingContacts ? (
            <p>Loading contacts...</p>
          ) : (
            <div className="contacts-list">
              {contacts.length === 0 ? (
                <p className="no-contacts">No contacts found. Create one below!</p>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`contact-item ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className="contact-item-info">
                      <h4>{contact.name}</h4>
                      <p>{contact.currentJob?.role || 'N/A'} at {contact.currentJob?.company || 'N/A'}</p>
                      {contact.emailRecipients && contact.emailRecipients.length > 0 && (
                        <small>{contact.emailRecipients.length} email recipient(s)</small>
                      )}
                    </div>
                    {selectedContact?.id === contact.id && (
                      <span className="selected-badge">Selected</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Create Test Contact Section */}
        <div className="test-section">
          <h2>2. Create Test Contact</h2>
          <p className="section-description">
            Create a fake contact with a fake role. This will NOT trigger a Serper search.
          </p>
          
          <form onSubmit={handleCreateContact} className="test-form">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                id="name"
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role *</label>
              <input
                id="role"
                type="text"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                placeholder="Software Engineer"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="company">Company *</label>
              <input
                id="company"
                type="text"
                value={createForm.company}
                onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                placeholder="Acme Corp"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="emailRecipients">Email Recipients *</label>
              <input
                id="emailRecipients"
                type="text"
                value={createForm.emailRecipients}
                onChange={(e) => setCreateForm({ ...createForm, emailRecipients: e.target.value })}
                placeholder="test@example.com, another@example.com"
                required
                disabled={loading}
              />
              <small>Comma-separated list of email addresses</small>
            </div>

            <button type="submit" className="test-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create Test Contact'}
            </button>
          </form>
        </div>

        {/* Selected Contact Details */}
        {selectedContact && (
          <div className="test-section">
            <h2>3. Selected Contact Details</h2>
            <div className="contact-display">
              <div className="contact-info">
                <h3>{selectedContact.name}</h3>
                <p><strong>Current Role:</strong> {selectedContact.currentJob?.role || 'N/A'}</p>
                <p><strong>Current Company:</strong> {selectedContact.currentJob?.company || 'N/A'}</p>
                <p><strong>Email Recipients:</strong></p>
                <ul>
                  {selectedContact.emailRecipients && selectedContact.emailRecipients.length > 0 ? (
                    selectedContact.emailRecipients.map((email, idx) => (
                      <li key={idx}>{email}</li>
                    ))
                  ) : (
                    <li>None</li>
                  )}
                </ul>
              </div>
              <button onClick={handleClearSelection} className="clear-button">
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Trigger Notification Section */}
        {selectedContact && (
          <div className="test-section">
            <h2>4. Trigger Notification</h2>
            <p className="section-description">
              Update the contact's role and/or company to trigger a job change notification.
            </p>
            
            <form onSubmit={handleTriggerNotification} className="test-form">
              <div className="form-group">
                <label htmlFor="newRole">New Role</label>
                <input
                  id="newRole"
                  type="text"
                  value={updateForm.newRole}
                  onChange={(e) => setUpdateForm({ ...updateForm, newRole: e.target.value })}
                  placeholder="Senior Software Engineer"
                  disabled={loading}
                />
                <small>Leave empty to keep current role</small>
              </div>

              <div className="form-group">
                <label htmlFor="newCompany">New Company</label>
                <input
                  id="newCompany"
                  type="text"
                  value={updateForm.newCompany}
                  onChange={(e) => setUpdateForm({ ...updateForm, newCompany: e.target.value })}
                  placeholder="New Company Inc"
                  disabled={loading}
                />
                <small>Leave empty to keep current company</small>
              </div>

              <button type="submit" className="test-button trigger-button" disabled={loading}>
                {loading ? 'Triggering...' : '🚨 Trigger Notification'}
              </button>
            </form>
          </div>
        )}

        {/* Notification Result */}
        {notificationResult && (
          <div className="test-section">
            <h2>5. Notification Result</h2>
            <div className={`notification-result ${notificationResult.success ? 'success' : 'error'}`}>
              {notificationResult.success ? (
                <div>
                  <p><strong>✅ Notification sent successfully!</strong></p>
                  <p>Emails sent to {notificationResult.emailIds?.length || 0} recipient(s)</p>
                  {notificationResult.emailIds && notificationResult.emailIds.length > 0 && (
                    <p>Email ID(s): {notificationResult.emailIds.join(', ')}</p>
                  )}
                </div>
              ) : (
                <div>
                  <p><strong>❌ Notification failed</strong></p>
                  <p>Error: {notificationResult.error || 'Unknown error'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationTestPage;
