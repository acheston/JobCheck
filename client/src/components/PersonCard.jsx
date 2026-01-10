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

function PersonCard({ person, onDelete, onClick }) {
  const { name, imageUrl, currentJob, lastChecked, jobHistory } = person;
  const fullImageUrl = getImageUrl(imageUrl);
  const hasHistory = jobHistory && jobHistory.length > 0;

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(person.id);
  };

  return (
    <div className={`person-card ${hasHistory ? 'has-history' : ''}`} onClick={onClick}>
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
          <span className="history-badge">
            {jobHistory.length} previous role{jobHistory.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="person-meta">
        <p className="last-checked">
          Last checked: {lastChecked}
        </p>
        <button 
          className="delete-btn" 
          onClick={handleDelete}
          title="Remove from monitoring"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default PersonCard;
