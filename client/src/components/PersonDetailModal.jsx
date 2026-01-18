import { SERVER_URL } from '../config';
import Avatar from './Avatar';
import './PersonDetailModal.css';

function getImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('/images/')) {
    return `${SERVER_URL}${imageUrl}`;
  }
  return imageUrl;
}

function PersonDetailModal({ person, isOpen, onClose, onDelete }) {
  if (!isOpen || !person) return null;

  const { name, imageUrl, currentJob, lastChecked, jobHistory } = person;
  const fullImageUrl = getImageUrl(imageUrl);
  const hasHistory = jobHistory && jobHistory.length > 0;

  const handleDelete = () => {
    if (window.confirm(`Remove ${name} from monitoring?`)) {
      onDelete(person.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="detail-header">
          <div className="detail-image">
            <Avatar name={name} imageUrl={fullImageUrl} size={100} />
          </div>
          
          <div className="detail-title">
            <h2>{name}</h2>
            <p className="detail-meta">Last checked: {lastChecked}</p>
          </div>
        </div>

        <div className="detail-section">
          <h3>Current Position</h3>
          <div className="current-job">
            <div className="job-role">{currentJob?.role || 'Unknown role'}</div>
            <div className="job-company">{currentJob?.company}</div>
            {currentJob?.startDate && (
              <div className="job-date">Since {currentJob.startDate}</div>
            )}
          </div>
        </div>

        {hasHistory && (
          <div className="detail-section">
            <h3>Job History</h3>
            <div className="history-list">
              {jobHistory.map((job, idx) => (
                <div key={idx} className="history-entry">
                  <div className="history-timeline">
                    <div className="timeline-dot"></div>
                    {idx < jobHistory.length - 1 && <div className="timeline-line"></div>}
                  </div>
                  <div className="history-content">
                    <div className="history-role">{job.role}</div>
                    <div className="history-company">{job.company}</div>
                    <div className="history-dates">
                      {job.startDate} — {job.endDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasHistory && (
          <div className="detail-section">
            <h3>Job History</h3>
            <p className="no-history">No previous positions recorded.</p>
          </div>
        )}

        <div className="detail-actions">
          <button className="delete-button" onClick={handleDelete}>
            Remove from Monitoring
          </button>
        </div>
      </div>
    </div>
  );
}

export default PersonDetailModal;
