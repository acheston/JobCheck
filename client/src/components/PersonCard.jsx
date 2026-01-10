import { useState } from 'react';
import { SERVER_URL } from '../config';
import './PersonCard.css';

// Convert image URL to full URL if it's a local path
function getImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('/images/')) {
    return `${SERVER_URL}${imageUrl}`;
  }
  return imageUrl;
}

function PersonCard({ person, onDelete }) {
  const { name, imageUrl, currentJob, lastChecked, jobHistory } = person;
  const fullImageUrl = getImageUrl(imageUrl);
  const [showHistory, setShowHistory] = useState(false);
  const hasHistory = jobHistory && jobHistory.length > 0;

  return (
    <div className={`person-card ${hasHistory ? 'has-history' : ''}`}>
      <div className="person-image">
        {fullImageUrl ? (
          <img src={fullImageUrl} alt={name} />
        ) : (
          <div className="placeholder-image">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="person-info">
        <h3 className="person-name">{name}</h3>
        <p className="person-role">{currentJob?.role || 'Unknown role'}</p>
        <p className="person-company">{currentJob?.company}</p>
        
        {hasHistory && (
          <button 
            className="history-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '▼' : '▶'} {jobHistory.length} previous role{jobHistory.length > 1 ? 's' : ''}
          </button>
        )}

        {showHistory && hasHistory && (
          <div className="job-history">
            {jobHistory.map((job, idx) => (
              <div key={idx} className="history-item">
                <span className="history-role">{job.role}</span>
                <span className="history-company">{job.company}</span>
                <span className="history-dates">
                  {job.startDate} - {job.endDate}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="person-meta">
        <p className="last-checked">
          Last checked: {lastChecked}
        </p>
        <button 
          className="delete-btn" 
          onClick={() => onDelete(person.id)}
          title="Remove from monitoring"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default PersonCard;
