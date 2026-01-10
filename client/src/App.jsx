import { useState, useEffect } from 'react';
import PersonList from './components/PersonList';
import AddPersonModal from './components/AddPersonModal';
import PersonDetailModal from './components/PersonDetailModal';
import { API_URL } from './config';
import './App.css';

function App() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [error, setError] = useState('');

  // Fetch people on mount
  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      const response = await fetch(`${API_URL}/people`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPeople(data);
    } catch (err) {
      setError('Failed to load people. Make sure the server is running.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonAdded = (newPerson) => {
    setPeople(prev => [...prev, newPerson]);
  };

  const handleDeletePerson = async (id) => {
    try {
      const response = await fetch(`${API_URL}/people/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      setPeople(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError('Failed to delete person.');
      console.error('Delete error:', err);
    }
  };

  const handleCheckNow = async () => {
    if (checking || people.length === 0) return;
    
    setChecking(true);
    setCheckResults(null);
    setError('');

    try {
      const response = await fetch(`${API_URL}/job-check/run`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to run check');
      
      const result = await response.json();
      setCheckResults(result);
      
      // Refresh the people list to get updated data
      await fetchPeople();
      
      // Show results briefly
      setTimeout(() => setCheckResults(null), 10000);
    } catch (err) {
      setError('Failed to check for job changes.');
      console.error('Check error:', err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>JobCheck</h1>
          <p className="subtitle">Monitor job changes for your network</p>
        </div>
        <div className="header-actions">
          <button 
            className="check-button" 
            onClick={handleCheckNow}
            disabled={checking || people.length === 0}
            title="Check all people for job changes"
          >
            {checking ? '⏳ Checking...' : '🔄 Check Now'}
          </button>
          <button 
            className="add-button" 
            onClick={() => setIsModalOpen(true)}
          >
            + Add Person
          </button>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="app-error">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {checkResults && (
          <div className={`check-results ${checkResults.changesDetected > 0 ? 'has-changes' : ''}`}>
            <div className="check-results-content">
              <strong>
                {checkResults.changesDetected > 0 
                  ? `🎉 ${checkResults.changesDetected} job change${checkResults.changesDetected > 1 ? 's' : ''} detected!`
                  : '✓ No job changes detected'}
              </strong>
              <span className="check-meta">
                Checked {checkResults.totalChecked} people in {checkResults.duration}
              </span>
            </div>
            <button onClick={() => setCheckResults(null)}>×</button>
          </div>
        )}
        
        <PersonList 
          people={people} 
          onDelete={handleDeletePerson}
          onPersonClick={setSelectedPerson}
          loading={loading}
        />
      </main>

      <AddPersonModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPersonAdded={handlePersonAdded}
      />

      <PersonDetailModal
        person={selectedPerson}
        isOpen={selectedPerson !== null}
        onClose={() => setSelectedPerson(null)}
        onDelete={handleDeletePerson}
      />
    </div>
  );
}

export default App;
