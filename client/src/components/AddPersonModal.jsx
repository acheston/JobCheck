import { useState } from 'react';
import { API_URL, SERVER_URL } from '../config';
import './AddPersonModal.css';

// Convert image URL to full URL if it's a local path
function getImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('/images/')) {
    return `${SERVER_URL}${imageUrl}`;
  }
  return imageUrl;
}

function AddPersonModal({ isOpen, onClose, onPersonAdded }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetModal = () => {
    setStep(1);
    setName('');
    setCompany('');
    setSearchResults(null);
    setSelectedImageUrl(null);
    setShowImagePicker(false);
    setLoading(false);
    setError('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSearch = async () => {
    if (!name.trim() || !company.trim()) {
      setError('Please enter both name and company');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), company: company.trim() })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      setSearchResults(results);
      setSelectedImageUrl(results.imageUrl);
      setStep(2);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPerson = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/people`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: searchResults.name,
          company: searchResults.company,
          role: searchResults.role,
          imageUrl: selectedImageUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add person');
      }

      const newPerson = await response.json();
      onPersonAdded(newPerson);
      handleClose();
    } catch (err) {
      setError('Failed to add person. Please try again.');
      console.error('Add person error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAgain = () => {
    setStep(1);
    setSearchResults(null);
    setSelectedImageUrl(null);
    setShowImagePicker(false);
    setError('');
  };

  const handleImageClick = () => {
    if (searchResults?.imageCandidates?.length > 1) {
      setShowImagePicker(true);
    }
  };

  const handleSelectImage = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setShowImagePicker(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>×</button>
        
        <h2 className="modal-title">
          {step === 1 ? 'Add Person to Monitor' : 'Confirm Person Details'}
        </h2>

        {error && <div className="modal-error">{error}</div>}

        {step === 1 ? (
          <div className="modal-step">
            <div className="form-group">
              <label htmlFor="name">Person's Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., John Smith"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="company">Current Company</label>
              <input
                type="text"
                id="company"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g., Acme Corporation"
                disabled={loading}
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleSearch}
                disabled={loading || !name.trim() || !company.trim()}
              >
                {loading ? 'Searching...' : 'Next'}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-step">
            {showImagePicker ? (
              <div className="image-picker">
                <div className="image-picker-header">
                  <h3>Select a Photo</h3>
                  <button 
                    className="image-picker-close"
                    onClick={() => setShowImagePicker(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="image-grid">
                  {searchResults.imageCandidates.map((img, idx) => (
                    <div 
                      key={idx}
                      className={`image-option ${selectedImageUrl === img.url ? 'selected' : ''}`}
                      onClick={() => handleSelectImage(img.url)}
                    >
                      <img 
                        src={img.thumbnailUrl || img.url} 
                        alt={`Option ${idx + 1}`}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span className="image-source">{img.source}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="search-results">
                <div 
                  className={`result-image ${searchResults?.imageCandidates?.length > 1 ? 'clickable' : ''}`}
                  onClick={handleImageClick}
                  title={searchResults?.imageCandidates?.length > 1 ? 'Click to choose a different photo' : ''}
                >
                  {selectedImageUrl ? (
                    <>
                      <img src={getImageUrl(selectedImageUrl)} alt={searchResults.name} />
                      {searchResults?.imageCandidates?.length > 1 && (
                        <div className="change-photo-hint">
                          <span>Change photo</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="placeholder-image">
                      {searchResults.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="result-info">
                  <h3>{searchResults.name}</h3>
                  <p className="result-role">
                    {searchResults.role || 'Role not found'}
                  </p>
                  <p className="result-company">{searchResults.company}</p>
                </div>

                {searchResults.rawResults && searchResults.rawResults.length > 0 && (
                  <div className="result-sources">
                    <p className="sources-label">Sources found:</p>
                    <ul>
                      {searchResults.rawResults.slice(0, 3).map((result, idx) => (
                        <li key={idx}>
                          <a href={result.link} target="_blank" rel="noopener noreferrer">
                            {result.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={handleSearchAgain}
                disabled={loading}
              >
                Search Again
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleAddPerson}
                disabled={loading || showImagePicker}
              >
                {loading ? 'Adding...' : 'Add to List'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddPersonModal;
