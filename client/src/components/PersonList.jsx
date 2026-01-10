import PersonCard from './PersonCard';
import './PersonList.css';

function PersonList({ people, onDelete, loading }) {
  if (loading) {
    return (
      <div className="person-list-empty">
        <p>Loading...</p>
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="person-list-empty">
        <div className="empty-icon">👥</div>
        <h3>No one being monitored yet</h3>
        <p>Click the "Add Person" button to start tracking job changes.</p>
      </div>
    );
  }

  return (
    <div className="person-list">
      {people.map(person => (
        <PersonCard 
          key={person.id} 
          person={person} 
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default PersonList;
